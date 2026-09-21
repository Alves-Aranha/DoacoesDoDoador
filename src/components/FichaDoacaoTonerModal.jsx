import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';

const FichaDoacaoTonerModal = ({ donation, onClose }) => {
    if (!donation) return null;

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

    const up = (text) => text ? text.toString().toUpperCase() : '';

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const logoUrl = `${window.location.origin}/LogoAbrBMPB01.png`;

    // -----------------------------------------------------------------------
    // Geração do texto identico à matricial
    // -----------------------------------------------------------------------
    const pages = useMemo(() => {
        let dInfo = donation.doadores || {};
        // Se vier como array do Supabase, pega o primeiro item
        if (Array.isArray(dInfo)) dInfo = dInfo[0] || {};
        
        const dName      = up(donation.nomeDoador || dInfo.nome || '');
        const dCode      = donation.codigo_doador || donation.codigoDoador || '';
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
        const responsavel= up((donation.responsavel || '').split('@')[0]);

        const pad    = (str, length) => (str || '').toString().substring(0, length).padEnd(length, ' ');
        const line   = (left, right) => pad(left, 61) + right + '\n';
        const center = (str, width = 80) => {
            const s = str.toString();
            const padLen = Math.max(0, Math.floor((width - s.length) / 2));
            return ' '.repeat(padLen) + s;
        };

        const allItems = donation.itens || [];
        const chunkSize = 14;
        const totalPages = Math.max(1, Math.ceil(allItems.length / chunkSize));
        
        const pagesData = [];

        for (let i = 0; i < totalPages; i++) {
            const pageItems = allItems.slice(i * chunkSize, (i + 1) * chunkSize);

            let t1 = '';
            t1 += line(`DOADOR: ${pad(dCode, 6)} DOAÇÃO: ${pad(donCode, 8)} TIPO DOADOR: ${pad(tipoDoador, 15)}`, `SÃO PAULO, ${todayStr}`);
            t1 += line(`RETIRAR EM     ${pad(dtRetirada, 46)}`,  `REMARCADO  ${dtRemarcado}`);
            t1 += line(`OBS.           ${pad(obs, 46)}`,          `CONTATO    ${contato}`);
            t1 += line('', ''); 
            t1 += line(`NOME           ${pad(dName, 46)}`,        `CEP        ${cep}`);
            t1 += line(`ENDEREÇO       ${pad(enderecoCompleto, 46)}`, `COMPL.     ${compl}`);
            t1 += line(`BAIRRO         ${pad(bairro, 46)}`,       `MAPA       ${mapa}`);
            t1 += line(`TELEFONES      RES: ${pad(fone, 15)} CEL: ${pad(cel1, 15)}`, `REGIÃO     ${regiao}`);
            t1 += line(`VEÍCULO        ______________________________`,               `MOTORISTA  _________`);
            t1 += '\n';
            t1 += line(`                 ${pad(responsavel, 44)}`, `       AURO`);
            t1 += line(`               ENC. DOAÇÕES`,              `  ENC. TRANSPORTES`);
            t1 += `\n                            DOAÇÃO\n\n`;
            t1 += `${'-'.repeat(85)}\n`;
            t1 += `QTDE          VOLUME          COD.DOAÇÃO          DESCRIÇÃO\n`;

            // Itens da doação - Sempre ocupa 14 linhas para manter o alinhamento
            pageItems.forEach(it => {
                t1 += `${pad(it.qtde, 14)}${pad(up(it.unidade || 'UN'), 16)}${pad(donCode, 20)}${up(it.item)}\n`;
            });

            // Preenche com linhas vazias se tiver menos de 14 itens
            for (let j = pageItems.length; j < 14; j++) {
                t1 += '\n';
            }

            let t2 = '';
            t2 += '               ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES\n';
            t2 += '                  Rua Dona Vicentina Alegretti, 265 - Penha - São Paulo - SP\n';
            t2 += '              CEP 03610-030 - Telefone (11) 2164-1800 - C.N.P.J. 60.478.245/0001-50\n\n';
            t2 += center('RECIBO DA DOAÇÃO', 80) + '\n\n';
            t2 += `RECEBEMOS DO(A) SR.(A): ${dName}\n`;
            t2 += `ENDEREÇO: ${enderecoCompleto}${numero ? ', ' + numero : ''}${compl ? ' - ' + compl : ''}\n`;
            t2 += `BAIRRO: ${pad(bairro, 16)} CIDADE: ${pad('SÃO PAULO', 15)} UF: ${pad('SP', 10)} CEP: ${cep}\n`;
            t2 += `${'-'.repeat(85)}\n`;
            t2 += `QTDE          VOLUME          COD.DOAÇÃO          DESCRIÇÃO\n`;

            pageItems.forEach(it => {
                t2 += `${pad(it.qtde, 14)}${pad(up(it.unidade || 'UN'), 16)}${pad(donCode, 20)}${up(it.item)}\n`;
            });

            // Preenche com linhas vazias se tiver menos de 14 itens no recibo também,
            // garantindo que a assinatura fique fixa na mesma posição no final
            for (let j = pageItems.length; j < 14; j++) {
                t2 += '\n';
            }

            // Ajuste: menos quebras para evitar criação de página extra
            t2 += '\n\n';
            t2 += center('________________________', 80) + '\n';
            t2 += center('Assinatura do Responsável:', 80) + '\n';

            pagesData.push({ fichaText: t1, reciboText: t2 });
        }

        return pagesData;
    }, [donation, todayStr]);

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        
        const pagesHtml = pages.map((page, index) => `
            <div class="print-page${index > 0 ? ' page-break' : ''}">
                <div class="ficha-pre"><pre>${page.fichaText}</pre></div>
                <div class="recibo-wrapper">
                    <img src="${logoUrl}" class="logo-print" />
                    <pre>${page.reciboText}</pre>
                </div>
            </div>
        `).join('');

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
                        .print-page { page-break-inside: avoid; }
                        .page-break { page-break-before: always; break-before: page; display: block; }
                        .page-break .ficha-pre { padding-top: 6mm; }
                        .recibo-wrapper { margin-top: 12mm; position: relative; border-top: 1px dashed #ccc; padding-top: 6mm; }
                        .logo-print { width: 80px; height: auto; position: absolute; left: 0; top: 0; }
                        @media print {
                            @page { size: A4 portrait; margin: 12mm 10mm; }
                            body { padding: 12mm 10mm; }
                        }
                    </style>
                </head>
                <body>
                    ${pagesHtml}
                    <script>
                        window.onload = () => { 
                            window.print(); 
                            setTimeout(() => window.close(), 500); 
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
        setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 3000);
    };

    return (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '20px', paddingBottom: '20px', overflowY: 'auto' }}>
            <div className="ficha-modal-box" style={{ background: 'white', maxWidth: '950px', width: '95%', margin: 'auto' }}>
                <div className="modal-header-actions no-print" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#f8fafc', padding: '15px' }}>
                    <button type="button" className="btn-action btn-secondary" onClick={onClose}>
                        <X size={18} /> FECHAR
                    </button>
                    <button type="button" className="btn-action btn-primary" style={{ background: '#d97706' }} onClick={handlePrint}>
                        <Printer size={18} /> IMPRIMIR (TONER)
                    </button>
                </div>

                <div className="ficha-scroll-area" style={{ padding: '20px', background: '#f1f5f9' }}>
                    {pages.map((page, i) => (
                        <div key={i} style={{ background: 'white', padding: '40px', borderRadius: '4px', boxShadow: '0 0 20px rgba(0,0,0,0.1)', overflowX: 'auto', marginBottom: '20px' }}>
                            <pre style={{ 
                                fontFamily: "'Courier New', Courier, monospace", 
                                fontSize: '9.5pt', 
                                color: 'black', 
                                whiteSpace: 'pre',
                                lineHeight: '1.2',
                                letterSpacing: '-0.2px'
                            }}>
                                {page.fichaText}
                            </pre>
                            
                            <div style={{ marginTop: '40px', position: 'relative', borderTop: '1px dashed #ccc', paddingTop: '40px' }}>
                                <img src={logoUrl} style={{ width: '80px', position: 'absolute', left: '0', top: '40px' }} />
                                <pre style={{ 
                                    fontFamily: "'Courier New', Courier, monospace", 
                                    fontSize: '9.5pt', 
                                    color: 'black', 
                                    whiteSpace: 'pre',
                                    lineHeight: '1.2',
                                    letterSpacing: '-0.2px'
                                }}>
                                    {page.reciboText}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FichaDoacaoTonerModal;
