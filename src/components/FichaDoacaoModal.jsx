import React, { useMemo } from 'react';
import { X, Printer } from 'lucide-react';

const FichaDoacaoModal = ({ donation, onClose }) => {
    // ID Único para evitar duplicidade de impressão (Trava de Segurança)
    const printId = useMemo(() => `print-normal-${Math.random().toString(36).substr(2, 9)}`, []);

    if (!donation) return null;

    const handlePrint = () => {
        // Técnica de Iframe Isolado para Consistência Total
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printContent = document.querySelector(`.${printId} .ficha-print-content`).innerHTML;
        const styles = document.querySelector(`.${printId} style`).innerHTML;

        const doc = iframe.contentWindow.document;
        doc.write(`
            <html>
                <head>
                    <title>Impressão - Ficha de Doação</title>
                    <style>
                        ${styles}
                        @media print {
                            @page { size: A4 portrait; margin: 10mm; }
                            body { margin: 0; padding: 0; background: white; width: 100%; height: auto; }
                            .ficha-print-content { width: 100% !important; display: block !important; padding: 0 !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="ficha-print-content">${printContent}</div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        doc.close();

        // Limpa o iframe após a impressão
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    };

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
        if (numeric.length === 11) {
            return `(${numeric.substring(0, 2)}) ${numeric.substring(2, 7)}-${numeric.substring(7)}`;
        }
        if (numeric.length === 10) {
            return `(${numeric.substring(0, 2)}) ${numeric.substring(2, 6)}-${numeric.substring(6)}`;
        }
        return phone;
    };

    const donorInfo = donation.doadores || {};
    const donorName = donation.nomeDoador || donation.doador_nome || '';
    const donorCode = donation.codigoDoador || donation.id_doador || '';
    const donationCode = donation.codigo || donation.codigo_doacao || '';
    const donationDate = donation.dataDoacao || donation.data_doacao || '';
    const dateRetirada = donation.dataRetirada || donation.data_retirada || '';
    const dateRemarcado = donation.remarcado_para || '';
    const logoUrl = `/logo-instituicao01.png?t=${new Date().getTime()}`;

    return (
        <div id={printId} className={`modal-overlay ${printId}`}>
            <style dangerouslySetInnerHTML={{ __html: `
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
                    padding: 0 40px 40px 40px;
                    background: white !important;
                }
                
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    html, body { background: white !important; margin: 0 !important; }
                    .ficha-print-content { width: 100% !important; background: white !important; }
                    .ficha-print-content table { width: 100%; border-collapse: collapse; font-size: 11pt !important; }
                    .ficha-print-content th, .ficha-print-content td { font-size: 11pt !important; padding: 6px 4px; }
                }
            `}} />
            
            <div className="ficha-modal-box print-target">
                <div className="modal-header-actions no-print">
                    <button type="button" className="btn-action btn-secondary" style={{padding: '12px 25px'}} onClick={onClose}>FECHAR JANELA</button>
                    <button type="button" className="btn-action btn-primary" style={{padding: '12px 25px', background: '#1d4ed8'}} onClick={handlePrint}>MANDAR PARA IMPRESSORA</button>
                </div>

                <div className="ficha-scroll-area">
                    <div className="ficha-print-content" style={{fontFamily: "'Courier New', Courier, monospace"}}>
                        
                        <div style={{display: 'flex', alignItems: 'center', borderBottom: 'none', paddingBottom: '0', marginBottom: '10px'}}>
                            <img src={logoUrl} alt="" style={{width: '90px', height: 'auto', marginRight: '20px'}} />
                            <div style={{textAlign: 'center', flex: 1}}>
                                <h2 style={{fontSize: '1.2rem', margin: '0', fontWeight: 900}}>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                                <p style={{fontSize: '0.8rem', margin: '3px 0 0 0'}}>CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800</p>
                                <p style={{fontSize: '0.8rem', margin: '0'}}>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                                <p style={{fontSize: '0.8rem', margin: '0'}}>doacoes@abrigobezerrademenezes.org.br</p>
                            </div>
                        </div>

                        <h3 style={{textAlign: 'center', textTransform: 'uppercase', margin: '10px 0', fontSize: '1.5rem', textDecoration: 'underline'}}>FICHA DE DOAÇÃO</h3>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem'}}>Identificação</h4>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Cód. Doação:</strong> <span>{donationCode}</span></div>
                                <div><strong>Cód. Doador:</strong> <span>{donorCode}</span></div>
                                <div><strong>Data Doação:</strong> <span>{formatDate(donationDate)}</span></div>
                            </div>
                            <div style={{ padding: '5px 0'}}>
                                <strong>Doador:</strong> <span>{donorName}</span>
                            </div>
                            <div style={{ padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Retirar em:</strong> <span>{formatDate(dateRetirada)}</span></div>
                                <div><strong>Remarcado:</strong> <span>{formatDate(dateRemarcado)}</span></div>
                            </div>
                        </div>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem'}}>Endereço de Retirada</h4>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '24px' }}>
                            <div style={{ padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>CEP:</strong> <span>{formatCEP(donorInfo.cep)}</span></div>
                                <div><strong>Endereço:</strong> <span>{donorInfo.logradouro} {donorInfo.endereco}</span></div>
                            </div>
                            <div style={{ padding: '5px 0', display: 'flex', gap: '20px'}}>
                                <div><strong>Bairro:</strong> <span>{donorInfo.bairro}</span></div>
                                <div><strong>Cidade:</strong> <span>{donorInfo.cidade} - {donorInfo.estado}</span></div>
                            </div>
                        </div>

                        <h4 style={{padding: '5px 10px', margin: '20px 0 10px 0', fontSize: '1rem'}}>Itens da Doação</h4>
                        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
                            <thead>
                                <tr>
                                    <th style={{textAlign: 'center', padding: '8px', width: '100px', fontSize: '11pt'}}>DOAÇÃO</th>
                                    <th style={{textAlign: 'left', padding: '8px', width: '120px', fontSize: '11pt'}}>UNIDADE</th>
                                    <th style={{textAlign: 'left', padding: '8px', fontSize: '11pt'}}>DESCRIÇÃO</th>
                                    <th style={{textAlign: 'center', padding: '8px', width: '80px', fontSize: '11pt'}}>QTDE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donation.itens?.map((it, idx) => (
                                    <tr key={idx}>
                                        <td style={{padding: '8px', textAlign: 'center', fontSize: '11pt'}}>{donationCode}</td>
                                        <td style={{padding: '8px', fontSize: '11pt'}}>{it.unidade || 'UN'}</td>
                                        <td style={{padding: '8px', fontSize: '11pt'}}>{it.item}</td>
                                        <td style={{padding: '8px', textAlign: 'center', fontSize: '11pt'}}>{it.qtde}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{marginTop: '40px', paddingTop: '10px'}}>
                                <p><strong>Observações:</strong> {donation.observacoes || 'Sem observações'}</p>
                        </div>

                        <div style={{marginTop: '60px', display: 'flex', justifyContent: 'space-between'}}>
                            <div style={{width: '250px', borderTop: '1px solid black', textAlign: 'center', paddingTop: '5px'}}>Assinatura Doador</div>
                            <div style={{width: '250px', borderTop: '1px solid black', textAlign: 'center', paddingTop: '5px'}}>Responsável Coleta</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FichaDoacaoModal;
