import qz from 'qz-tray';
import { KJUR, KEYUTIL } from 'jsrsasign';

let _qzPrivateKeyPromise = null;
let _qzCertificatePromise = null;

const QZ_RETRIES = 2;
const QZ_RETRY_DELAY_MS = 1000;
const QZ_CONNECT_TIMEOUT_MS = 15000;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function timeout(promise, ms, label) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout após ${ms}ms: ${label}`)), ms)),
    ]);
}

async function fetchQzText(path, expectedHeader) {
    const response = await timeout(fetch(path, { cache: 'no-store' }), 10000, `FETCH ${path}`);
    if (!response.ok) {
        throw new Error(`${path} nao encontrado (HTTP ${response.status}).`);
    }

    const text = (await response.text()).trim();
    if (!text || !text.includes(expectedHeader)) {
        const contentType = response.headers.get('content-type') || 'desconhecido';
        const hint = text.startsWith('<') || contentType.includes('text/html')
            ? 'O servidor retornou HTML no lugar do arquivo QZ. Confira se public/qz foi publicado no Netlify.'
            : `Conteudo invalido; esperado ${expectedHeader}.`;
        throw new Error(`${path} invalido. ${hint}`);
    }

    return text;
}

async function loadQzPrivateKey() {
    if (!_qzPrivateKeyPromise) {
        _qzPrivateKeyPromise = fetchQzText('/qz/private-key.pem', '-----BEGIN PRIVATE KEY-----');
    }
    try {
        return await _qzPrivateKeyPromise;
    } catch (err) {
        _qzPrivateKeyPromise = null;
        throw err;
    }
}

async function loadQzCertificate() {
    if (!_qzCertificatePromise) {
        _qzCertificatePromise = fetchQzText('/qz/digital-certificate.txt', '-----BEGIN CERTIFICATE-----');
    }
    try {
        return await _qzCertificatePromise;
    } catch (err) {
        _qzCertificatePromise = null;
        throw err;
    }
}

function hexSignatureToBase64(hex) {
    if (KJUR?.lang?.String?.hex2b64) {
        return KJUR.lang.String.hex2b64(hex);
    }
    const bytes = hex.match(/.{2}/g) || [];
    return btoa(bytes.map((h) => String.fromCharCode(parseInt(h, 16))).join(''));
}

function shouldSignLocally() {
    const hostname = window.location.hostname;
    const isLocal = ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname) ||
                    hostname.startsWith('192.168.') ||
                    hostname.startsWith('10.') ||
                    hostname.startsWith('172.') ||
                    hostname === '';
    if (!isLocal) {
        console.log(`[QZ-DEBUG] Hostname "${hostname}" nao reconhecido como local, assumindo producao.`);
    }
    return isLocal;
}

async function signWithNetlifyFunction(toSign) {
    let lastErr;
    for (let attempt = 0; attempt <= QZ_RETRIES; attempt++) {
        try {
            const response = await fetch('/.netlify/functions/qz-sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: toSign }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.signature) {
                throw new Error(payload.error || `Falha (HTTP ${response.status}).`);
            }
            return payload.signature;
        } catch (err) {
            lastErr = err;
            if (attempt < QZ_RETRIES) {
                console.warn(`[QZ] Tentativa ${attempt + 1} falhou, retentando...`, err.message);
                await sleep(QZ_RETRY_DELAY_MS * (attempt + 1));
            }
        }
    }
    throw new Error(`Assinatura via Netlify falhou apos ${QZ_RETRIES + 1} tentativas: ${lastErr.message}`);
}

function signWithPrivateKey(privateKey, toSign) {
    let pk;
    try {
        pk = KEYUTIL.getKey(privateKey);
    } catch (err) {
        throw new Error(`private-key.pem nao pode ser lido pelo assinador QZ: ${err.message}`);
    }
    const sig = new KJUR.crypto.Signature({ alg: 'SHA512withRSA' });
    sig.init(pk);
    sig.updateString(toSign);
    return hexSignatureToBase64(sig.sign());
}

// ---------------------------------------------------------------------------
// cleanText: remove acentos APENAS para texto comum (nunca para dados binários ESC/P)
// ---------------------------------------------------------------------------
export const cleanText = (text, uppercase = true) => {
    if (!text) return '';
    // Extrai comandos ESC/P (ESC + byte seguinte) para preservá-los do toUpperCase()
    const escCmds = [];
    const processed = text
        .toString()
        .replace(/\x1B./g, (m) => {
            escCmds.push(m);
            return '\x00';
        });
    
    let result = processed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[Çç]/g, (m) => (m === 'Ç' ? 'C' : 'c'))
        .replace(/[ºª]/g, '.');
    
    if (uppercase) {
        result = result.toUpperCase();
    }
    
    return result.replace(/\x00/g, () => escCmds.shift() || '');
};

export const setupQZSecurity = () => {
    // QZ Tray mostra dialogo nativo "Allow/Block" para sites nao confiaveis.
    // Nao configuramos certificado/assinatura para evitar dependencia de
    // funcao serverless ou chave privada no frontend.
    console.log('[QZ] Usando seguranca nativa do QZ Tray (dialogo Allow/Block).');
};

// ---------------------------------------------------------------------------
// pngToEscpBitmap
// ---------------------------------------------------------------------------
async function pngToEscpBitmap(imageUrl, maxWidthDots = 48, maxHeightDots = 36) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timeoutId = setTimeout(() => {
            reject(new Error('Timeout ao processar logo (>12s).'));
        }, 12000);

        img.onload = () => {
            try {
                // — Renderiza no canvas temporário —
                const tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = img.width;
                tmpCanvas.height = img.height;
                const tmpCtx = tmpCanvas.getContext('2d');
                tmpCtx.fillStyle = '#FFFFFF';
                tmpCtx.fillRect(0, 0, img.width, img.height);
                tmpCtx.drawImage(img, 0, 0);
                const fullData = tmpCtx.getImageData(0, 0, img.width, img.height);
                const fullPx = fullData.data;

                // — Auto-crop: detecta bounding box do conteúdo —
                let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
                for (let y = 0; y < img.height; y++) {
                    for (let x = 0; x < img.width; x++) {
                        const idx = (y * img.width + x) * 4;
                        const luma = 0.299 * fullPx[idx] + 0.587 * fullPx[idx + 1] + 0.114 * fullPx[idx + 2];
                        if (luma < 200) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                if (maxX < minX || maxY < minY) {
                    clearTimeout(timeoutId);
                    reject(new Error('Logo sem conteúdo visível após recorte.'));
                    return;
                }

                minX = Math.max(0, minX - 2);
                minY = Math.max(0, minY - 2);
                maxX = Math.min(img.width - 1, maxX + 2);
                maxY = Math.min(img.height - 1, maxY + 2);

                const cropW = maxX - minX + 1;
                const cropH = maxY - minY + 1;

                // — Redimensiona respeitando limites —
                const scale = Math.min(1, maxWidthDots / cropW, maxHeightDots / cropH);
                const w = Math.max(1, Math.floor(cropW * scale));
                const h = Math.max(1, Math.floor(cropH * scale));

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, w, h);
                ctx.drawImage(img, minX, minY, cropW, cropH, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const pixels = imageData.data;

                const bytes = [];
                const blackThreshold = 110;

                // ESC 3 24
                bytes.push(0x1B, 0x33, 0x18);

                const rowsOf8 = Math.ceil(h / 8);

                for (let band = 0; band < rowsOf8; band++) {
                    const startRow = band * 8;

                    // ESC * 0
                    bytes.push(0x1B, 0x2A, 0x00, w & 0xFF, (w >> 8) & 0xFF);

                    for (let col = 0; col < w; col++) {
                        let byt = 0;
                        for (let bit = 0; bit < 8; bit++) {
                            const row = startRow + bit;
                            if (row < h) {
                                const idx = (row * w + col) * 4;
                                const luma = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
                                if (luma < blackThreshold) byt |= (0x80 >> bit);
                            }
                        }
                        bytes.push(byt);
                    }

                    bytes.push(0x0D, 0x0A);
                }

                bytes.push(0x1B, 0x32);

                clearTimeout(timeoutId);
                resolve(new Uint8Array(bytes));
            } catch (err) {
                clearTimeout(timeoutId);
                reject(new Error(`Erro ao processar logo: ${err.message}`));
            }
        };

        img.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error('Não foi possível carregar o logo: ' + imageUrl));
        };

        img.src = imageUrl;
    });
}

function stringToUint8Array(str) {
    const u8 = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        u8[i] = str.charCodeAt(i) & 0xFF;
    }
    return u8;
}

function uint8ToBase64(u8) {
    const CHUNK = 8192;
    let binary = '';
    for (let i = 0; i < u8.length; i += CHUNK) {
        binary += String.fromCharCode(...u8.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

function concatUint8Arrays(chunks) {
    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
}

const ESCP_JOB_PREFIX = new Uint8Array([0x1B, 0x40, 0x0F, 0x1B, 0x50]);
const ESCP_ELITE = new Uint8Array([0x1B, 0x4D, 0x12]); // ESC M 0x12 = Elite 12 CPI
const ESCP_BEFORE_LOGO = new Uint8Array([0x0F, 0x1B, 0x50]);
const ESCP_AFTER_LOGO = new Uint8Array([0x1B, 0x32, 0x0F, 0x1B, 0x50, 0x0D, 0x0A]);

class PrintService {
    constructor() {
        this.connected = false;
        this.printerMatricial = 'EPSON FX890 ESC/P (Copiar 2)';
        this.printerToner = 'EPSON L3150';
        this.printerTeste = 'Generic Text Only (Teste)';
        setupQZSecurity();
    }

    async connect() {
        try {
            if (qz.websocket.isActive()) {
                this.connected = true;
                return true;
            }
            await Promise.resolve();
            await this._ensureQz();
            return true;
        } catch (e) {
            console.error('Erro ao conectar QZ Tray:', e);
            try {
                alert(`Erro ao conectar QZ Tray: ${e?.message || String(e)}`);
        } catch (e) {
            // ignore
        }

            this.connected = false;
            return false;
        }
    }

    async _ensureQz() {
        await timeout(qz.websocket.connect(), QZ_CONNECT_TIMEOUT_MS, 'Conexão QZ Tray');
        this.connected = true;
    }

    async _getActualPrinterName(targetName) {
        const allPrinters = await qz.printers.find();
        const upperTarget = targetName.toUpperCase();
        const found = allPrinters.find((p) => {
            const u = p.toUpperCase();
            return (
                u.includes(upperTarget) ||
                u.includes('EPSON FX') ||
                u.includes('FX-890') ||
                u.includes('FX890')
            );
        });
        if (found) return found;
        throw new Error(`Impressora matricial não encontrada. Instaladas: ${allPrinters.join(', ')}`);
    }

    _buildMatricialBuffer(data, logoU8, logoSection, uppercase = true) {
        const pageChunks = data.split('\x0C');
        const chunks = [ESCP_JOB_PREFIX];

        pageChunks.forEach((page, pageIndex) => {
            if (!page) return;

            const parts = page.split(logoSection);
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].length > 0) {
                    chunks.push(stringToUint8Array(cleanText(parts[i], uppercase)));
                }
                if (i < parts.length - 1 && logoU8 && logoU8.length > 0) {
                    chunks.push(ESCP_BEFORE_LOGO, logoU8, ESCP_AFTER_LOGO);
                }
            }

            const hasMorePages = pageIndex < pageChunks.length - 1;
            if (hasMorePages || data.endsWith('\x0C')) {
                chunks.push(new Uint8Array([0x0C]));
                chunks.push(ESCP_ELITE);
            }
        });

        return concatUint8Arrays(chunks);
    }

    async _sendRawBytes(config, u8array) {
        const b64 = uint8ToBase64(u8array);
        await qz.print(config, [{ type: 'raw', format: 'base64', data: b64 }]);
    }

    async printRawMatricial(data, logoUrl = null, logoSection = '<<LOGO>>', maxWidthDots = 48, uppercase = true) {
        try {
            const isConnected = await this.connect();
            if (!isConnected) {
                return {
                    success: false,
                    error: 'QZ Tray não está respondendo. Verifique se está aberto na bandeja do Windows.',
                };
            }

            const actualName = await this._getActualPrinterName(this.printerMatricial);
            const config = qz.configs.create(actualName);

            if (!logoUrl || !data.includes(logoSection)) {
                await this._sendRawBytes(config, stringToUint8Array(cleanText(data, uppercase)));
                return { success: true };
            }

            const cacheKey = `${'v1'}:${logoUrl}:${maxWidthDots}`;
            // Logo cache simples (sem dependência externa)
            // eslint-disable-next-line no-undef
            this._logoCache = this._logoCache || new Map();
            let logoU8 = this._logoCache.get(cacheKey);
            if (typeof logoU8 === 'undefined') {
                try {
                    logoU8 = await pngToEscpBitmap(logoUrl, maxWidthDots);
                    this._logoCache.set(cacheKey, logoU8);
                } catch (e) {
                    console.warn('[Logo] Falha na conversão, imprimindo sem imagem:', e?.message || e);
                    logoU8 = null;
                    this._logoCache.set(cacheKey, null);
                }
            }

            const jobBuffer = this._buildMatricialBuffer(data, logoU8, logoSection, uppercase);
            await this._sendRawBytes(config, jobBuffer);

            return { success: true };
        } catch (e) {
            console.error('Erro na impressão matricial:', e);
            return { success: false, error: e?.message || String(e) };
        }
    }

    async printTestGeneric(data) {
        try {
            const isConnected = await this.connect();
            if (!isConnected) return { success: false, error: 'QZ Tray não está respondendo.' };

            const allPrinters = await qz.printers.find();
            const found =
                allPrinters.find((p) => p.toUpperCase().includes('GENERIC') && p.toUpperCase().includes('TESTE')) ||
                allPrinters.find((p) => p.toUpperCase().includes('GENERIC') && p.toUpperCase().includes('TEXT'));

            if (!found) {
                return {
                    success: false,
                    error: `Impressora "Generic Text Only (Teste)" não encontrada. Instaladas: ${allPrinters.join(', ')}`,
                };
            }

            const config = qz.configs.create(found);
            let cleanData = data.replace(/<<LOGO>>/g, '[LOGO]\r\n');
            cleanData = cleanText(cleanData);

            await this._sendRawBytes(config, stringToUint8Array(cleanData + '\x0C'));
            return { success: true };
        } catch (e) {
            console.error('Erro na impressão de teste:', e);
            return { success: false, error: e?.message || String(e) };
        }
    }

    async printHTMLToner(htmlElementId) {
        try {
            const isConnected = await this.connect();
            if (!isConnected) return { success: false, error: 'QZ Tray não está respondendo.' };

            const actualName = await this._getActualPrinterName(this.printerToner);
            const config = qz.configs.create(actualName);

            await qz.print(config, [
                {
                    type: 'html',
                    format: 'plain',
                    data: document.getElementById(htmlElementId).innerHTML,
                },
            ]);

            return { success: true };
        } catch (e) {
            console.error('Erro na impressão toner:', e);
            return { success: false, error: e?.message || String(e) };
        }
    }

    async printHTMLRawToner(htmlString) {
        try {
            const isConnected = await this.connect();
            if (!isConnected) return { success: false, error: 'QZ Tray não está respondendo.' };

            const actualName = await this._getActualPrinterName(this.printerToner);
            const config = qz.configs.create(actualName);

            await qz.print(config, [
                {
                    type: 'html',
                    format: 'plain',
                    data: htmlString,
                },
            ]);

            return { success: true };
        } catch (e) {
            console.error('Erro na impressão toner:', e);
            return { success: false, error: e?.message || String(e) };
        }
    }
}

export default new PrintService();

