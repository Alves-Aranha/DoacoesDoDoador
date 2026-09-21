import React, { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Printer, FileText, Ban, RefreshCcw, Info, CheckCircle, AlertTriangle, X } from 'lucide-react';
import FichaDoacaoMatricialModal from './FichaDoacaoMatricialModal.jsx';
import FichaDoacaoModal from './FichaDoacaoModal.jsx';

const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const RelatorioCanceladas = () => {
    const [searchCode, setSearchCode] = useState('');
    const [searchType, setSearchType] = useState('doacao'); // 'doacao' ou 'doador'
    const [loading, setLoading] = useState(false);
    const [donations, setDonations] = useState([]);
    const [toast, setToast] = useState(null);

    // Modals
    const [showFichaModal, setShowFichaModal] = useState(false);
    const [showFichaNormalModal, setShowFichaNormalModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);

    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    const handleSearch = async () => {
        if (!searchCode) {
            showToast('Digite um código para consultar', 'error');
            return;
        }

        setLoading(true);
        try {
            const paddedCode = String(Number(searchCode.replace(/\D/g, ''))).padStart(6, '0');
            
            let query = supabase
                .from('doacoes')
                .select('*, doadores(*), itens_doacao(*)')
                .in('status', ['Cancelada', 'Remarcada'])
                .order('data_doacao', { ascending: false });

            if (searchType === 'doacao') {
                query = query.eq('codigo_doacao', paddedCode);
            } else {
                query = query.eq('codigo_doador', paddedCode);
            }

            const { data, error } = await query;
            if (error) throw error;
            
            if (data && data.length > 0) {
                setDonations(data);
                showToast(`${data.length} registro(s) encontrado(s).`);
            } else {
                setDonations([]);
                showToast('Nenhum registro Cancelado ou Remarcado encontrado com esse código.', 'error');
            }
            
        } catch (err) {
            console.error('Erro ao buscar doações:', err);
            showToast('Erro ao consultar banco de dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (doacao, type) => {
        const donationForModal = {
            ...doacao,
            codigoDoador: doacao.codigo_doador,
            nomeDoador: doacao.doadores?.nome,
            codigo: doacao.codigo_doacao,
            dataDoacao: doacao.data_doacao,
            dataRetirada: doacao.data_retirada,
            observacoes: doacao.observacoes,
            itens: doacao.itens_doacao || [],
            doadores: doacao.doadores
        };
        
        setSelectedDonation(donationForModal);
        
        if (type === 'matricial') setShowFichaModal(true);
        else setShowFichaNormalModal(true);
    };

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {showFichaModal && selectedDonation && (
                <FichaDoacaoMatricialModal donation={selectedDonation} onClose={() => setShowFichaModal(false)} />
            )}
            
            {showFichaNormalModal && selectedDonation && (
                <FichaDoacaoModal donation={selectedDonation} onClose={() => setShowFichaNormalModal(false)} />
            )}

            <div className="donor-card" style={{ maxWidth: '1200px', margin: '0', width: '100%' }}>
                <div className="donor-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '25px' }}>
                    <div className="icon-box" style={{ background: '#ef4444', color: 'white' }}><Ban size={32} /></div>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem' }}>Relatório Canceladas/Remarcadas</h2>
                        <p style={{ margin: 0, opacity: 0.6 }}>Impressão de fichas para doações arquivadas, devolvidas ou afetadas.</p>
                    </div>
                </div>

                {/* Filtro Principal */}
                <div className="glass-card" style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Pesquisar Por:</label>
                            <select className="input-field" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                                <option value="doacao">Código da Doação</option>
                                <option value="doador">Código do Doador</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Código (Somente Números):</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input 
                                    className="input-field" 
                                    style={{ paddingLeft: '38px', width: '100%' }} 
                                    placeholder="Ex: 1234" 
                                    value={searchCode} 
                                    onChange={e => setSearchCode(e.target.value.replace(/\D/g, ''))} 
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <button className="btn-action btn-primary" style={{ height: '45px', flexShrink: 0 }} onClick={handleSearch} disabled={loading}>
                            <Search size={18} /> {loading ? 'Consultando...' : 'Consultar'}
                        </button>
                        <button className="btn-action btn-secondary" style={{ height: '45px', flexShrink: 0 }} onClick={() => { setSearchCode(''); setDonations([]); }}>
                            <RefreshCcw size={18} /> Limpar
                        </button>
                    </div>
                </div>

                {/* Lista de Resultados */}
                <div className="table-container" style={{ minHeight: '300px' }}>
                    <table className="donation-items-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Cód. Doação</th>
                                <th>Cód. Doador</th>
                                <th>Doador</th>
                                <th>Data Registro</th>
                                <th>Data Canc/Remarc</th>
                                <th>Ações (Gerar Fichas)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Realize uma consulta para listar doações.</td></tr>
                            ) : (
                                donations.map((d) => (
                                    <tr key={d.codigo_doacao} style={{ background: 'transparent' }}>
                                        <td>
                                            <span className="badge" style={{ background: d.status === 'Cancelada' ? '#fee2e2' : '#e0e7ff', color: d.status === 'Cancelada' ? '#ef4444' : '#4f46e5' }}>
                                                {d.status === 'Cancelada' ? <Ban size={12} style={{marginRight: '4px'}} /> : <RefreshCcw size={12} style={{marginRight: '4px'}} />}
                                                {d.status}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800 }}>{d.codigo_doacao}</td>
                                        <td>{d.codigo_doador}</td>
                                        <td style={{ fontWeight: 700 }}>{d.doadores?.nome}</td>
                                        <td>{d.data_doacao?.split('-').reverse().join('/')}</td>
                                        <td>{d.status === 'Cancelada' ? (d.data_cancelamento?.split('-').reverse().join('/') || '---') : (d.remarcado_para?.split('-').reverse().join('/') || '---')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="btn-action" style={{ background: '#6b7280', color: 'white', padding: '6px 12px', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }} onClick={() => handlePrint(d, 'matricial')} title="Matricial">
                                                    <FileText size={14} /> Matricial
                                                </button>
                                                <button className="btn-action" style={{ background: '#4f46e5', color: 'white', padding: '6px 12px', fontSize: '0.75rem', height: 'auto', borderRadius: '4px' }} onClick={() => handlePrint(d, 'normal')} title="Normal">
                                                    <Printer size={14} /> Normal
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {donations.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center', opacity: 0.7, fontSize: '0.85rem' }}>
                        <Info size={16} /> <span>Para imprimir ficha, clique nos botões de Ficha Matricial ou Ficha Normal ao lado do registro correspondente.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelatorioCanceladas;
