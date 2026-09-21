import React, { useMemo } from 'react';
import { Printer, X } from 'lucide-react';

const RelAvaliacaoToner = ({ data, onClose }) => {
    const printId = useMemo(() => `print-avaliacao-${Math.random().toString(36).substr(2, 9)}`, []);

    if (!data) return null;

    const todayStr = new Date().toLocaleDateString('pt-BR');
    const logoSrc = `${window.location.origin}/logo-instituicao.png`;

    const linhasVisuais = [...(data.itens || [])];
    while (linhasVisuais.length < 8) {
        linhasVisuais.push('');
    }

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:none;';
        document.body.appendChild(iframe);
        const doc = iframe.contentWindow.document;

        const itemsHtml = linhasVisuais.map(it => `
            <div class="item-line-print">${it ? it.toUpperCase() : ''}</div>
        `).join('');

        doc.write(`
            <html>
                <head>
                    <title>Avaliação - ${(data.nome || '').substring(0, 20)}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        body { padding: 2mm 12mm; font-family: Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; }
                        .header-container { display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 4px; }
                        .logo-box { width: 70px; height: 70px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-right: 10px; }
                        .logo-img { max-width: 100%; max-height: 100%; object-fit: contain; }
                        .institution-details { flex: 1; text-align: center; }
                        .inst-title { font-size: 10pt; font-weight: bold; margin-bottom: 2px; }
                        .inst-sub { font-size: 8pt; line-height: 1.2; }
                        .doc-title { text-align: center; font-size: 11pt; font-weight: bold; margin: 4px 0; text-transform: uppercase; letter-spacing: 1px; }
                        .data-row { display: flex; margin-bottom: 6px; line-height: 1.3; font-size: 10pt; }
                        .data-field { border-bottom: 1px solid #000; padding-bottom: 1px; }
                        .items-section-title { font-weight: bold; margin: 6px 0 3px 0; font-size: 10pt; }
                        .item-line-print { width: 100%; height: 22px; border-bottom: 1px solid #000; display: flex; align-items: center; padding-left: 4px; font-family: 'Courier New', monospace; font-size: 10pt; font-weight: bold; }
                        .obs-field { margin-top: 6px; line-height: 1.3; border-bottom: 1px solid #000; padding-bottom: 2px; font-size: 10pt; }
                        .date-row { margin-top: 4px; font-size: 10pt; }
                        .signature-block { margin-top: 35px; display: flex; flex-direction: column; width: 60%; border-top: 1px solid #000; padding-top: 4px; font-size: 10pt; }
                        .evaluator-box { margin-top: 30px; border-top: 1px dashed #000; padding-top: 5px; }
                        .eval-title { font-weight: bold; margin-bottom: 4px; font-size: 10pt; }
                        .eval-line { width: 100%; height: 22px; border-bottom: 1px solid #000; }
                        @media print {
                            @page { size: A4; margin: 0; }
                            body { padding: 2mm 12mm; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header-container">
                        <div class="logo-box">
                            <img class="logo-img" src="${logoSrc}" alt="Logo" onerror="this.style.display='none';">
                        </div>
                        <div class="institution-details">
                            <div class="inst-title">ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</div>
                            <div class="inst-sub">CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800<br/>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</div>
                        </div>
                    </div>
                    <div class="doc-title">Avaliação</div>
                    <div class="data-row">
                        <div style="width: 70%;"><strong>Nome:</strong> <span class="data-field" style="display:inline-block; width:88%;">${(data.nome || '').toUpperCase()}</span></div>
                        <div style="width: 30%;"><strong>Telefone:</strong> <span class="data-field" style="display:inline-block; width:70%;">${data.telefone || ''}</span></div>
                    </div>
                    <div class="data-row">
                        <div style="width: 100%;"><strong>Endereço:</strong> <span class="data-field" style="display:inline-block; width:89%;">${(data.endereco || '').toUpperCase()}</span></div>
                    </div>
                    <div class="data-row">
                        <div style="width: 70%;"><strong>Bairro:</strong> <span class="data-field" style="display:inline-block; width:86%;">${(data.bairro || '').toUpperCase()}</span></div>
                        <div style="width: 30%;"><strong>Mapa:</strong> <span class="data-field" style="display:inline-block; width:78%;">${(data.mapa || '').toUpperCase()}</span></div>
                    </div>
                    <div class="items-section-title">As mercadorias abaixo descriminadas:</div>
                    <div style="margin-bottom: 6px;">${itemsHtml}</div>
                    <div class="obs-field"><strong>Observações:</strong> ${(data.observacoes || '').toUpperCase()}</div>
                    <div class="date-row"><strong>Data:</strong> ${todayStr}</div>
                    <div class="signature-block"><span>Assinatura do responsável:</span></div>
                    <div class="evaluator-box">
                        <div class="date-row" style="margin-top:0; margin-bottom: 4px;"><strong>Data Avaliação:</strong> ______/________/_________.</div>
                        <div style="margin-top: 35px; border-top: 1px solid #000; width: 60%; padding-top: 3px; font-size: 10pt;">Avaliado por</div>
                        <div class="eval-title" style="margin-top: 6px;">Obs. do avaliador:</div>
                        <div class="item-line-print" style="height: 22px;">${(data.obsAvaliador || '').toUpperCase()}</div>
                        <div class="eval-line"></div>
                        <div class="eval-line"></div>
                    </div>
                    <script>
                        window.onload = () => { window.print(); };
                        window.onafterprint = () => { window.close(); };
                    <\/script>
                </body>
            </html>
        `);
        doc.close();
        setTimeout(() => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
    };

    return (
        <div id={printId} className={`modal-overlay ${printId}`}>
            <style>{`
                .${printId} .av-modal-box {
                    background: white !important;
                    width: 98%;
                    max-width: 950px;
                    max-height: 97vh;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.55);
                    color: black !important;
                }
                .${printId} .av-header-actions {
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
                .${printId} .av-header-title {
                    font-weight: 700;
                    color: #334155;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .${printId} .av-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px 24px 28px 24px;
                    background: #e8e6f0 !important;
                }
                .${printId} .av-paper {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    background: white;
                    box-shadow: 0 2px 20px rgba(0,0,0,0.15);
                    border-radius: 4px;
                }
                .${printId} .av-paper-inner {
                    padding: 5mm 15mm 15mm 15mm;
                    color: #000;
                    font-family: Arial, sans-serif;
                }
                .${printId} .av-header-flex {
                    display: flex;
                    align-items: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                }
                .${printId} .av-logo-box {
                    width: 80px; height: 80px;
                    margin-right: 15px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .${printId} .av-logo-img {
                    max-width: 100%; max-height: 100%;
                    object-fit: contain;
                }
                .${printId} .av-inst-text {
                    flex: 1; text-align: center;
                }
                .${printId} .av-inst-title {
                    font-weight: bold; font-size: 11pt;
                }
                .${printId} .av-inst-sub {
                    font-size: 9.5pt; margin-top: 3px;
                }
                .${printId} .av-doc-title {
                    text-transform: uppercase; text-align: center;
                    font-weight: bold; font-size: 12pt;
                    margin: 6px 0;
                }
                .${printId} .av-line-item {
                    width: 100%; height: 26px;
                    border-bottom: 1px solid #000;
                    display: flex; align-items: center;
                    padding-left: 5px;
                    font-family: monospace; font-size: 10.5pt;
                }
                .${printId} .av-info-bar {
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    padding: 8px 20px;
                    font-size: 0.78rem;
                    color: #64748b;
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .${printId} .av-info-bar span::before { content: '✓ '; color: #22c55e; }
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; padding: 0; }
                    .${printId} .av-modal-box { width: 100% !important; max-width: none !important; max-height: none !important; overflow: visible !important; box-shadow: none !important; border-radius: 0 !important; }
                    .${printId} .av-scroll-area { padding: 0 !important; overflow: visible !important; background: white !important; }
                    .${printId} .av-header-actions { display: none !important; }
                        .${printId} .av-paper { box-shadow: none !important; }
                        .${printId} .av-paper-inner {
                            padding: 2mm 12mm !important;
                        }
                    .${printId} .av-info-bar { display: none !important; }
                }
            `}</style>

            <div className="av-modal-box">
                <div className="av-header-actions">
                    <div className="av-header-title">
                        <Printer size={18} />
                        Avaliação — Impressora Toner
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Printer size={16} />
                            Imprimir
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="av-scroll-area">
                    <div className="av-paper">
                        <div className="av-paper-inner">
                            <div className="av-header-flex">
                                <div className="av-logo-box">
                                    <img className="av-logo-img" src={logoSrc} alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <div className="av-inst-text">
                                    <div className="av-inst-title">ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</div>
                                    <div className="av-inst-sub">CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800<br/>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</div>
                                </div>
                            </div>

                            <div className="av-doc-title">Avaliação</div>

                            <div style={{ display: 'flex', marginBottom: '6px' }}>
                                <div style={{ width: '70%' }}><strong>Nome:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '85%' }}>{(data.nome || '').toUpperCase()}</span></div>
                                <div style={{ width: '30%' }}><strong>Telefone:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '65%' }}>{data.telefone || ''}</span></div>
                            </div>

                            <div style={{ display: 'flex', marginBottom: '6px' }}>
                                <div style={{ width: '100%' }}><strong>Endereço:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '88%' }}>{(data.endereco || '').toUpperCase()}</span></div>
                            </div>

                            <div style={{ display: 'flex', marginBottom: '20px' }}>
                                <div style={{ width: '70%' }}><strong>Bairro:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '85%' }}>{(data.bairro || '').toUpperCase()}</span></div>
                                <div style={{ width: '30%' }}><strong>Mapa:</strong> <span style={{ borderBottom: '1px solid #000', display: 'inline-block', width: '75%' }}>{(data.mapa || '').toUpperCase()}</span></div>
                            </div>

                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>As mercadorias abaixo descriminadas:</div>
                            <div>
                                {linhasVisuais.map((it, idx) => (
                                    <div key={idx} className="av-line-item">
                                        {it.toUpperCase()}
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '12px', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                                <strong>Observações:</strong> {(data.observacoes || '').toUpperCase()}
                            </div>

                            <div style={{ marginTop: '8px' }}>
                                <strong>Data:</strong> {todayStr}
                            </div>

                            <div style={{ marginTop: '45px', borderTop: '1px solid #000', width: '50%', paddingTop: '5px', fontSize: '10pt' }}>
                                Assinatura do responsável:
                            </div>

                            <div style={{ marginTop: '40px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
                                <div><strong>Data Avaliação:</strong> ______/________/_________.</div>
                                <div style={{ marginTop: '40px', borderTop: '1px solid #000', width: '60%', paddingTop: '5px', fontSize: '10pt' }}>Avaliado por</div>
                                <div style={{ fontWeight: 'bold', marginTop: '15px' }}>Obs. do avaliador:</div>
                                <div style={{ borderBottom: '1px solid #000', minHeight: '22px', marginTop: '5px', fontFamily: 'monospace' }}>{(data.obsAvaliador || '').toUpperCase()}</div>
                                <div style={{ borderBottom: '1px solid #000', height: '22px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="av-info-bar">
                    <span>Configurado para Impressora Toner A4</span>
                    <span>Preview = Impressão</span>
                </div>
            </div>
        </div>
    );
};

export default RelAvaliacaoToner;
