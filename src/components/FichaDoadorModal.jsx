import React from 'react';
import { X, Printer } from 'lucide-react';
import printService from '../services/printService';

const FichaDoadorModal = ({ donor, onClose }) => {
    if (!donor) return null;

    const handlePrint = async () => {
        const estilo = document.querySelector('style[data-ficha-doador]')?.innerHTML || '';
        const conteudo = document.getElementById('ficha-doador-conteudo')?.innerHTML || '';
        
        const html = `
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>Ficha do Doador</title>
                    <style>
                        * { box-sizing: border-box; }
                        body {
                            margin: 15mm 10mm;
                            padding: 0;
                            background: white;
                            font-family: 'Courier New', Courier, monospace;
                            color: black;
                        }
                        ${estilo.replace(/@media print\s*\{[^}]*\}/g, '')}
                        .modal-header-actions, .no-print { display: none !important; }
                        .ficha-modal-box {
                            box-shadow: none !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .ficha-scroll-area {
                            overflow: visible !important;
                            padding: 0 !important;
                        }
                        .ficha-print-content { max-width: 100%; }
                        @media print {
                            @page { margin: 12mm 10mm; }
                            body { margin: 0; padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    ${conteudo}
                </body>
            </html>
        `;
        
        const result = await printService.printHTMLRawToner(html);
        if (!result.success) {
            alert('Erro ao imprimir: ' + result.error);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [datePart] = dateStr.split(/T| /);
        const [year, month, day] = datePart.split('-');
        if (!year || !month || !day) return dateStr;
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="modal-overlay print-doador-only">
            <style data-ficha-doador dangerouslySetInnerHTML={{ __html: `
                .ficha-modal-box {
                    background: white !important;
                    width: 95%;
                    max-width: 900px;
                    max-height: 95vh;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    color: black !important;
                }
                .modal-header-actions {
                    background: #f1f5f9;
                    padding: 15px 30px;
                    border-bottom: 2px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 15px;
                    z-index: 1000;
                    flex-shrink: 0;
                }
                .ficha-scroll-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                    background: white !important;
                }
                .ficha-print-content {
                    width: 100%;
                    max-width: 800px;
                    margin: 0 auto;
                }
                
                @media print {
                    body * { visibility: hidden !important; }
                    .print-doador-only,
                    .print-doador-only * { visibility: visible !important; }
                    .print-doador-only {
                        position: fixed !important;
                        inset: 0 !important;
                        background: white !important;
                        z-index: 99999 !important;
                        display: block !important;
                        overflow: visible !important;
                    }
                    .print-doador-only .ficha-modal-box {
                        box-shadow: none !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        max-height: none !important;
                        overflow: visible !important;
                        border: none !important;
                        border-radius: 0 !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                    }
                    .print-doador-only .ficha-scroll-area {
                        overflow: visible !important;
                        padding: 10px !important;
                    }
                    .no-print, .modal-header-actions { 
                        display: none !important;
                        visibility: hidden !important;
                    }
                }
            `}} />
            
            <div className="ficha-modal-box">
                <div className="modal-header-actions no-print">
                    <button type="button" className="btn-action btn-secondary" style={{padding: '12px 25px'}} onClick={onClose}><X size={18} /> FECHAR JANELA</button>
                    <button type="button" className="btn-action btn-primary" style={{padding: '12px 25px', background: '#1d4ed8'}} onClick={handlePrint}><Printer size={18} /> MANDAR PARA IMPRESSORA</button>
                </div>

                <div className="ficha-scroll-area">
                    <div id="ficha-doador-conteudo" className="ficha-print-content" style={{fontFamily: "'Courier New', Courier, monospace"}}>
                        <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px dotted black', paddingBottom: '10px'}}>
                            <h2 style={{fontSize: '1.2rem', margin: '0'}}>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                            <p style={{fontSize: '0.8rem', margin: '5px 0'}}>RUA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                            <p style={{fontSize: '0.8rem', margin: '2px 0'}}>CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800</p>
                        </div>

                        <h3 style={{textAlign: 'center', textTransform: 'uppercase', margin: '20px 0', fontSize: '1.5rem', textDecoration: 'underline'}}>FICHA DO DOADOR</h3>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem', borderTop: '1px dotted black', borderBottom: '1px dotted black', borderLeft: '3px dotted black'}}>Dados do doador</h4>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Código:</strong> <span>{donor.codigo}</span></div>
                                <div><strong>Nome:</strong> <span>{donor.nome}</span></div>
                                <div><strong>Cadastro:</strong> <span>{formatDate(donor.dataCadastro)}</span></div>
                            </div>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Celular:</strong> <span>{donor.celular}</span></div>
                                <div><strong>Fixo:</strong> <span>{donor.fixo}</span></div>
                                <div><strong>WhatsApp:</strong> <span>{donor.whatsapp}</span></div>
                            </div>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0'}}>
                                <strong>Email:</strong> <span>{donor.email}</span>
                            </div>
                        </div>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem', borderTop: '1px dotted black', borderBottom: '1px dotted black', borderLeft: '3px dotted black'}}>Endereço e Localização</h4>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>CEP:</strong> <span>{donor.cep}</span></div>
                                <div><strong>Endereço:</strong> <span>{donor.logradouro} {donor.endereco}</span></div>
                            </div>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Bairro:</strong> <span>{donor.bairro}</span></div>
                                <div><strong>Complemento:</strong> <span>{donor.complemento}</span></div>
                            </div>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Cidade:</strong> <span>{donor.cidade}</span></div>
                                <div><strong>Estado:</strong> <span>{donor.estado}</span></div>
                                <div><strong>Região:</strong> <span>{donor.regiao}</span></div>
                            </div>
                        </div>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem', borderTop: '1px dotted black', borderBottom: '1px dotted black', borderLeft: '3px dotted black'}}>Informações Administrativas</h4>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ borderBottom: '1px dotted #000', padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Tipo de Doador:</strong> <span>{donor.tipo}</span></div>
                                <div><strong>Cód. Telemarketing:</strong> <span>{donor.cod_tlmk}</span></div>
                                <div><strong>Cód. Mat. Cobrança:</strong> <span>{donor.cod_matcob}</span></div>
                                <div><strong>Mapa:</strong> <span>{donor.mapa}</span></div>
                            </div>
                        </div>

                        <div style={{marginTop: '50px', borderTop: '1px dotted black', paddingTop: '10px', fontSize: '0.85rem', textAlign: 'center'}}>
                            Documento gerado em {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FichaDoadorModal;
