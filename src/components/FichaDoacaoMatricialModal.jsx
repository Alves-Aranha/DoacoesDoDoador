import React, { useMemo, useState } from 'react';
import { Printer, X, Zap } from 'lucide-react';
import printService from '../services/printService';
// NOTA: cleanText é aplicado no printService.printRawMatricial() automaticamente.
// A pré-visualização em tela preserva acentos (ã, õ, ç etc.) para melhor leitura.
// Na impressão real, cleanText remove acentos para compatibilidade com a Epson FX890.

const FichaDoacaoMatricialModal = ({ donation, userLoggerName, onClose, useTonerForNormal = false }) => {
    const printId = useMemo(() => `print-matricial-${Math.random().toString(36).substr(2, 9)}`, []);
    const [isPrintingQZ, setIsPrintingQZ] = useState(false);

    if (!donation) return null;

    // -----------------------------------------------------------------------
    // Funções auxiliares de formatação
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
        const numeric = cep.replace(/\D/g, '');
        if (numeric.length !== 8) return cep;
        return `${numeric.substring(0, 5)}-${numeric.substring(5)}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const numeric = phone.replace(/\D/g, '');
        if (numeric.length === 11) return `(${numeric.substring(0, 2)}) ${numeric.substring(2, 7)}-${numeric.substring(7)}`;
        if (numeric.length === 10) return `(${numeric.substring(0, 2)}) ${numeric.substring(2, 6)}-${numeric.substring(6)}`;
        return phone;
    };

    // toUpper simples — preserva acentos e cedilha para a matricial
    const up = (text) => {
        if (!text) return '';
        return text.toString().toUpperCase();
    };

    const donorInfo = donation.doadores || {};
    const donorName = donation.nomeDoador || donorInfo.nome || '';
    const todayStr  = new Date().toLocaleDateString('pt-BR');

    // -----------------------------------------------------------------------
    // rawText: texto completo enviado para a impressora
    // CORREÇÃO: sem .toUpperCase() no final (corromperia comandos ESC/P)
    // CORREÇÃO: acentos e cedilha PRESERVADOS (impressora suporta via CP850)
    // CORREÇÃO: logo será inserido pelo printService via ESC/P bitmap
    //           na posição marcada por '<<LOGO>>' antes do cabeçalho do recibo
    // -----------------------------------------------------------------------
    const rawText = useMemo(() => {
        let dInfo = donation.doadores || {};
        // Se vier como array do Supabase, pega o primeiro item
        if (Array.isArray(dInfo)) dInfo = dInfo[0] || {};

        const dName      = up(donation.nomeDoador || dInfo.nome || '');
        const dCode      = donation.codigoDoador || '';
        const donCode    = donation.codigo || '';
        const tipoDoador = up(dInfo.tipo || 'Comum');
        const dtRetirada = formatDate(donation.dataRetirada || donation.data_retirada);
        const dtRemarcado= formatDate(donation.remarcado_para);
        const obs        = up(donation.observacoes);
        const contato    = up(dInfo.contato);
        const cep        = formatCEP(dInfo.cep);
        const tipoLogradouro = up(dInfo.logradouro || '');
        const nomeEndereco   = up(dInfo.endereco || '');
        const enderecoCompleto = `${tipoLogradouro} ${nomeEndereco}`.trim();
        const numero     = up(dInfo.numero || '');
        const compl      = up(dInfo.complemento);
        const bairro     = up(dInfo.bairro);
        const mapa       = up(dInfo.mapa);
        const fone       = formatPhone(dInfo.fone);
        const cel1       = formatPhone(dInfo.celular);
        const regiao     = up(dInfo.regiao);
        const cidade     = up(dInfo.cidade || 'SÃO PAULO');
        const estado     = up(dInfo.estado || 'SP');
        const responsavel= up((donation.responsavel || userLoggerName || '').split('@')[0]);

        const pad    = (str, length) => (str || '').toString().substring(0, length).padEnd(length, ' ');
        const line   = (left, right) => pad(left, 61) + right + '\r\n';
        const center = (str, width = 80) => {
            const s = str.toString();
            const padLen = Math.max(0, Math.floor((width - s.length) / 2));
            return ' '.repeat(padLen) + s;
        };

        let text = '';

        // ===================================================================
        // PARTE 1 — FICHA DE CONTROLE INTERNO
        // ===================================================================
        text += line(`DOADOR: ${pad(dCode, 6)} DOAÇÃO: ${pad(donCode, 8)} TIPO DOADOR: ${pad(tipoDoador, 15)}`, `SÃO PAULO, ${todayStr}`);
        text += line(`RETIRAR EM     ${pad(dtRetirada, 46)}`,  `REMARCADO  ${dtRemarcado}`);
        text += line(`OBS.           ${pad(obs, 46)}`,          `CONTATO    ${contato}`);
        text += line('', ''); 
        text += line(`NOME           ${pad(dName, 46)}`,        `CEP        ${cep}`);
        text += line(`ENDEREÇO       ${pad(enderecoCompleto, 46)}`, `COMPL.     ${compl}`);
        text += line(`BAIRRO         ${pad(bairro, 46)}`,       `MAPA       ${mapa}`);
        text += line(`TELEFONES      RES: ${pad(fone, 15)} CEL: ${pad(cel1, 15)}`, `REGIÃO     ${regiao}`);
        text += line(`VEÍCULO        ______________________________`,               `MOTORISTA  _________`);
        text += '\n';
        text += line(`                 ${pad(responsavel, 44)}`, `       AURO`);
        text += line(`               ENC. DOAÇÕES`,              `  ENC. TRANSPORTES`);
        text += `\r\n                            DOAÇÃO\r\n\r\n`;

        // Itens da doação
        // Itens da doação - Sempre ocupa 15 linhas para manter o alinhamento
        const items = (donation.itens || []).slice(0, 15);
        items.forEach(it => {
            const qtde    = pad(it.qtde, 4);
            const unid    = pad(up(it.unidade || 'UN'), 4);
            const codItem = pad(it.codigo_item || '', 8);
            const vol     = pad('1/1', 8);
            const desc    = up(it.item);
            text += `${qtde} ${unid} ${codItem} ${vol} ${desc}\n`;
        });
        
        // Preenche com linhas vazias se tiver menos de 15 itens
        for (let i = items.length; i < 15; i++) {
            text += '\n';
        }

        // Espaço para avançar papel até a posição do cabeçalho do recibo
        // Reduzido de 8 para 1 para compensar o aumento de 7 linhas nos itens (15-8=7)
        text += '\r\n';

        // ===================================================================
        // PARTE 2 — RECIBO (VIA DOADOR)
        //
        // '<<LOGO>>' é o marcador onde o printService vai inserir
        // o logo como bitmap ESC/P antes de imprimir.
        // Na pré-visualização da tela ele é substituído por um placeholder.
        // ===================================================================
        text += '<<LOGO>>';

        // Cabeçalho da instituição — deslocado à direita (padding 15 espaços)
        text += '               ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES\r\n';
        text += '                  Rua Dona Vicentina Alegretti, 265 - Penha - São Paulo - SP\r\n';
        text += '              CEP 03610-030 - Telefone (11) 2164-1800 - C.N.P.J. 60.478.245/0001-50\r\n\r\n';

        // Título do recibo
        text += center('RECIBO DA DOAÇÃO', 80) + '\r\n\r\n';

        // Dados
        text += `RECEBEMOS DO(A) SR.(A): ${dName}\r\n`;
        text += `ENDEREÇO: ${enderecoCompleto}${numero ? ', ' + numero : ''}${compl ? ' - ' + compl : ''}\r\n`;

        const bPad = pad(bairro, 16);
        const cPad = pad(cidade, 15);
        const uPad = pad(estado, 10);
        text += `BAIRRO: ${bPad} CIDADE: ${cPad} UF: ${uPad} CEP: ${cep}\r\n`;
        text += `${'-'.repeat(80)}\r\n`;
        text += `QUANTIDADE  UNIDADE     CÓD.DOAÇÃO   DESCRIÇÃO\r\n`;

        (donation.itens || []).forEach(it => {
            const qtde = pad(it.qtde, 11);
            const unid = pad(up(it.unidade || 'UN'), 11);
            const cod  = pad(donCode, 12);
            const desc = up(it.item);
            text += `${qtde} ${unid} ${cod} ${desc}\r\n`;
        });

        text += `\r\nDATA: ${todayStr}\r\n\r\n`;
        text += center('________________________', 80) + '\r\n';
        text += center('Assinatura do Responsável:', 80) + '\r\n';
        text += '\r\n\r\n\r\n\r\n\r\n';

        // ATENÇÃO: NÃO chamar .toUpperCase() aqui!
        // Isso quebraria os acentos e os comandos ESC/P do logo.
        return text;

    }, [donation, todayStr, userLoggerName]);

    // -----------------------------------------------------------------------
    // Impressão matricial via QZ Tray
    // Passa a URL do logo para o printService converter em ESC/P bitmap
    // -----------------------------------------------------------------------
    const handlePrintQZ = async () => {
        setIsPrintingQZ(true);
        try {
            const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;

            // Substitui o marcador <<LOGO>> pelo logo ESC/P bitmap dentro do printService
            const result = await printService.printRawMatricial(
                rawText,
                logoUrl,
                '<<LOGO>>'   // marcador que o printService vai localizar e substituir
            );

            if (!result.success) {
                alert("Erro QZ Tray: " + result.error);
            }
        } catch (e) {
            alert("Erro ao imprimir: " + e.message);
        } finally {
            setIsPrintingQZ(false);
        }
    };

    // -----------------------------------------------------------------------
    // Impressão normal HTML (botão laranja) — mantida sem alterações
    // -----------------------------------------------------------------------
    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        if (useTonerForNormal) {
            // Lógica de Impressão Toner (Texto Courier)
            const [fichaText, reciboText] = rawText.split('<<LOGO>>');
            const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;
            
            doc.write(`
                <html>
                    <head>
                        <title>Ficha de Doação Toner</title>
                        <style>
                            body { margin: 0; padding: 15mm 10mm; background: white; }
                            pre { 
                                font-family: 'Courier New', Courier, monospace; 
                                font-size: 9.5pt; 
                                line-height: 1.1; 
                                margin: 0; 
                                white-space: pre;
                                color: black;
                                letter-spacing: -0.2px;
                            }
                            .recibo-wrapper { margin-top: 30mm; position: relative; border-top: 1px dashed #ccc; padding-top: 20mm; }
                            .logo-print { 
                                width: 80px; 
                                height: auto; 
                                position: absolute; 
                                left: 0; 
                                top: 20mm; 
                            }
                            @media print {
                                @page { size: A4 portrait; margin: 0; }
                                body { padding: 15mm 10mm; }
                            }
                        </style>
                    </head>
                    <body>
                        <pre>${fichaText}</pre>
                        <div class="recibo-wrapper">
                            <img src="${logoUrl}" class="logo-print" />
                            <pre>${reciboText || ''}</pre>
                        </div>
                        <script>
                            window.onload = () => { 
                                window.print(); 
                                setTimeout(() => window.close(), 500); 
                            };
                        </script>
                    </body>
                </html>
            `);
        } else {
            // Lógica de Impressão Normal HTML (Mantida)
            let dInfo   = Array.isArray(donation.doadores) ? (donation.doadores[0] || {}) : (donation.doadores || {});
            const dName   = donation.nomeDoador || dInfo.nome || '';
            const donCode = donation.codigo || '';
            const donorCode = donation.codigoDoador || '';
            const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png?t=${new Date().getTime()}`;

            doc.write(`
                <html>
                    <head>
                        <title>Impressão - Ficha de Doação</title>
                        <style>
                            body { margin:0; padding:0; background:white; font-family:'Segoe UI',Roboto,sans-serif; color:black; }
                            @media print { @page { size:A4 portrait; margin:10mm; } }
                            .print-container { width:100%; max-width:190mm; margin:0 auto; padding:20px; }
                            .header { display:flex; align-items:center; margin-bottom:20px; border-bottom:2px solid #000; padding-bottom:15px; }
                            .logo { width:60px; height:auto; margin-right:15px; }
                            .inst-info { text-align:center; flex:1; }
                            .inst-info h2 { font-size:1.1rem; margin:0; font-weight:900; }
                            .inst-info p { font-size:0.8rem; margin:2px 0; }
                            .title { text-align:center; text-transform:uppercase; margin:15px 0; font-size:1.4rem; text-decoration:underline; font-weight:bold; }
                            .section { margin-top:15px; margin-bottom:10px; }
                            .section-title { font-size:1rem; font-weight:900; border-bottom:2px solid #000; padding-bottom:3px; margin-bottom:8px; text-transform:uppercase; }
                            .grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; font-size:0.95rem; }
                            .field { margin-bottom:3px; }
                            .field strong { font-weight:700; margin-right:5px; }
                            table { width:100%; border-collapse:collapse; margin-top:10px; font-size:11pt; }
                            th { background:#eee; border:2px solid #000; padding:5px; text-align:left; }
                            td { border:2px solid #000; padding:5px; }
                            .obs { margin-top:20px; padding:8px; border:2px solid #000; font-size:0.9rem; }
                            .footer { margin-top:40px; display:flex; justify-content:space-between; }
                            .sign-box { width:45%; border-top:1px solid black; text-align:center; padding-top:5px; font-size:0.85rem; }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            <div class="title">Ficha de Doação</div>
                            <div class="section">
                                <div class="section-title">Identificação</div>
                                <div class="grid">
                                    <div class="field"><strong>Cód. Doação:</strong> ${donCode}</div>
                                    <div class="field"><strong>Cód. Doador:</strong> ${donorCode}</div>
                                    <div class="field"><strong>Doador:</strong> ${dName}</div>
                                    <div class="field"><strong>Retirar em:</strong> ${formatDate(donation.dataRetirada || donation.data_retirada)}</div>
                                    <div class="field"><strong>Remarcado:</strong> ${formatDate(donation.remarcado_para)}</div>
                                </div>
                            </div>
                            <div class="section">
                                <div class="section-title">Endereço de Retirada</div>
                                <div class="grid">
                                    <div class="field"><strong>CEP:</strong> ${formatCEP(dInfo.cep)}</div>
                                    <div class="field"><strong>Endereço:</strong> ${dInfo.logradouro || ''} ${dInfo.endereco || ''} ${dInfo.numero || ''}</div>
                                    <div class="field"><strong>Complemento:</strong> ${dInfo.complemento || '---'}</div>
                                    <div class="field"><strong>Bairro:</strong> ${dInfo.bairro || ''}</div>
                                    <div class="field"><strong>Cidade:</strong> ${dInfo.cidade || ''} - ${dInfo.estado || ''}</div>
                                    <div class="field"><strong>Telefone:</strong> ${formatPhone(dInfo.fone)}</div>
                                </div>
                            </div>
                            <div class="section">
                                <div class="section-title">Itens da Doação</div>
                                <table>
                                    <thead>
                                        <tr><th>DOAÇÃO</th><th>UNIDADE</th><th>DESCRIÇÃO</th><th style="text-align:center;">QTDE</th></tr>
                                    </thead>
                                    <tbody>
                                        ${(donation.itens || []).map(it => `
                                            <tr>
                                                <td>${donCode}</td>
                                                <td>${it.unidade || 'UN'}</td>
                                                <td>${it.item}</td>
                                                <td style="text-align:center;">${it.qtde}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div class="obs"><strong>Observações:</strong> ${donation.observacoes || 'Sem observações'}</div>
                            <div class="footer" style="justify-content: center;">
                                <div class="sign-box">Assinatura do Responsável:</div>
                            </div>
                            <div style="margin-top:60px; border-top:2px dashed #000; padding-top:30px;">
                                <div class="header">
                                    <img src="${logoUrl}" class="logo" onerror="this.style.display='none'" />
                                    <div class="inst-info">
                                        <h2>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                                        <p>CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800</p>
                                        <p>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                                    </div>
                                </div>
                                <div class="title" style="font-size:1.1rem; border-top:1px solid #000; border-bottom:1px solid #000; padding:5px 0;">RECIBO DE DOAÇÃO (VIA DOADOR)</div>
                                <div style="font-size:0.95rem; margin-top:20px;">
                                    <p><strong>RECEBEMOS DE:</strong> ${dName}</p>
                                    <p><strong>REFERENTE À DOAÇÃO CÓD:</strong> ${donCode}</p>
                                    <p style="margin-top:15px;"><strong>ITENS RECEBIDOS:</strong></p>
                                    <ul style="list-style-type:none; padding-left:0; margin-top:5px;">
                                        ${(donation.itens || []).map(it => `
                                            <li>- ${it.qtde} ${it.unidade || 'UN'} DE ${it.item}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    <script>
                        const img = document.querySelector('img');
                        const doPrint = () => { window.print(); setTimeout(() => window.close(), 500); };
                        if (img) { img.onload = doPrint; img.onerror = () => setTimeout(doPrint, 300); }
                        else { setTimeout(doPrint, 700); }
                    </script>
                    </body>
                </html>
            `);
        }
        doc.close();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 3000);
    };

    // -----------------------------------------------------------------------
    // Pré-visualização: substitui <<LOGO>> por placeholder visual na tela
    // -----------------------------------------------------------------------
    // Divide rawText pelo marcador para pré-visualização
    const [fichaPreview, reciboPreview] = rawText.split('<<LOGO>>');

    return (
        <div id={printId} className={`modal-overlay ${printId}`}>
            <style dangerouslySetInnerHTML={{ __html: `
                .ficha-modal-box {
                    background: white !important;
                    width: 95%; max-width: 950px; max-height: 95vh;
                    border-radius: 16px; display: flex; flex-direction: column;
                    overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                    color: black !important;
                }
                .modal-header-actions {
                    background: #f1f5f9; padding: 15px 30px;
                    border-bottom: 2px solid #e2e8f0;
                    display: flex; justify-content: flex-end; gap: 15px;
                    z-index: 1000; flex-shrink: 0;
                }
                .ficha-scroll-area {
                    flex: 1; overflow-y: auto;
                    padding: 0 30px 30px 30px;
                    background: white !important;
                }
                @media print {
                    @page { margin: 0; size: 215.9mm 279.4mm; }
                    html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    .ficha-modal-box { width: 100% !important; max-width: none !important; box-shadow: none !important; border-radius: 0 !important; }
                    .ficha-scroll-area { padding: 0 !important; overflow: visible !important; }
                }
            `}} />

            <div className="ficha-modal-box print-target">
                <div className="modal-header-actions no-print">
                    <button type="button" className="btn-action btn-secondary" onClick={onClose}>
                        <X size={18} /> FECHAR
                    </button>
                    <button
                        type="button"
                        className="btn-action btn-primary"
                        style={{ background: '#059669' }}
                        onClick={handlePrintQZ}
                        disabled={isPrintingQZ}
                    >
                        <Zap size={18} /> {isPrintingQZ ? 'CONECTANDO...' : 'IMPRIMIR MATRICIAL'}
                    </button>
                    <button type="button" className="btn-action btn-primary" style={{ background: '#d97706' }} onClick={handlePrint}>
                        <Printer size={18} /> IMPRIMIR NORMAL
                    </button>
                </div>

                <div className="ficha-scroll-area">
                    <div style={{ width: '100%', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '20px' }}>

                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Printer size={20} /> Pré-visualização da Impressão Matricial
                        </h3>

                        {/* Ficha de controle */}
                        <pre style={{
                            backgroundColor: 'white', padding: '20px', borderRadius: '8px',
                            border: '1px dashed #cbd5e1',
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '12pt', lineHeight: '1.2', whiteSpace: 'pre-wrap',
                            color: '#0f172a', marginBottom: '20px'
                        }}>
                            {fichaPreview}
                        </pre>

                        {/* Placeholder do logo na pré-visualização — alinhado à esquerda */}
                        <div style={{
                            background: 'white', padding: '10px 20px',
                            border: '1px dashed #cbd5e1', borderBottom: 'none',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px'
                        }}>
                            <img
                                src={`/LogoAbrBMPB01.png?t=${new Date().getTime()}`}
                                alt="Logo"
                                style={{ width: '35px', height: 'auto', flexShrink: 0 }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            <div style={{ fontFamily: "'Courier New', Courier, monospace", textAlign: 'left' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</div>
                                <div style={{ fontSize: '8pt' }}>Rua Dona Vicentina Alegretti, 265 - Penha - São Paulo - SP</div>
                                <div style={{ fontSize: '8pt' }}>CEP 03610-030 - Telefone (11) 2164-1800 - C.N.P.J. 60.478.245/0001-50</div>
                            </div>
                        </div>

                        {/* Recibo */}
                        <pre style={{
                            backgroundColor: 'white', padding: '0 20px 20px 20px',
                            border: '1px dashed #cbd5e1', borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '12pt', lineHeight: '1.2', whiteSpace: 'pre-wrap',
                            color: '#0f172a'
                        }}>
                            {reciboPreview || ''}
                        </pre>

                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
                            ✓ Acentos e cedilha preservados &nbsp;|&nbsp; ✓ Logo impresso via ESC/P bitmap &nbsp;|&nbsp; ✓ Sem corrupção de caracteres
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FichaDoacaoMatricialModal;
