import React, { useMemo, useState } from 'react';
import { Printer, X, Zap, FileText, Download } from 'lucide-react';
import printService from '../services/printService';
import jsPDF from 'jspdf';

// ---------------------------------------------------------------------------
// Componente: RelFichaDoacoes
// Layout: 80 colunas × Folha Contínua (28cm comprimento x 21cm largura)
// Divisão: 14cm para Ficha (Cima) e 14cm para Recibo (Baixo) - SEM LOGO
// Limite: Quebra estrita a cada 14 itens
// ADAPTAÇÃO: Exportação direta para arquivo físico .TXT (Bypass do Navegador)
// ---------------------------------------------------------------------------

const RelFichaDoacoes = ({ donation, userLoggerName, onClose }) => {
    const printId = useMemo(() => `print-ficha-mat-${Math.random().toString(36).substr(2, 9)}`, []);
    const [isPrintingQZ, setIsPrintingQZ] = useState(false);

    if (!donation) return null;

    // -----------------------------------------------------------------------
    // Formatadores Auxiliares
    // -----------------------------------------------------------------------
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [datePart] = dateStr.split(/T| /);
        const parts = datePart.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const formatCEP = (cep) => {
        if (!cep) return '';
        const n = cep.replace(/\D/g, '');
        if (n.length !== 8) return cep;
        return `${n.substring(0, 5)}-${n.substring(5)}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const n = phone.replace(/\D/g, '');
        if (n.length === 11) return `(${n.substring(0, 2)}) ${n.substring(2, 7)}-${n.substring(7)}`;
        if (n.length === 10) return `(${n.substring(0, 2)}) ${n.substring(2, 6)}-${n.substring(6)}`;
        return phone;
    };

    const up = (text) => (text ? text.toString().trim().toUpperCase() : '');
    const pad = (str, len) => (str || '').toString().substring(0, len).padEnd(len, ' ');
    const line = (left, right = '') => pad(left, 54) + (right || '') + '\r\n';
    const blank = () => '\r\n';

    const center = (str, width = 80) => {
        const s = str.toString();
        const padLen = Math.max(0, Math.floor((width - s.length) / 2));
        return ' '.repeat(padLen) + s;
    };

    // -----------------------------------------------------------------------
    // Extração e Mapeamento dos Dados (Tabelas doadores / doacoes)
    // -----------------------------------------------------------------------
    let dInfo = donation.doadores || {};
    if (Array.isArray(dInfo)) dInfo = dInfo[0] || {};

    const dCode       = up(donation.codigoDoador || donation.codigo_doador || dInfo.id || '');
    const donCode     = up(donation.codigo || donation.codigo_doacao || donation.id || '');
    const tipoDoador  = up(dInfo.tipo_doador || dInfo.tipo || 'COMUM');
    const dtRetirada  = formatDate(donation.dataRetirada || donation.data_retirada || '');
    const dtRemarcado = formatDate(donation.remarcado_para || '');
    const responsavel = up((donation.responsavel || userLoggerName || 'SHIRLEY').split('@')[0]);
    const contato     = up(donation.contato || dInfo.contato || '');
    const dName       = up(donation.nomeDoador || dInfo.nome || '');
    const cep         = formatCEP(dInfo.cep || '');
    const endereco    = up(`${dInfo.logradouro || ''} ${dInfo.endereco || ''}`.trim());
    const compl       = up(dInfo.complemento || '');
    const bairro      = up(dInfo.bairro || '');
    const mapa        = up(dInfo.mapa || '');
    const celular     = formatPhone(dInfo.celular || '');
    const fixo        = formatPhone(dInfo.fixo || '');
    const regiao      = up(dInfo.regiao || '');
    const email       = up(dInfo.email || '');
    const cidade      = up(dInfo.cidade || 'SAO PAULO');
    const estado      = up(dInfo.estado || 'SP');
    // FIX 1: Data de São Paulo deve ser a data de cadastramento (data_doacao) e não a data de impressão
    const formatDateSafe = (d) => {
        if (!d) return '';
        const part = d.split(/T| /)[0];
        const p = part.split('-');
        if (p.length !== 3) return d;
        return `${p[2]}/${p[1]}/${p[0]}`;
    };
    const registrationDateStr = formatDateSafe(donation.data_doacao || donation.data_solicitacao || donation.created_at || '') || new Date().toLocaleDateString('pt-BR');
    const todayStr    = registrationDateStr;

    const wrapField = (text, maxWidth = 50) => {
        const s = (text || '').toString().trim();
        if (s.length <= maxWidth) return [s, ''];
        return [s.substring(0, maxWidth), s.substring(maxWidth, maxWidth * 2)];
    };

    const [obs1, obs2]   = wrapField(donation.observacoes || donation.obs || '', 50);
    const [nome1, nome2] = wrapField(dName, 50);

    const buildCabecalhoTexto = () => {
        let t = '';
        t += center('ASSOCIACAO ESPIRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES', 80) + '\r\n';
        t += center('RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SAO PAULO - SP', 80) + '\r\n';
        t += center('CEP 03610-030 - FONE: (11) 2164-1800 - CNPJ: 60.478.245/0001-50', 80) + '\r\n';
        t += center('EMAIL:@ABRIGOBEZERRADEMENEZES.ORG.BR-SITE:WWW.ABRIGOBEZERRADEMENEZES.ORG.BR', 80) + '\r\n';
        return t;
    };

    // -----------------------------------------------------------------------
    // Geração do Buffer de Impressão Matricial (rawText)
    // -----------------------------------------------------------------------
    const rawText = useMemo(() => {
        let fullText = '\x1BM\x12'; // Inicialização padrão ESC/P (12 cpi)
        const MAX_ITEMS = 14;
        const allItems = donation.itens || [];
        const chunks = [];

        for (let i = 0; i < allItems.length; i += MAX_ITEMS) {
            chunks.push(allItems.slice(i, i + MAX_ITEMS));
        }
        if (chunks.length === 0) chunks.push([]);

        chunks.forEach((chunk, index) => {
            let text = '';

            // ===================================================================
            // PARTE 1 — FICHA DE CONTROLE INTERNO (SEM CABEÇALHO) - MÁX 14cm
            // ===================================================================
            text += line(`Doador: ${pad(dCode, 6)} - Doacao: ${pad(donCode, 6)} - Tipo Doador: ${pad(tipoDoador, 12)}`, `Sao Paulo, ${todayStr}`);
            text += line(`Retirar em: ${pad(dtRetirada, 10)}`, `Remarcado: ${dtRemarcado}`);
            text += line(`Obs.:       ${pad(obs1, 42)}`, `Contato: ${contato}`);
            text += line(`            ${pad(obs2, 42)}`, '');
            text += line(`Nome:    ${pad(nome1, 45)}`, `Cep: ${cep}`);
            text += line(`         ${pad(nome2, 45)}`, '');
            text += line(`Endereco:   ${pad(endereco, 41)}`, `Compl.: ${compl}`);
            text += line(`Bairro:     ${pad(bairro, 43)}`, `Mapa: ${mapa}`);
            text += line(`Celular:    ${pad(celular, 15)}  Fixo: ${pad(fixo, 15)}`, `Regiao: ${regiao}`);
            text += line(`Email:      ${pad(email, 55)}`);
            text += line(`Veiculo:    ______________`, `Motorista:_____________`);
            text += blank();
            text += line(`            ${pad(responsavel, 40)}`, 'Auro');
            text += line(`            ${pad('ENC. DOAÇÕES', 40)}`, 'ENC. TRANSPORTES');
            text += blank();
            text += center('DADOS DA DOAÇÃO', 80) + '\r\n';
            text += `  QTDE        VOLUME          COD.DOACAO        DESCRICAO\r\n`;
            text += `${'.'.repeat(80)}\r\n`;

            chunk.forEach((it) => {
                const qtde  = pad(it.qtde != null ? String(Math.round(it.qtde)) : '1', 6);
                const vol   = pad(it.unidade || 'UN', 10);
                const codIt = pad(donCode, 14);
                const desc  = up(it.item || '');
                text += `   ${qtde}     ${vol}      ${codIt}    ${desc}\r\n`;
            });

            const remainingFichaLines = (MAX_ITEMS - chunk.length) - 1;
            for (let i = 0; i < Math.max(0, remainingFichaLines); i++) {
                text += blank();
            }

            text += '---DIVISAO_PARTE---';

            // ===================================================================
            // PARTE 2 — RECIBO VIA DOADOR
            // ===================================================================
            text += '<<LOGO>>';
            text += '\x1Bj\x90';  
            text += '\x1BF';      
            text += '\x1BM';      
            text += '<<LOGO_FIM>>';
            text += buildCabecalhoTexto();
            text += '---FIM_CABECALHO---';
            text += blank();
            text += center('RECIBO DA DOAÇÃO', 80) + '\r\n';
            text += blank();
            text += `Recebemos do(a) Sr.(a) ${dName}\r\n`;
            text += `Endereco: ${endereco} ${compl ? '- ' + compl : ''}\r\n`;
            text += `Bairro: ${pad(bairro, 25)} Cidade: ${pad(cidade, 20)} UF: ${pad(estado, 4)} CEP: ${cep}\r\n`;
            text += 'as mercadorias abaixo descriminadas:\r\n';
            text += blank();
            text += `  QTDE        VOLUME          COD.DOACAO        DESCRICAO\r\n`;
            text += `${'.'.repeat(80)}\r\n`;

            chunk.forEach((it) => {
                const qtde  = pad(it.qtde != null ? String(Math.round(it.qtde)) : '1', 6);
                const vol   = pad(it.unidade || 'UN', 10);
                const cod   = pad(donCode, 14);
                const desc  = up(it.item || '');
                text += `   ${qtde}     ${vol}      ${cod}    ${desc}\r\n`;
            });

            const remainingReciboLines = (MAX_ITEMS - chunk.length) - 2;
            for (let i = 0; i < Math.max(0, remainingReciboLines); i++) {
                text += blank();
            }

            text += '\r\n' + pad('DATA: ' + todayStr, 38) + '____________________________________\r\n';
            text += pad('', 44) + 'Assinatura do responsavel\r\n';

            fullText += text;

            if (index < chunks.length - 1) {
                fullText += '\x0C';
            }
        });

        fullText += '\x0C';
        return fullText;
    }, [donation, todayStr, userLoggerName, dCode, donCode, tipoDoador, dtRetirada, dtRemarcado, obs1, obs2, contato, dName, cep, endereco, compl, bairro, mapa, celular, fixo, regiao, email, cidade, estado, responsavel]);

    // -----------------------------------------------------------------------
    // NOVO: Função para exportar e baixar como arquivo físico .TXT puro
    // -----------------------------------------------------------------------
    const handleExportTXT = () => {
        // Limpa os marcadores internos de controle visual para o arquivo txt ficar limpo
        let txtPure = rawText
            .replace(/---DIVISAO_PARTE---/g, '\r\n')
            .replace(/---FIM_CABECALHO---/g, '')
            .replace(/<<LOGO>>/g, '')
            .replace(/<<LOGO_FIM>>/g, '')
            // Opcional: Remove os comandos de inicialização ESC/P se quiser apenas texto legível no bloco de notas
            .replace(/\x1BM\x12/g, '')
            .replace(/\x1Bj\x90/g, '')
            .replace(/\x1BF/g, '');

        // Cria o blob contendo a string codificada em formato texto
        const blob = new Blob([txtPure], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        // Cria um elemento <a> fantasma para forçar o download direto
        const linkDownload = document.createElement('a');
        linkDownload.href = url;
        linkDownload.download = `Ficha_Doacao_${donCode || 'Matricial'}.txt`;
        document.body.appendChild(linkDownload);
        linkDownload.click();
        
        // Limpa recursos da memória
        document.body.removeChild(linkDownload);
        URL.revokeObjectURL(url);
    };

    // -----------------------------------------------------------------------
    // Operações de Impressão Originais
    // -----------------------------------------------------------------------
    const handlePrintQZ = async () => {
        setIsPrintingQZ(true);
        try {
            const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;

            const textToPrint = rawText
                .replace(/---DIVISAO_PARTE---/g, '\r\n')
                .replace(/---FIM_CABECALHO---/g, '\x1B\x32') 
                .replace(/<<LOGO_FIM>>/g, '');

            const finalText = textToPrint.replace(
                /(ASSOCIACAO ESPIRITA BENEFICENTE)/g,
                '\x1B\x30ASSOCIACAO ESPIRITA BENEFICENTE'
            );

            const result = await printService.printRawMatricial(finalText, logoUrl, '<<LOGO>>', 48, false);
            if (!result.success) {
                alert('Erro QZ Tray: ' + result.error);
            }
        } catch (e) {
            alert('Erro ao imprimir via QZ Tray: ' + e.message);
        } finally {
            setIsPrintingQZ(false);
        }
    };

    const handlePrintHTML = () => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        const pages = rawText.split('\x0C').filter(p => p.trim().length > 0);

        let pagesHtml = '';
        const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;
        pages.forEach((page, index) => {
            const [fichaText, restoComCabecalho] = page.split('---DIVISAO_PARTE---');
            const [logoEHeader, corpoRecibo] = (restoComCabecalho || '').split('---FIM_CABECALHO---');
            const [_, escHeader] = (logoEHeader || '').split('<<LOGO>>');
            const [__, cabecalhoTexto] = (escHeader || '').split('<<LOGO_FIM>>');

            pagesHtml += `
                <div class="page-container" ${index < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
                    <div class="half-page ficha-interna">
                        <pre class="mono-8">${fichaText || ''}</pre>
                    </div>
                    <div class="half-page recibo-container">
                        <div class="recibo-header-flex">
                            <img src="${logoUrl}" class="logo-print" />
                            <pre class="mono-8 cabecalho-bloco">${cabecalhoTexto || ''}</pre>
                        </div>
                        <pre class="mono-8">${corpoRecibo || ''}</pre>
                    </div>
                </div>
            `;
        });

        doc.write(`
            <html>
                <head>
                    <title>Ficha Nova - ${donCode}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { background: white; }
                        .page-container { width: 210mm; height: 280mm; display: flex; flex-direction: column; }
                        .half-page { height: 140mm; width: 100%; overflow: hidden; padding: 4mm 6mm; }
                        .ficha-interna { border-bottom: 1px dashed #999; }
                        .recibo-container { display: flex; flex-direction: column; }
                        .mono-8 { font-family: 'Courier New', Courier, monospace; font-size: 8pt; line-height: 1.15; white-space: pre; color: #000; }
                        .cabecalho-bloco { font-weight: bold; margin-bottom: 2mm; text-align: center; flex: 1; }
                        .recibo-header-flex { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 2mm; }
                        .logo-print { width: 32px; height: auto; flex-shrink: 0; margin-top: 2px; }
                        @media print {
                            @page { size: 210mm 280mm; margin: 0; }
                            body { margin: 0; padding: 0; }
                            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .mono-8 { font-size: 8pt; color: #000; }
                        }
                    </style>
                </head>
                <body>
                    ${pagesHtml}
                    <script>
                        window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    const handlePrintPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFont('courier', 'normal');
        doc.setFontSize(18);
        doc.text('ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text('Rua Dona Vicentina Alegretti, 265 - Penha - São Paulo - SP', pageWidth / 2, 28, { align: 'center' });
        doc.text('CEP 03610-030 - FONE: (11) 2164-1800 - CNPJ: 60.478.245/0001-50', pageWidth / 2, 35, { align: 'center' });
        doc.text('E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br', pageWidth / 2, 42, { align: 'center' });

        doc.output('dataurlnewwindow');
    };

    const pagesPreview = rawText.split('\x0C').filter(p => p.trim().length > 0);

    return (
        <div id={printId} className="modal-overlay">
            <style dangerouslySetInnerHTML={{ __html: `
                .fm-modal-box { background: white !important; width: 98%; max-width: 950px; max-height: 96vh; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); color: black !important; font-family: 'Courier New', Courier, monospace; }
                .fm-header-actions { background: #f8fafc; padding: 14px 24px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; flex-shrink: 0; }
                .fm-header-title { flex: 1; text-align: center; font-family: 'Courier New', Courier, monospace; font-size: 0.9rem; font-weight: bold; color: #1e293b; display: flex; align-items: center; justify-content: center; gap: 8px; }
                .fm-scroll-area { flex: 1; overflow-y: auto; padding: 20px; background: #64748b !important; display: flex; flex-direction: column; gap: 20px; align-items: center; }
                .fm-paper-sheet { width: 210mm; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
                .fm-preview-half { height: 140mm; padding: 8px 12px; overflow: hidden; position: relative; }
                .fm-preview-top { border-bottom: 2px dashed #cbd5e1; }
                .fm-mono { font-family: 'Courier New', Courier, monospace; font-size: 8pt; line-height: 1.15; white-space: pre; color: #000; margin: 0; }
                .fm-cabecalho-bold { font-weight: bold; margin-bottom: 4px; text-align: center; flex: 1; }
                .fm-header-flex { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 4px; }
                .fm-logo-preview { width: 32px; height: auto; flex-shrink: 0; margin-top: 2px; }
                .fm-info-bar { background: #f1f5f9; padding: 8px 24px; font-size: 0.75rem; color: #475569; display: flex; gap: 16px; border-top: 1px solid #cbd5e1; font-family: 'Courier New', Courier, monospace; }
            `}} />

            <div className="fm-modal-box">
                <div className="fm-header-actions">
                    <div className="fm-header-title">
                        <Printer size={18} />
                        FICHA DE DOAÇÕES (IMPRESSÃO MATRICIAL)
                    </div>
                    <div className="flex items-center gap-2">
                        {/* NOVO BOTÃO: Download do arquivo TXT puro */}
                        <button
                            onClick={handleExportTXT}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download size={16} />
                            Salvar TXT
                        </button>
                        
                        <button
                            onClick={handlePrintQZ}
                            disabled={isPrintingQZ}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Zap size={16} />
                            {isPrintingQZ ? 'Enviando...' : 'Imprimir Direto (QZ)'}
                        </button>
                        <button
                            onClick={handlePrintHTML}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Printer size={16} />
                            Imprimir (HTML)
                        </button>
                        <button
                            onClick={handlePrintPDF}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <FileText size={16} />
                            Gerar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="fm-scroll-area">
                    {pagesPreview.map((page, idx) => {
                        const [ficha, restoComCabecalho] = page.split('---DIVISAO_PARTE---');
                        const [logoEHeader, corpoRecibo] = (restoComCabecalho || '').split('---FIM_CABECALHO---');
                        const [_, escHeader] = (logoEHeader || '').split('<<LOGO>>');
                        const [__, cabecalhoTexto] = (escHeader || '').split('<<LOGO_FIM>>');

                        return (
                            <div key={idx} className="fm-paper-sheet">
                                <div className="fm-preview-half fm-preview-top">
                                    <pre className="fm-mono">{ficha}</pre>
                                </div>

                                <div className="fm-preview-half">
                                    <div className="fm-header-flex">
                                        <img src={`${window.location.origin}/LogoAbrBMPB01.png`} className="fm-logo-preview" />
                                        <pre className="fm-mono fm-cabecalho-bold">{cabecalhoTexto}</pre>
                                    </div>
                                    <pre className="fm-mono">{corpoRecibo}</pre>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="fm-info-bar">
                    <span>• Impressora: EPSON FX-890</span>
                    <span>• Bypass Ativo: Exportação física .TXT disponível</span>
                </div>
            </div>
        </div>
    );
};

export default RelFichaDoacoes;