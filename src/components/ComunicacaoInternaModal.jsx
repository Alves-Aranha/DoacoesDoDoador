import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, Search, FileText, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toDatePart } from '../utils/date';
import { getLogoUrl } from '../utils/logo';

const ComunicacaoInternaModal = ({ donation, onClose }) => {
    const logoUrl = useMemo(() => getLogoUrl('logo-instituicao01.png'), []);
    const { user, perfil } = useAuth();
    const [donorCode, setDonorCode] = useState('');
    const [donationCode, setDonationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [foundData, setFoundData] = useState(donation || null);
    const [formaEnvio, setFormaEnvio] = useState('Email');

    // Inicializa campos de busca se receber uma doação
    useEffect(() => {
        if (donation) {
            setDonationCode(donation.codigo || '');
        }
    }, [donation]);

    const todayStr = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);
    const responsavelLogado = perfil?.nome || user?.email?.split('@')[0] || 'Sistema';

    // Busca automática quando os códigos mudam
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (donorCode || donationCode) {
                handleSearch();
            }
        }, 600);
        return () => clearTimeout(delayDebounceFn);
    }, [donorCode, donationCode]);

    const handleSearch = async () => {
        if (!donorCode && !donationCode) {
            setFoundData(null);
            return;
        }

        setLoading(true);
        try {
            let query = supabase.from('doacoes').select('*, doadores(*)');

            if (donationCode) {
                const paddedDon = donationCode.padStart(6, '0');
                query = query.eq('codigo_doacao', paddedDon);
            } else if (donorCode) {
                const paddedDonor = donorCode.padStart(6, '0');
                query = query.eq('codigo_doador', paddedDonor).order('data_doacao', { ascending: false }).limit(1);
            }

            const { data, error } = await query.maybeSingle();
            if (error) throw error;

            if (data) {
                const { data: itemData } = await supabase.from('itens_doacao').select('*').eq('id_doacao', data.codigo_doacao);
                data.itens_doacao = itemData || [];
                setFoundData(data);
            } else {
                setFoundData(null);
            }
        } catch (err) {
            console.error('Erro na busca de comunicação interna:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const donor = foundData?.doadores || {};
    const items = foundData?.itens_doacao || [];

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .ci-modal-box {
                    background: white;
                    width: 95%;
                    max-width: 850px;
                    max-height: 95vh;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: var(--shadow-2xl);
                    color: black !important;
                }
                .ci-header-actions {
                    background: #f8fafc;
                    padding: 15px 25px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .ci-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 40px;
                    background: white;
                }
                
                /* Estilo de Impressão */
                @media print {
                    .modal-overlay { background: white !important; position: absolute !important; }
                    .ci-header-actions, .ci-search-bar { display: none !important; }
                    .ci-content { padding: 15mm 0 0 0 !important; overflow: visible !important; }
                    body { background: white !important; }
                }

                .print-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 30px;
                    position: relative;
                }
                .print-logo {
                    width: 90px;
                    position: absolute;
                    left: 0;
                }
                .inst-info-center {
                    text-align: center;
                    font-size: 8.5pt;
                    line-height: 1.3;
                }
                .inst-info-center h2 {
                    margin: 0;
                    font-size: 11pt;
                    font-weight: 900;
                }
                .main-title {
                    text-align: center;
                    font-size: 14pt;
                    font-weight: bold;
                    margin: 25px 0;
                    text-decoration: underline;
                }
                .ci-info-section {
                    margin-bottom: 20px;
                    font-size: 11pt;
                    line-height: 1.6;
                }
                .ci-info-section p {
                    margin: 4px 0;
                }
                .ci-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .ci-table th {
                    text-align: left;
                    padding: 8px;
                    font-size: 10pt;
                }
                .ci-table td {
                    padding: 8px;
                    font-size: 10pt;
                }
                .footer-ci {
                    margin-top: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .signature-box {
                    margin-top: 60px;
                    border-top: 1px solid black;
                    width: 300px;
                    text-align: center;
                    padding-top: 5px;
                }
                .ci-search-bar {
                    background: #f1f5f9;
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 25px;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    align-items: flex-end;
                }
                .ci-result {
                    margin-bottom: 25px;
                    padding: 15px;
                    border: 1px dashed #10b981;
                    border-radius: 10px;
                    background: #ecfdf5;
                    text-align: center;
                }
            ` }} />

            <div className="ci-modal-box">
                <div className="ci-header-actions no-print">
                    <button type="button" className="btn-action btn-secondary" onClick={onClose}><X size={18} /> FECHAR</button>
                    <button type="button" className="btn-action btn-primary" onClick={handlePrint} disabled={!foundData}>
                        <Printer size={18} /> IMPRIMIR
                    </button>
                </div>

                <div className="ci-content">
                    {/* Barra de Busca (Oculta na Impressão) */}
                    <div className="ci-search-bar no-print">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Código da Doação</label>
                            <input 
                                className="input-field" 
                                placeholder="000000" 
                                value={donationCode} 
                                onChange={e => setDonationCode(e.target.value)} 
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Forma de Envio</label>
                            <select className="input-field" value={formaEnvio} onChange={e => setFormaEnvio(e.target.value)}>
                                <option value="Correios">Correios</option>
                                <option value="Email">Email</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Em mãos">Em mãos</option>
                            </select>
                        </div>
                    </div>

                    {loading && <div style={{ textAlign: 'center', padding: '10px', color: '#10b981' }}>Buscando...</div>}

                    {foundData && (
                        <div className="ci-result no-print">
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                {foundData.doadores?.codigo_doador} - {foundData.doadores?.nome}
                            </div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                Doador encontrado para a doação selecionada
                            </div>
                        </div>
                    )}

                    {/* Conteúdo da Comunicação Interna */}
                    <div id="print-area">
                        <style>
                            {`
                                @media print {
                                    #print-area { padding-top: 40px !important; }
                                    .ci-info-section { margin-bottom: 25px !important; }
                                }
                                .print-header { display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
                                .print-logo { width: 80px; height: auto; margin-right: 15px; }
                                .inst-info-center { flex: 1; text-align: center; margin-left: 20px; }
                                .inst-info-center h2 { font-size: 1rem; margin: 0; font-weight: 900; line-height: 1.2; }
                                .inst-info-center p { font-size: 0.8rem; margin: 2px 0; }
                                .main-title { text-align: center; font-size: 1.3rem; font-weight: 900; margin: 20px 0; text-decoration: underline; text-transform: uppercase; }
                                .ci-info-section { font-size: 1rem; line-height: 1.5; border-bottom: 1px solid #eee; padding-bottom: 10px; }
                                .ci-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                .ci-table th { border: none; border-bottom: 2px solid #000; background: #f8fafc; padding: 8px; text-align: left; }
                                .ci-table td { border: none; border-bottom: 1px solid #eee; padding: 8px; }
                                .footer-ci { margin-top: 50px; display: flex; justify-content: flex-end; }
                                .signature-box { border-top: 1px solid #000; width: 300px; text-align: center; padding-top: 5px; }
                                .page-break { page-break-before: always; break-before: page; }
                            `}
                        </style>

                        {(() => {
                            const MAX_PER_PAGE = 13;
                            const totalPages = Math.max(1, Math.ceil(items.length / MAX_PER_PAGE));
                            const pages = [];
                            for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
                                const pageItems = items.slice(pageIdx * MAX_PER_PAGE, (pageIdx + 1) * MAX_PER_PAGE);
                                const isFirst = pageIdx === 0;
                                const isLast = pageIdx === totalPages - 1;

                                pages.push(
                                    <div key={pageIdx} className={pageIdx > 0 ? 'page-break' : ''}>
                                        <div className="print-header">
                                            <img src={logoUrl} className="print-logo" alt="Logo" />
                                            <div className="inst-info-center">
                                                <h2>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                                                <p>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                                                <p>Cep 03610-030 - Telefone (11) 2164-1800 - C.N.P.J. 60.478.245/0001-50</p>
                                                <p>E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br</p>
                                            </div>
                                        </div>

                                        <div className="main-title">Comunicação Interna - Diretoria</div>

                                        {isFirst && (
                                            <>
                                                <div className="ci-info-section">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <p><strong>De:</strong> Departamento de Doações - {(foundData?.responsavel || responsavelLogado || '').split('@')[0].replace(/[()]/g, '').trim()}</p>
                                                            <p><strong>Para:</strong> Diretoria - Cidinha</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p><strong>Data:</strong> {todayStr}</p>
                                                        </div>
                                                    </div>
                                                    <p style={{ marginTop: '10px' }}><strong>Assunto:</strong> Solicitação de Carta de Agradecimento</p>
                                                </div>

                                                <div className="ci-info-section" style={{ marginTop: '20px' }}>
                                                    <p><strong>Doador:</strong> {donor.nome || '---'}</p>
                                                    <p><strong>Email:</strong> {donor.email || '---'}</p>
                                                    <p><strong>Endereço:</strong> {donor.logradouro ? donor.logradouro + ' ' : ''}{donor.endereco || '---'} {donor.numero ? ', ' + donor.numero : ''} {donor.complemento ? ' - ' + donor.complemento : ''}</p>
                                                    <p><strong>Bairro:</strong> {donor.bairro || '---'} | <strong>Cidade:</strong> {donor.cidade || '---'}</p>
                                                </div>

                                                <p style={{ marginTop: '10px', fontWeight: 'bold' }}>Doador No. {String(donor.codigo_doador || '').padStart(6, '0')}</p>
                                                <p style={{ fontWeight: 'bold' }}>Doação No. {String(foundData?.codigo_doacao || '').padStart(6, '0')}</p>
                                            </>
                                        )}

                                        {!isFirst && (
                                            <p style={{ marginTop: '10px', fontWeight: 'bold', fontStyle: 'italic' }}>
                                                Continuação - Doação No. {String(foundData?.codigo_doacao || '').padStart(6, '0')}
                                            </p>
                                        )}

                                        <table className="ci-table">
                                            <thead>
                                                <tr>
                                                    <th>Qtde</th>
                                                    <th>Unid</th>
                                                    <th>Descrição</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pageItems.length > 0 ? pageItems.map((it, idx) => (
                                                    <tr key={idx}>
                                                        <td>{it.qtde}</td>
                                                        <td>{it.unidade || 'UN'}</td>
                                                        <td>{it.item}</td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>Nenhum item encontrado</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>

                                        {isLast && (
                                            <>
                                                <div className="ci-info-section" style={{ border: 'none', marginBottom: '50px' }}>
                                                    <p style={{ marginBottom: '20px' }}><strong>Forma de envio:</strong> {formaEnvio}</p>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                        <p style={{ margin: 0 }}><strong>Data de Retirada:</strong> {foundData?.data_retirada ? toDatePart(foundData.data_retirada).split('-').reverse().join('/') : '---'}</p>
                                                        <div style={{ textAlign: 'left', width: '250px' }}>
                                                            <p style={{ margin: 0 }}><strong>Responsável:</strong></p>
                                                            <p style={{ margin: 0 }}>{(foundData?.responsavel || responsavelLogado || '').split('@')[0].replace(/[()]/g, '').trim()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <p style={{ margin: 0 }}><strong>Data da solicitação:</strong> {todayStr}</p>
                                                </div>

                                                <div className="footer-ci" style={{ display: 'flex', justifyContent: 'center', marginTop: '80px' }}>
                                                    <div className="signature-box" style={{ width: '400px', borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
                                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>Recebido por:</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            }
                            return pages;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComunicacaoInternaModal;
