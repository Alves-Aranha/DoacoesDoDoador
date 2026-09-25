import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, Search, FileText, Send } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toDatePart } from '../utils/date';
import { getLogoUrl } from '../utils/logo';

const ComunicacaoInternaTransportesModal = ({ donation, onClose }) => {
    const logoUrl = useMemo(() => getLogoUrl('logo-instituicao01.png'), []);
    const { user, perfil } = useAuth();
    const [donorCode, setDonorCode] = useState('');
    const [donationCode, setDonationCode] = useState('');
    const [loading, setLoading] = useState(false);
    // Inicializa foundData já enriquecido para evitar relatório vazio quando vem do Status Individual
    const [foundData, setFoundData] = useState(() => donation ? { ...donation, _fromStatusIndividual: true } : null);
    const [formaEnvio, setFormaEnvio] = useState('Email');

    const todayStr = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);
    const responsavelLogado = perfil?.nome || user?.email?.split('@')[0] || 'Sistema';
    // Responsável digitado no Status Individual tem prioridade (deve ser preservado mesmo após fetch)
    const initialDonationResponsavel = (donation?.responsavel || '').trim();

    // Inicializa campos de busca se receber uma doação
    useEffect(() => {
        if (donation) {
            setDonationCode(donation.codigo || donation.codigo_doacao || '');
            // Garante que foundData reflita a doação atual do Status Individual (evita ficar vazio)
            setFoundData({ ...donation, _fromStatusIndividual: true });
        }
    }, [donation]);

    // Busca automática quando os códigos mudam - desabilitada quando veio do Status Individual para não apagar dados
    useEffect(() => {
        // Se veio do Status Individual, não faz busca automática que apagaria o relatório
        if (donation) return;
        const delayDebounceFn = setTimeout(() => {
            if (donorCode || donationCode) {
                handleSearch();
            }
        }, 600);
        return () => clearTimeout(delayDebounceFn);
    }, [donorCode, donationCode, donation]);

    const handleSearch = async () => {
        if (!donorCode && !donationCode) {
            // Não apaga dados vindos do Status Individual
            if (!donation) setFoundData(null);
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
                // Preserva Responsável digitado no Status Individual (prioridade)
                if (initialDonationResponsavel && initialDonationResponsavel !== '' && data.responsavel !== initialDonationResponsavel) {
                    data.responsavel = initialDonationResponsavel;
                }
                // Preserva campos flat que possam estar faltando no fetch se a busca for manual
                setFoundData(data);
            } else {
                // Se veio do Status Individual, mantém os dados originais em vez de limpar (evita relatório vazio)
                if (!donation) setFoundData(null);
            }
        } catch (err) {
            console.error('Erro na busca de comunicação interna transportes:', err);
            // Em erro, não apaga dados do Status Individual
            if (!donation) setFoundData(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // FIX: Suporte robusto a doação vinda do Status Individual (flat: codigo/codigo_doador/doador_nome) e preservar Responsável digitado
    const donor = (() => {
        let d = foundData?.doadores || {};
        if (Array.isArray(d)) d = d[0] || {};
        const isEmpty = !d || (typeof d === 'object' && Object.keys(d).length === 0);
        // Base sempre inclui fallback flat para caso doadores esteja incompleto (ex: select limitado)
        const base = {
            codigo_doador: foundData?.codigo_doador || foundData?.codigoDoador || d.codigo_doador || '',
            nome: foundData?.doador_nome || foundData?.nomeDoador || d.nome || '',
            logradouro: foundData?.doador_logradouro || d.logradouro || '',
            endereco: foundData?.doador_endereco || d.endereco || '',
            numero: foundData?.doador_numero || d.numero || '',
            bairro: foundData?.doador_bairro || d.bairro || '',
            complemento: foundData?.doador_complemento || d.complemento || '',
            cidade: foundData?.doador_cidade || d.cidade || '',
            estado: foundData?.doador_estado || d.estado || '',
        };
        if (isEmpty) return base;
        // Merge: doadores do banco tem prioridade, mas completa com fallback flat quando falta código/nome
        return {
            ...base,
            ...d,
            codigo_doador: d.codigo_doador || base.codigo_doador,
            nome: d.nome || base.nome,
        };
    })();
    const items = foundData?.itens_doacao || foundData?.itens || [];

    // Códigos robustos (evita "undefined")
    const displayDonorCode = (() => {
        const v = donor?.codigo_doador ?? foundData?.codigo_doador ?? foundData?.codigoDoador ?? '';
        if (!v && v !== 0) return '---';
        const s = String(v).trim();
        if (!s || s === 'undefined') return '---';
        return s.padStart(6, '0');
    })();
    const displayDonationCode = (() => {
        const v = foundData?.codigo_doacao ?? foundData?.codigo ?? '';
        if (!v && v !== 0) return '---';
        const s = String(v).trim();
        if (!s || s === 'undefined') return '---';
        return s.padStart(6, '0');
    })();
    const displayDonorName = donor?.nome || foundData?.doador_nome || foundData?.nomeDoador || '---';
    // Responsável deve vir do campo digitado no Status Individual (preserva valor digitado mesmo antes de gravar)
    const displayResponsavel = (initialDonationResponsavel || foundData?.responsavel || responsavelLogado || '').split('@')[0].replace(/[()]/g, '').trim();

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
                                {displayDonorCode} - {displayDonorName}
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
                                    #print-area { padding-top: 20px !important; }
                                    .ci-info-section { margin-bottom: 20px !important; }
                                }
                                .print-header { display: flex; align-items: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
                                .print-logo { width: 80px; height: auto; margin-right: 15px; }
                                .inst-info-center { flex: 1; text-align: center; margin-left: 20px; }
                                .inst-info-center h2 { font-size: 1rem; margin: 0; font-weight: 900; line-height: 1.2; }
                                .inst-info-center p { font-size: 0.8rem; margin: 2px 0; }
                                .main-title { text-align: center; font-size: 1.3rem; font-weight: bold; margin: 15px 0 25px 0; text-decoration: underline; text-transform: uppercase; }
                                
                                .ci-header-text { margin-bottom: 30px; font-size: 1.1rem; line-height: 1.8; }
                                
                                .ci-assunto { text-align: center; font-size: 1.2rem; font-weight: bold; margin: 20px 0 30px 0; }
                                
                                .ci-form-line { display: flex; margin-bottom: 15px; font-size: 1.1rem; }
                                .ci-form-line strong { margin-right: 8px; font-weight: bold; }
                                
                                .dotted-line { border-bottom: 1px dotted #000; margin: 20px 0; }
                                
                                .footer-ci { margin-top: 40px; text-align: center; font-size: 0.9rem; line-height: 1.4; }
                                
                                .status-box { margin-top: 40px; border: 1px solid #ccc; border-radius: 12px 12px 0 0; padding: 15px 20px; background: #f9fafb; display: flex; align-items: center; gap: 15px; }
                                .status-box-title { font-size: 1.2rem; font-weight: bold; }
                                .status-box-subtitle { font-size: 0.9rem; color: #666; }
                            `}
                        </style>

                        <div className="print-header">
                            <img src={logoUrl} className="print-logo" alt="Logo" />
                            <div className="inst-info-center">
                                <h2>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                                <p>CNPJ: 60.478.245/0001-50 - Fone: (11) 2164-1800</p>
                                <p>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                            </div>
                        </div>

                        <div className="main-title">COMUNICAÇÃO INTERNA</div>

                        <div className="ci-header-text">
                            <div><strong>De...:</strong> Departamento de Doações</div>
                            <div><strong>Para:</strong> Departamento de Transportes</div>
                        </div>

                        <div className="dotted-line"></div>

                        <div className="ci-assunto">ASSUNTO: Cancelamento e remarcações de Doações</div>

                        <div className="ci-form-line" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div><strong>Código Doador:</strong> {displayDonorCode}</div>
                            <div><strong>Código Doação:</strong> {displayDonationCode}</div>
                        </div>

                        <div className="ci-form-line">
                            Nome do Doador: {displayDonorName}
                        </div>

                        <div className="ci-form-line">
                            <strong>Endereço:</strong> {donor.logradouro ? donor.logradouro + ' ' : ''}{donor.endereco || '---'} {donor.numero ? ', ' + donor.numero : ''}
                        </div>

                        <div className="ci-form-line" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                            <div><strong>Bairro:</strong> {donor.bairro || '---'}</div>
                            <div><strong>Complemento:</strong> {donor.complemento || '---'}</div>
                        </div>

                        <div className="dotted-line"></div>

                        <div className="ci-form-line" style={{ marginTop: '20px' }}>
                            <strong>Status:</strong> {foundData?.status || '---'}
                        </div>

                        <div className="ci-form-line">
                            <strong>Retirar dia:</strong> {foundData?.data_retirada ? toDatePart(foundData.data_retirada).split('-').reverse().join('/') : '---'}
                        </div>

                        <div className="ci-form-line">
                            <strong>Remarcado para:</strong> {foundData?.remarcado_para ? toDatePart(foundData.remarcado_para).split('-').reverse().join('/') : '---'}
                        </div>

                        <div className="ci-form-line">
                            <strong>Motivo:</strong> {foundData?.observacoes || '.........'}
                        </div>

                        <div className="ci-form-line">
                            <strong>Solicitado em:</strong> {todayStr}
                        </div>

                        <div className="ci-form-line" style={{ marginTop: '30px' }}>
                            <strong>Responsável:</strong> {displayResponsavel || '---'}
                        </div>

                        {/* Rodapé de assinatura removido conforme solicitação */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComunicacaoInternaTransportesModal;
