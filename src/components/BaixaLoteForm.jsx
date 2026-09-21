import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertCircle, AlertTriangle, X, ClipboardCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

// ─── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="modal-overlay">
        <div className="modal-box">
            <div className="modal-icon"><AlertTriangle size={36} color="#16a34a" /></div>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className="btn-action btn-success" onClick={onConfirm}><CheckCircle size={16} /> Confirmar</button>
                <button className="btn-action btn-secondary" onClick={onCancel}><X size={16} /> Cancelar</button>
            </div>
        </div>
    </div>
);

const BaixaLoteForm = () => {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    
    const [donations, setDonations] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setToast(null);
        setSelectedIds(new Set());
        try {
            const { data, error } = await supabase
                .from('doacoes')
                .select('codigo_doacao, codigo_doador, data_retirada, status, remarcado_para, doadores(nome)')
                .or(`and(status.eq.Pendente,data_retirada.gte.${startDate},data_retirada.lte.${endDate}),and(remarcado_para.gte.${startDate},remarcado_para.lte.${endDate})`)
                .order('codigo_doador', { ascending: true });

            if (error) throw error;
            
            // Ordenação numérica por código doador no frontend para garantir precisão
            const sortedData = (data || []).sort((a, b) => {
                const codeA = parseInt(a.codigo_doador) || 0;
                const codeB = parseInt(b.codigo_doador) || 0;
                return codeA - codeB;
            });

            setDonations(sortedData);
            
            if (data?.length === 0) {
                showToast('Nenhuma doação Pendente ou Remarcada encontrada neste período.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Erro ao buscar doações: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (codigo) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(codigo)) {
            newSelected.delete(codigo);
        } else {
            newSelected.add(codigo);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === donations.length && donations.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(donations.map(d => d.codigo_doacao)));
        }
    };

    const handleBaixaLote = async () => {
        if (selectedIds.size === 0) return;
        setShowConfirm(false);
        setProcessing(true);
        
        try {
            const arrayIds = Array.from(selectedIds);
            const { error } = await supabase
                .from('doacoes')
                .update({ status: 'Baixada', data_baixa: new Date().toISOString().split('T')[0] })
                .in('codigo_doacao', arrayIds);

            if (error) throw error;

            showToast(`${arrayIds.length} doações baixadas com sucesso!`);
            await registerLog({ usuario_email: user?.email || '', acao: 'Alteração', modulo: 'Baixa em Lote', detalhes: `${arrayIds.length} doações baixadas em lote` });
            setDonations(prev => prev.filter(d => !selectedIds.has(d.codigo_doacao)));
            setSelectedIds(new Set());
        } catch (err) {
            console.error(err);
            showToast('Erro ao dar baixa: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split(/T| /)[0].split('-');
        return `${day}/${month}/${year}`;
    };

    const allSelected = donations.length > 0 && selectedIds.size === donations.length;

    return (
        <div className="main-content-layout baixa-page-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                .baixa-page-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .baixa-premium-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
                }
                .baixa-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .baixa-header-premium .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #16a34a, #15803d);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
                }
                .baixa-header-premium h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                }
                .baixa-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }

                .baixa-section-title {
                    color: #1e3a8a;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0 16px 0;
                }
                .baixa-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                [data-theme='dark'] .baixa-section-title {
                    color: #60a5fa;
                }
                [data-theme='dark'] .baixa-section-title::after {
                    background: #334155;
                }

                .baixa-search-grid {
                    background: var(--input-bg);
                    padding: 20px;
                    border-radius: 0;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }

                .baixa-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                }
                .baixa-btn-search { background: #2563eb; color: white; }
                .baixa-btn-search:hover { background: #1d4ed8; transform: translateY(-1px); }
                .baixa-btn-search:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }

                .baixa-btn-action {
                    background: #16a34a;
                    color: white;
                    padding: 10px 24px;
                    box-shadow: 0 4px 12px rgba(22, 163, 74, 0.2);
                }
                .baixa-btn-action:hover:not(:disabled) { 
                    background: #15803d; 
                    transform: translateY(-1px); 
                    box-shadow: 0 6px 15px rgba(22, 163, 74, 0.3); 
                    color: white;
                }
                .baixa-btn-action:disabled { 
                    background: #f1f5f9; 
                    color: #94a3b8; 
                    border: 1px solid #e2e8f0;
                    cursor: not-allowed; 
                    box-shadow: none;
                }

                .baixa-table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .baixa-table-premium th {
                    background: var(--input-bg);
                    padding: 12px 14px;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                }
                .baixa-table-premium td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .baixa-table-premium tbody tr {
                    cursor: pointer;
                }
                .baixa-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .baixa-table-premium tbody tr.selected td {
                    background: rgba(22, 163, 74, 0.08);
                }
                .baixa-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }

                .baixa-status-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    background: #fef3c7;
                    color: #92400e;
                }
                [data-theme='dark'] .baixa-status-badge {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fbbf24;
                }
                .baixa-status-remarcada {
                    background: #dbeafe !important;
                    color: #1e40af !important;
                }
                [data-theme='dark'] .baixa-status-remarcada {
                    background: rgba(59, 130, 246, 0.15) !important;
                    color: #93c5fd !important;
                }

                .baixa-action-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    flex-wrap: wrap;
                    gap: 12px;
                }

                .baixa-counter-badge {
                    background: var(--input-bg);
                    color: var(--text-color);
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid var(--border-color);
                    margin-left: auto;
                }

                .baixa-selection-info {
                    font-size: 0.85rem;
                    color: var(--text-color);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .baixa-selection-count {
                    background: #2563eb;
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                }
            `}} />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {showConfirm && (
                <ConfirmModal
                    message={`Tem certeza que deseja dar baixa em ${selectedIds.size} doações?`}
                    onConfirm={handleBaixaLote}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className="baixa-premium-card">
                {/* Header */}
                <div className="baixa-header-premium">
                    <div className="icon-wrapper">
                        <ClipboardCheck size={24} />
                    </div>
                    <div>
                        <h2>Baixa de Doações em Lote</h2>
                        <p className="subtitle">Selecione e baixe múltiplas doações pendentes ou remarcadas de uma vez</p>
                    </div>
                    <span className="baixa-counter-badge">{donations.length} doação(ões)</span>
                </div>

                {/* Filtro */}
                <div className="baixa-section-title">🔍 Filtrar por Período de Retirada</div>
                <form onSubmit={handleSearch} className="baixa-search-grid">
                    <div className="form-group">
                        <label>Data Início</label>
                        <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Data Fim</label>
                        <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                    <button type="submit" className="baixa-btn baixa-btn-search" disabled={loading}>
                        <Search size={18} /> {loading ? 'Buscando...' : 'Filtrar Pendentes e Remarcadas'}
                    </button>
                </form>

                <div className="baixa-action-bar">
                    <div className="baixa-selection-info">
                        {donations.length > 0 && selectedIds.size > 0 ? (
                            <>Selecionadas: <span className="baixa-selection-count">{selectedIds.size}</span></>
                        ) : (
                            <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>Selecione as doações na lista para processar</span>
                        )}
                    </div>
                    <button 
                        type="button" 
                        onClick={() => setShowConfirm(true)} 
                        disabled={selectedIds.size === 0 || processing}
                        className="baixa-btn baixa-btn-action"
                    >
                        <CheckCircle size={18} /> {processing ? 'Processando...' : `Dar Baixa nas Selecionadas (${selectedIds.size})`}
                    </button>
                </div>

                {/* Tabela */}
                <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto', borderRadius: '12px' }}>
                    <table className="baixa-table-premium">
                        <thead>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={allSelected} 
                                        onChange={toggleAll}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                                    />
                                </th>
                                <th style={{ width: '320px', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 15px' }}>
                                        <span>RETIRADA / REMARCADA</span>
                                        <span>CÓD. DOADOR</span>
                                    </div>
                                </th>
                                <th style={{ width: '150px', textAlign: 'center' }}>Cód. Doação</th>
                                <th>Doador</th>
                                <th style={{ width: '140px', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {donations.map((d) => {
                                const isSelected = selectedIds.has(d.codigo_doacao);
                                return (
                                    <tr 
                                        key={d.codigo_doacao} 
                                        onClick={() => toggleSelection(d.codigo_doacao)}
                                        className={isSelected ? 'selected' : ''}
                                    >
                                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleSelection(d.codigo_doacao)}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
                                            />
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px' }}>
                                                <span style={{fontWeight: 600}}>
                                                    {d.remarcado_para ? formatDate(d.remarcado_para) : formatDate(d.data_retirada)}
                                                    {d.remarcado_para && <span style={{fontSize:'0.7rem', opacity:0.5, marginLeft:'6px'}}>(remarcada)</span>}
                                                </span>
                                                <span style={{opacity: 0.2}}>|</span>
                                                <span style={{color: '#2563eb', fontWeight: 800, minWidth: '80px', textAlign: 'right'}}>{d.codigo_doador}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>{d.codigo_doacao}</td>
                                        <td style={{ fontWeight: 600 }}>{d.doadores?.nome || 'Desconhecido'}</td>
                                        <td>
                                            <span className={`baixa-status-badge${d.remarcado_para ? ' baixa-status-remarcada' : ''}`}>{d.remarcado_para ? 'Remarcada' : d.status}</span>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {!loading && donations.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                        Nenhuma doação pendente ou remarcada encontrada neste período.
                                    </td>
                                </tr>
                            )}
                            
                            {loading && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                        Buscando dados no servidor...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BaixaLoteForm;
