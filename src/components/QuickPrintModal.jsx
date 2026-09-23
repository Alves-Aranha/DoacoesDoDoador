import React, { useState, useEffect } from 'react';
import { Printer, X, Search, Zap, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import FichaDoacaoTonerModal from './FichaDoacaoTonerModal';
import FichaDoacoesNovaModal from './FichaDoacoesNovaModal';


const QuickPrintModal = ({ onClose, userLoggerName, initialDonorCode = '', initialDonationCode = '' }) => {
    const [donorCode, setDonorCode] = useState(initialDonorCode);
    const [donationCode, setDonationCode] = useState(initialDonationCode);
    const [loading, setLoading] = useState(false);
    const [foundDonation, setFoundDonation] = useState(null);
    const [showMatricial, setShowMatricial] = useState(false);
    const [showNormal, setShowNormal] = useState(false);


    // Busca automática quando os códigos mudam
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (donorCode || donationCode) {
                handleSearch();
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [donorCode, donationCode]);

    const handleSearch = async () => {
        if (!donorCode && !donationCode) {
            setFoundDonation(null);
            return;
        }

        setLoading(true);
        try {
            let query = supabase.from('doacoes').select('*, doadores(*)');

            if (donationCode) {
                const raw = String(donationCode).replace(/\D/g, '');
                const numeric = parseInt(raw, 10);
                if (isNaN(numeric)) throw new Error('Código da doação inválido');
                query = query.eq('codigo_doacao', numeric);
            } else if (donorCode) {
                const raw = String(donorCode).replace(/\D/g, '');
                const numeric = parseInt(raw, 10);
                if (isNaN(numeric)) throw new Error('Código do doador inválido');
                query = query.eq('codigo_doador', numeric).order('created_at', { ascending: false }).limit(1);
            }

            const { data, error } = await query.maybeSingle();
            if (error) throw error;

            if (data) {
                const { data: itemData } = await supabase.from('itens_doacao').select('*').eq('id_doacao', data.codigo_doacao);
                data.itens_doacao = itemData || [];
                // Normalização para os modais existentes
                const normalized = {
                    ...data,
                    codigo: data.codigo_doacao,
                    codigoDoador: data.codigo_doador,
                    nomeDoador: data.doadores?.nome || data.doador_nome,
                    dataDoacao: data.data_doacao,
                    dataRetirada: data.data_retirada,
                    itens: data.itens_doacao || []
                };
                setFoundDonation(normalized);
            } else {
                setFoundDonation(null);
            }
        } catch (err) {
            console.error('Erro na busca rápida:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{zIndex: 2500}}>
            <style dangerouslySetInnerHTML={{ __html: `
                .qp-box {
                    background: var(--card-bg);
                    width: 90%;
                    max-width: 700px;
                    border-radius: 20px;
                    padding: 35px;
                    box-shadow: var(--shadow-xl);
                    border: 1px solid var(--border-color);
                    position: relative;
                }
                @media print {
                    .qp-box { display: none !important; }
                }
                .qp-header { text-align: center; margin-bottom: 30px; }
                #qp-title-main { font-size: 1.5rem !important; font-weight: 900; color: var(--primary-color); margin: 0; white-space: normal; }
                .qp-header p { opacity: 0.6; margin: 5px 0 0 0; }
                
                .qp-inputs { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
                    gap: 20px; 
                    background: var(--bg-color); 
                    padding: 20px; 
                    border-radius: 12px;
                    margin-bottom: 25px;
                }
                
                .qp-result {
                    margin-bottom: 30px;
                    padding: 15px;
                    border: 1px dashed var(--primary-color);
                    border-radius: 10px;
                    background: var(--primary-soft);
                    text-align: center;
                    animation: fadeIn 0.3s ease;
                }

                .qp-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                
                .btn-qp {
                    min-height: 60px;
                    font-size: 0.95rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    white-space: normal;
                    padding: 16px 18px;
                }
            `}} />

            <div className="qp-box">
                <button 
                    onClick={onClose} 
                    style={{position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'}}
                >
                    <X size={24} />
                </button>

                <div className="qp-header">
                    <div style={{display: 'inline-flex', padding: '12px', background: 'var(--primary-soft)', borderRadius: '50%', color: 'var(--primary-color)', marginBottom: '15px'}}>
                        <Zap size={32} fill="currentColor" />
                    </div>
                    <div id="qp-title-main" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-color)', margin: 0, whiteSpace: 'normal', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        Opções de Impressão
                        <span style={{ fontSize: '0.65rem', background: 'var(--primary-color)', color: 'white', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle', fontWeight: 600 }}>v2.0</span>
                    </div>
                    <p>Selecione o método e informe o código</p>
                </div>

                <div className="qp-inputs">
                    <div className="form-group">
                        <label>Doador</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="000000"
                            value={donorCode}
                            onChange={e => {
                                setDonorCode(e.target.value);
                                if (e.target.value) setDonationCode('');
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Doação</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="000000"
                            value={donationCode}
                            onChange={e => {
                                setDonationCode(e.target.value);
                                if (e.target.value) setDonorCode('');
                            }}
                        />
                    </div>
                </div>

                {loading && <div style={{textAlign: 'center', marginBottom: '20px', color: 'var(--primary-color)'}}>Buscando...</div>}

                {foundDonation ? (
                    <div className="qp-result">
                        <div style={{fontWeight: 800, fontSize: '1.1rem'}}>{foundDonation.nomeDoador}</div>
                        <div style={{fontSize: '0.85rem', opacity: 0.7}}>
                            Doação: {foundDonation.codigo} | Status: {foundDonation.status} | Data: {foundDonation.dataDoacao?.split('-').reverse().join('/')}
                        </div>
                    </div>
                ) : (
                    (donorCode || donationCode) && !loading && (
                        <div style={{textAlign: 'center', marginBottom: '20px', color: 'var(--danger-color)', fontSize: '0.85rem'}}>
                            Nenhuma doação encontrada.
                        </div>
                    )
                )}

                <div className="qp-actions">
                    <button 
                        className="btn-action btn-primary btn-qp" 
                        disabled={!foundDonation}
                        onClick={() => setShowMatricial(true)}
                        style={{ backgroundColor: '#92400e' }}
                    >
                        <FileText size={20} /> IMPRIMIR MATRICIAL
                    </button>
                    <button 
                        className="btn-action btn-primary btn-qp" 
                        disabled={!foundDonation}
                        onClick={() => setShowNormal(true)}
                        style={{ backgroundColor: '#1e40af' }}
                    >
                        <Printer size={20} /> IMPRIMIR NORMAL
                    </button>
                </div>
            </div>

            {/* Modais de Impressão Reutilizados */}
            {showMatricial && (
                <div style={{zIndex: 2600, position: 'relative'}}>
                    <FichaDoacoesNovaModal 
                        donation={foundDonation} 
                        userLoggerName={userLoggerName} 
                        onClose={() => setShowMatricial(false)} 
                    />
                </div>
            )}
            {showNormal && (
                <div style={{zIndex: 2600, position: 'relative'}}>
                    <FichaDoacaoTonerModal 
                        donation={foundDonation} 
                        onClose={() => setShowNormal(false)} 
                    />
                </div>
            )}

        </div>
    );
};

export default QuickPrintModal;
