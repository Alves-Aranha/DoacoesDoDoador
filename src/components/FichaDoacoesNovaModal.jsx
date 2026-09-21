import React, { useMemo, useState } from 'react';
import { Printer, X, Zap } from 'lucide-react';
import printService from '../services/printService';

// ---------------------------------------------------------------------------
// DoaçãoFichaMatricial
// Layout: 80 colunas × folha contínua (impressora matricial EPSON FX-890)
// Referência visual: C:/Nova_Ficha_Doacoes.docx
//
// COLUNA ESQUERDA (cols 1-59)  |  COLUNA DIREITA (cols 60-80)
// ---------------------------------------------------------------------------

const DoacaoFichaMatricial = ({ donation, userLoggerName, onClose }) => {
    const printId = useMemo(() => `print-ficha-mat-${Math.random().toString(36).substr(2, 9)}`, []);
    const [isPrintingQZ, setIsPrintingQZ] = useState(false);

    if (!donation) return null;

    // -----------------------------------------------------------------------
    // Formatadores
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

    const up = (text) => {
        if (!text) return '';
        return text.toString().trim();
    };

    // -----------------------------------------------------------------------
    // Funções de layout em texto puro (80 colunas)
    // -----------------------------------------------------------------------

    // Ajusta string a exatamente `len` chars (trunca ou preenche com espaços)
    const pad = (str, len) => (str || '').toString().substring(0, len).padEnd(len, ' ');

    // Monta linha com parte esquerda (59 chars) + parte direita (21 chars)
    // Total: 80 chars + CRLF
    const line = (left, right = '') => pad(left, 59) + (right || '') + '\r\n';

    // Linha em branco
    const blank = () => '\r\n';

    // Centraliza texto em largura total de 80 cols
    const center = (str, width = 80) => {
        const s = str.toString();
        const padLen = Math.max(0, Math.floor((width - s.length) / 2));
        return ' '.repeat(padLen) + s;
    };

    // -----------------------------------------------------------------------
    // Dados extraídos do objeto donation
    // -----------------------------------------------------------------------
    let dInfo = donation.doadores || {};
    if (Array.isArray(dInfo)) dInfo = dInfo[0] || {};

    const dCode       = up(donation.codigoDoador || donation.codigo_doador || '');
    const donCode     = up(donation.codigo || donation.codigo_doacao || '');
    const tipoDoador  = up(dInfo.tipo_doador || dInfo.tipo || '');
    const dtRetirada  = formatDate(donation.dataRetirada || donation.data_retirada || '');
    const dtRemarcado = formatDate(donation.remarcado_para || '');
    const responsavel = up((donation.responsavel || userLoggerName || '').split('@')[0]);
    const contato     = up(dInfo.contato || '');
    const dName       = up(donation.nomeDoador || dInfo.nome || '');
    const cep         = formatCEP(dInfo.cep || '');
    const endereco    = up(`${dInfo.logradouro || ''} ${dInfo.endereco || ''}`.trim());
    const compl       = up(dInfo.complemento || '');
    const bairro      = up(dInfo.bairro || '');
    const mapa        = up(dInfo.mapa || '');
    const celular     = formatPhone(dInfo.celular || '').replace(') ', ')');
    const fixo        = formatPhone(dInfo.fixo || '').replace(') ', ')');
    const whats       = formatPhone(dInfo.whatsapp || dInfo.whats || '').replace(') ', ')');
    const regiao      = up(dInfo.regiao || '');
    const email       = up(dInfo.email || '');
    const cidade      = up(dInfo.cidade || 'SAO PAULO');
    const estado      = up(dInfo.estado || 'SP');
    const todayStr    = new Date().toLocaleDateString('pt-BR');

    // OBS. e NOME: campo pode ter 2 linhas (campo de 45 chars por linha)
    const wrapField = (text, maxWidth = 45) => {
        const s = (text || '').toString().trim();
        if (s.length <= maxWidth) return [s, ''];
        return [s.substring(0, maxWidth), s.substring(maxWidth, maxWidth * 2)];
    };

    const [obs1, obs2]   = wrapField(donation.observacoes || '', 45);
    const [nome1, nome2] = wrapField(dName, 45);

    // -----------------------------------------------------------------------
    // rawText: texto enviado à impressora (80 colunas)
    // -----------------------------------------------------------------------
    const rawText = useMemo(() => {
        let fullText = '\x1BM\x12'; // Elite (12 CPI) — sem condensado para texto mais largo
        const MAX_ITEMS = 10;
        const allItems = donation.itens || [];
        const chunks = [];
        
        for (let i = 0; i < allItems.length; i += MAX_ITEMS) {
            chunks.push(allItems.slice(i, i + MAX_ITEMS));
        }
        if (chunks.length === 0) chunks.push([]);

        chunks.forEach((chunk, index) => {
            let text = '';

            // --- PARTE 1: FICHA DE CONTROLE INTERNO (Mantida exatamente original) ---

            // Linha 1: DOADOR / DOAÇÃO / TIPO DOADOR | São Paulo, data
            text += line(
                `${index === 0 ? '\r\n' : ''}DOADOR: ${pad(dCode, 6)}  DOACOES: ${pad(donCode, 8)}  TIPO DOADOR: ${pad(tipoDoador, 13)}`,
                `SAO PAULO, ${todayStr}`
            );

            // Linha 2: RETIRAR EM | REMARCADO
            text += line(
                `RETIRAR EM: ${pad(dtRetirada, 45)}`,
                `REMARCADO: ${dtRemarcado}`
            );

            // Linha 3: OBS. (linha1) | CONTATO
            text += line(
                `OBS.:       ${pad(obs1, 45)}`,
                `CONTATO: ${contato}`
            );

            // Linha 4: OBS. (linha2) | vazio
            text += line(
                `            ${pad(obs2, 45)}`,
                ''
            );

            // Linha 5: NOME (linha1) | CEP
            text += line(
                `NOME:    ${pad(nome1, 48)}`,
                `CEP: ${cep}`
            );

            // Linha 6: NOME (linha2) | vazio
            text += line(
                `         ${pad(nome2, 48)}`,
                ''
            );

            // Linha 7: ENDEREÇO | COMPL.
            text += line(
                `ENDERECO:   ${pad(endereco, 45)}`,
                `COMPL: ${compl}`
            );

            // Linha 8: BAIRRO | MAPA
            text += line(
                `BAIRRO:     ${pad(bairro, 45)}`,
                `MAPA: ${mapa}`
            );

            // Linha 9: CEL / FIXO | REGIÃO
            const celFixoStr = `CEL:${celular}  FIX:${fixo}  WHA:${whats}`;
            text += line(
                pad(celFixoStr, 59),
                `REGIAO: ${regiao}`
            );

            // Linha 10: EMAIL (linha inteira)
            text += line(`EMAIL:      ${pad(email, 65)}`);

            // Linha 11: VEÍCULO | MOTORISTA
            text += line(
                `VEICULO:    ______________`,
                `MOTORISTA:___________`
            );

            // Linha 12: espaço
            text += blank();

            // Linha 13: Nome do responsável centralizado à esquerda | AURO à direita
            const respPad = pad('', 10) + pad(responsavel, 35);
            text += line(respPad, `     Auro`);

            // Linha 14: Rótulos dos responsáveis
            const labelLeft  = pad('', 10) + pad('ENC. DOACOES', 35);
            text += line(labelLeft, `  ENC. TRANSPORTES`);

            // Linha 15: espaço
            text += blank();

            // Linha 16: DADOS DA DOAÇÃO (centralizado)
            text += center('DADOS DA DOACAO', 80) + '\r\n';

            // Linha 17: Cabeçalho da tabela
            text += `${pad('QTDE', 8)} ${pad('VOLUME', 14)} ${pad('COD.DOACAO', 14)} DESCRICAO\r\n`;
            text += `${'-'.repeat(80)}\r\n`;

            // Itens
            chunk.forEach((it) => {
                const qtde  = pad(it.qtde != null ? String(Math.round(it.qtde)) : '', 7);
                const vol   = pad(it.unidade || 'UN', 14);
                const codIt = pad(donCode, 14);
                const desc  = up(it.item || '');
                text += `${qtde}  ${vol} ${codIt} ${desc}\r\n`;
            });

            // Preenche linhas vazias até completar MAX_ITEMS
            for (let i = chunk.length; i < MAX_ITEMS; i++) {
                text += blank();
            }

            // Avanço de papel extra para posicionar o logo abaixo da linha de corte
            text += '\r\n'.repeat(3);

            // ===================================================================
            // PARTE 2 — RECIBO (VIA DO DOADOR) - COM RECUO CORRETOR DE LOGO
            // ===================================================================
            text += '<<LOGO>>';

            // Comandos ESC/P para tratamento do posicionamento físico na impressora
            text += '\x1Bj\x90';          // Reverse Feed 144/216" (equivalente a 156 reverso + 12 avanço combinados)
            text += '\x1BF';              // Desliga negrito
            text += '\x1BM';              // Garante Elite (12 CPI)

            // Afastamento rígido de 14 colunas para descolar da largura física do LOGO gráfico
            const spacing = ' '.repeat(14);
            text += spacing + 'ASSOCIACAO ESPIRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES\r\n';
            text += spacing + 'RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SAO PAULO - SP\r\n';
            text += spacing + 'CEP 03610-030 - FONE: (11) 2164-1800 - CNPJ: 60.478.245/0001-50\r\n';
            text += spacing + 'EMAIL:DOACOES@ABRIGOBEZERRADEMENEZES.ORG.BR-SITE:WWW.ABRIGOBEZERRADEMENEZES.ORG.BR\r\n';
            
            text += '<<CABECALHO_FIM>>';
            text += '\r\n';

            // Restaura Elite (12 CPI) limpo sem condensado para o restante do recibo
            text += '\x1BM\x12';

            // Título do recibo
            text += center('RECIBO DA DOACAO', 80) + '\r\n';

            // Dados do recibo
            text += `Recebemos do(a) Sr.(a) ${dName}\r\n`;
            text += `Endereco: ${endereco}${compl ? ' - ' + compl : ''}\r\n`;
            text += `Bairro: ${pad(bairro, 20)} Cidade: ${pad(cidade, 18)} UF: ${pad(estado, 20)} CEP: ${cep}\r\n`;
            text += 'as mercadorias abaixo descriminadas:\r\n\r\n';

            // Tabela do recibo
            text += `${pad('QTDE', 8)} ${pad('VOLUME', 14)} ${pad('COD.DOACAO', 14)} DESCRICAO\r\n`;
            text += `${'-'.repeat(80)}\r\n`;

            chunk.forEach((it) => {
                const qtde  = pad(it.qtde != null ? String(Math.round(it.qtde)) : '', 7);
                const vol   = pad(it.unidade || 'UN', 14);
                const cod   = pad(donCode, 14);
                const desc  = up(it.item || '');
                text += `${qtde}  ${vol} ${cod} ${desc}\r\n`;
            });
            
            // Preenche linhas vazias até completar MAX_ITEMS
            for (let i = chunk.length; i < MAX_ITEMS; i++) {
                text += blank();
            }

            text += '<<RECIBO_FIM>>';
            text += `\r\nDATA: ${todayStr}\r\n\r\n`;
            text += center('____________________________________', 80) + '\r\n';
            text += center('Assinatura do responsavel', 80) + '\r\n';
            text += '\r\n'.repeat(4);

            fullText += text;

            if (index < chunks.length - 1) {
                fullText += '\r\n<<PAGE_BREAK>>';
            }
        });

        fullText += '\x1BP\x0C'; // Restaura Pica (10 CPI) + Avança formulário para próxima folha
        return fullText;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [donation, todayStr, userLoggerName]);

    // -----------------------------------------------------------------------
    // Impressão matricial via QZ Tray
    // -----------------------------------------------------------------------
    const handlePrintQZ = async () => {
        setIsPrintingQZ(true);
        try {
            const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;
            const textToPrint = rawText
                .replace(/<<PAGE_BREAK>>/g, '\x0C')
                .replace(/<<CABECALHO_FIM>>/g, '')
                .replace(/<<RECIBO_FIM>>/g, '');
            const result = await printService.printRawMatricial(textToPrint, logoUrl, '<<LOGO>>', 48, false);
            if (!result.success) {
                alert('Erro QZ Tray: ' + result.error);
            }
        } catch (e) {
            alert('Erro ao imprimir: ' + e.message);
        } finally {
            setIsPrintingQZ(false);
        }
    };

    // -----------------------------------------------------------------------
    // Impressão alternativa via HTML (Courier + iframe)
    // -----------------------------------------------------------------------
    const handlePrintHTML = () => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        const pages = rawText.split('<<PAGE_BREAK>>');
        const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;

        let pagesHtml = '';
        pages.forEach((page, index) => {
            const [fichaText, restoRecibo] = page.split('<<LOGO>>');
            // eslint-disable-next-line no-unused-vars
            const [cabecalhoText, restoRecibo2] = (restoRecibo || '').split('<<CABECALHO_FIM>>');
            const [reciboText] = (restoRecibo2 || '').split('<<RECIBO_FIM>>');
            pagesHtml += `
                <div class="page-container" ${index < pages.length - 1 ? 'style="page-break-after: always;"' : ''}>
                    <pre>${fichaText}</pre>
                    <div class="recibo-wrapper">
                        <div class="recibo-header-html">
                            <img src="${logoUrl}" class="logo-print" />
                            <div class="recibo-inst-html">
                                <div class="inst-title">ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</div>
                                <div class="inst-line">Rua DONA Vicentina Alegretti, 265 – Penha – São Paulo – SP</div>
                                <div class="inst-line">CEP 03610-030 – Telefone (11) 2164-1800 – C.N.P.J. 60.478.245/0001-5</div>
                                <div class="inst-email-site">E-mail: doacoes@abrigobezerrademenezes.org.br – Site: www.abrigobezerrademenezes.org.br</div>
                            </div>
                        </div>
                        <hr class="recibo-separator" />
                        <div class="recibo-titulo">RECIBO DA DOAÇÃO</div>
                        <hr class="recibo-separator" />
                        <div class="recibo-body-html">
                            <pre>${reciboText || ''}</pre>
                        </div>
                        <div class="recibo-footer-html">
                            <div>
                                <div>&nbsp;</div>
                                <div class="data-linha" style="margin-top:4px">DATA: ${todayStr}</div>
                            </div>
                            <div class="assinatura-block">
                                <div class="linha-assinatura">____________________________________</div>
                                <div class="label-assinatura" style="margin-top:4px">Assinatura do responsável</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        doc.write(`
            <html>
                <head>
                    <title>Ficha Doação Matricial - ${donCode}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { margin: 0; padding: 8mm 6mm; background: white; }
                        pre {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 9.5pt;
                            line-height: 1.0;
                            margin: 0;
                            white-space: pre;
                            color: #000;
                            font-weight: normal !important;
                        }
                        .recibo-wrapper {
                            margin-top: 4mm;
                            padding-top: 0;
                            position: relative;
                            display: flex;
                            flex-direction: column;
                        }
                        .recibo-header-html {
                            display: flex;
                            align-items: flex-start;
                            gap: 28px;
                            margin-bottom: 2mm;
                            padding-bottom: 2mm;
                        }
                        .logo-print {
                            width: 35px;
                            height: auto;
                            flex-shrink: 0;
                            margin-top: 2px;
                        }
                        .recibo-inst-html {
                            flex: 1;
                            text-align: center;
                            font-family: 'Courier New', Courier, monospace;
                            color: #000;
                            line-height: 1.2;
                            padding-left: 30px;
                        }
                        .inst-title {
                            font-size: 11pt;
                            font-weight: normal !important;
                            letter-spacing: 0.06em;
                            text-transform: uppercase;
                        }
                        .inst-line {
                            font-size: 10pt;
                            font-weight: normal !important;
                        }
                        .inst-email-site {
                            font-size: 9pt;
                            font-weight: normal !important;
                        }
                        .recibo-inst-html * {
                            font-weight: normal !important;
                        }
                        .recibo-separator {
                            border: none;
                            border-top: 1px solid #000;
                            margin: 1mm 0;
                        }
                        .recibo-titulo {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 10.5pt;
                            font-weight: normal !important;
                            text-align: center;
                            letter-spacing: 0.1em;
                            padding: 0.5mm 0;
                        }
                        .recibo-body-html {
                            flex: 1;
                            margin-top: 1mm;
                        }
                        .recibo-body-html pre {
                            font-weight: normal !important;
                        }
                        .recibo-footer-html {
                            display: flex;
                            justify-content: space-between;
                            align-items: baseline;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 9.5pt;
                            font-weight: normal !important;
                            color: #000;
                            margin-top: 2mm;
                        }
                        .assinatura-block {
                            text-align: center;
                        }
                        @media print {
                            @page { size: 215.9mm 279.4mm; margin: 0; }
                            body { padding: 8mm 6mm; margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${pagesHtml}
                    <script>
                        window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
                    <\/script>
                </body>
            </html>
        `);
        doc.close();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 3000);
    };

    const pagesPreview = rawText.split('<<PAGE_BREAK>>');

    return (
        <div id={printId} className={`modal-overlay ${printId}`}>
            <style dangerouslySetInnerHTML={{ __html: `
                .fm-modal-box {
                    background: white !important;
                    width: 98%;
                    max-width: 1000px;
                    max-height: 97vh;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.55);
                    color: black !important;
                }
                .fm-header-actions {
                    background: #f1f5f9;
                    padding: 14px 28px;
                    border-bottom: 2px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 14px;
                    z-index: 1000;
                    flex-shrink: 0;
                }
                .fm-header-title {
                    font-family: 'Courier New', monospace;
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .fm-header-badge {
                    background: #0f172a;
                    color: #e2e8f0;
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 6px;
                    letter-spacing: 1px;
                }
                .fm-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px 24px 28px 24px;
                    background: #e8e6f0 !important;
                }
                .fm-paper {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.15);
                    border-radius: 4px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    min-height: 250mm;
                }
                .fm-section-label {
                    background: #0f172a;
                    color: #94a3b8;
                    font-family: 'Courier New', monospace;
                    font-size: 0.7rem;
                    letter-spacing: 2px;
                    padding: 4px 16px;
                    text-transform: uppercase;
                }
                .fm-pre {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 10pt;
                    line-height: 1.0;
                    white-space: pre;
                    color: #0f172a;
                    background: white;
                    padding: 10px 20px;
                    margin: 0;
                    overflow-x: auto;
                    font-weight: normal !important;
                }
                .fm-recibo-header {
                    background: white;
                    padding: 8px 20px 6px 20px;
                    border-top: 2px dashed #94a3b8;
                    margin-top: 2mm;
                    display: flex;
                    align-items: flex-start;
                    gap: 28px;
                }
                .fm-recibo-header img {
                    width: 32px;
                    height: auto;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .fm-recibo-inst {
                    flex: 1;
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    color: #0f172a;
                    line-height: 1.2;
                    font-weight: normal !important;
                    padding-left: 30px;
                }
                .fm-recibo-inst * {
                    font-weight: normal !important;
                }
                .fm-inst-title {
                    font-size: 11pt;
                    font-weight: normal !important;
                    letter-spacing: 0.07em;
                    text-transform: uppercase;
                }
                .fm-inst-line {
                    font-size: 10pt;
                    font-weight: normal !important;
                }
                .fm-inst-email-site {
                    font-size: 9pt;
                    font-weight: normal !important;
                }
                .fm-recibo-separator {
                    border: none;
                    border-top: 1px solid #0f172a;
                    margin: 3px 20px;
                }
                .fm-recibo-titulo {
                    font-family: 'Courier New', monospace;
                    font-size: 10.5pt;
                    font-weight: normal !important;
                    text-align: center;
                    letter-spacing: 0.1em;
                    padding: 2px 20px;
                    color: #0f172a;
                }
                .fm-recibo-body {
                    background: white;
                    padding: 0 20px;
                }
                .fm-recibo-footer {
                    background: white;
                    padding: 0 20px 24px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    font-family: 'Courier New', monospace;
                    font-size: 10pt;
                    font-weight: normal !important;
                    color: #0f172a;
                }
                .fm-assinatura-block {
                    text-align: center;
                }
                .fm-info-bar {
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    padding: 8px 20px;
                    font-size: 0.78rem;
                    color: #64748b;
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .fm-info-bar span::before { content: '✓ '; color: #22c55e; }

                @media print {
                    .fm-modal-box { width: 100% !important; max-width: none !important; box-shadow: none !important; border-radius: 0 !important; }
                    .fm-scroll-area { padding: 0 !important; overflow: visible !important; background: white !important; }
                    .fm-header-actions { display: none !important; }
                    .fm-paper { box-shadow: none !important; }
                    .fm-section-label { display: none !important; }
                    .fm-info-bar { display: none !important; }
                }
            `}} />

            <div className="fm-modal-box print-target">
                {/* Barra de ações */}
                <div className="fm-header-actions no-print">
                    <div className="fm-header-title">
                        <Printer size={18} />
                        Ficha de Doação — Impressora Matricial
                        <span className="fm-header-badge">80 COLS</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrintQZ} 
                            disabled={isPrintingQZ}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Zap size={16} />
                            {isPrintingQZ ? 'Imprimindo...' : 'Imprimir Direto (QZ)'}
                        </button>
                        <button 
                            onClick={handlePrintHTML}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Printer size={16} />
                            Imprimir Alternativo (HTML)
                        </button>
                        <button 
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Área de Visualização */}
                <div className="fm-scroll-area">
                    {pagesPreview.map((page, idx) => {
                        const [ficha, resto] = page.split('<<LOGO>>');
                        // eslint-disable-next-line no-unused-vars
                        const [cabecalho, resto2] = (resto || '').split('<<CABECALHO_FIM>>');
                        const [recibo] = (resto2 || '').split('<<RECIBO_FIM>>');

                        return (
                            <div key={idx} className="fm-paper mb-6">
                                <div className="fm-section-label">PÁGINA {idx + 1} — VIA DE CONTROLE INTERNO</div>
                                <pre className="fm-pre">{ficha}</pre>
                                
                                <div className="fm-section-label">VIA DO DOADOR (RECIBO)</div>
                                
                                {/* Header do Recibo renderizado na tela */}
                                <div className="fm-recibo-header">
                                    <img src={`${window.location.origin}/LogoAbrBMPB01.png`} alt="Logo" />
                                    <div className="fm-recibo-inst">
                                        <div className="fm-inst-title">ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</div>
                                        <div className="fm-inst-line">Rua DONA Vicentina Alegretti, 265 - Penha - São Paulo - SP</div>
                                        <div className="fm-inst-line">CEP 03610-030 - FONE: (11) 2164-1800 - CNPJ: 60.478.245/0001-50</div>
                                        <div className="fm-inst-email-site">EMAIL:DOACOES@ABRIGOBEZERRADEMENEZES.ORG.BR-SITE:WWW.ABRIGOBEZERRADEMENEZES.ORG.BR</div>
                                    </div>
                                </div>
                                
                                <hr className="fm-recibo-separator" />
                                <div className="fm-recibo-titulo">RECIBO DA DOAÇÃO</div>
                                <hr className="fm-recibo-separator" />
                                
                                <div className="fm-recibo-body">
                                    <pre className="fm-pre" style={{padding: '10px 0'}}>{recibo}</pre>
                                </div>
                                
                                <div className="fm-recibo-footer">
                                    <div>DATA: {todayStr}</div>
                                    <div className="fm-assinatura-block">
                                        <div>____________________________________</div>
                                        <div style={{marginTop: '4px'}}>Assinatura do responsável</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Barra informativa inferior */}
                <div className="fm-info-bar no-print">
                    <span>Configurado para EPSON FX-890</span>
                    <span>Fonte Elite 12 CPI</span>
                    <span>Paginação Automática (Máx 10 Itens)</span>
                </div>
            </div>
        </div>
    );
};

export default DoacaoFichaMatricial;