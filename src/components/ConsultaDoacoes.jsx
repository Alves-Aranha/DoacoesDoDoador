import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { toDatePart } from '../utils/date';
import { Search, CheckCircle, AlertTriangle, X, FileText, ChevronRight } from 'lucide-react';

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

const toIsoDate = (value) => {
    if (!value) return '';
    if (value.includes('-')) return toDatePart(value);
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split(/T| /)[0].split('-');
    return `${day}/${month}/${year}`;
};

const baixaDate = (d) => {
    if (d.data_baixa) return formatDate(d.data_baixa);
    if (d.status === 'Baixada' && d.data_retirada) return formatDate(d.data_retirada);
    return '';
};

const fieldLabel = {
    color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase',
    display: 'block', fontSize: '0.62rem', letterSpacing: '0.02em', marginBottom: 4,
};

const toLocalIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const ConsultaDoacoes = () => {
    const today = new Date();
    const isoToday = toLocalIso(today);
    const isoMonthStart = toLocalIso(new Date(today.getFullYear(), today.getMonth(), 1));

    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [dateInicio, setDateInicio] = useState(isoMonthStart);
    const [dateFim, setDateFim] = useState(isoToday);
    const [donors, setDonors] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState(null);   // detalhe da doação (modal)
    const [selectedItems, setSelectedItems] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    // Lista de doadores para os formulários suspensos (Código / Nome)
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('doadores')
                    .select('codigo_doador, nome')
                    .order('nome');
                if (error) throw error;
                if (active) setDonors(data || []);
            } catch (e) {
                console.error('Erro ao carregar doadores para consulta:', e);
            }
        })();
        return () => { active = false; };
    }, []);

    const handleSearch = async () => {
        const code = searchCode.trim();
        const name = searchName.trim();

        if (!code && !name) {
            showToast('Digite o Código ou o Nome do Doador para consultar.', 'error');
            return;
        }
        if (!dateInicio || !dateFim) {
            showToast('Preencha a Data Início e a Data Fim.', 'error');
            return;
        }
        const startIso = toIsoDate(dateInicio);
        const endIso = toIsoDate(dateFim);
        if (!startIso || !endIso) {
            showToast('Datas inválidas. Use o formato dd/mm/aaaa.', 'error');
            return;
        }

        setLoading(true);
        try {
            let query = supabase
                .from('doacoes')
                .select('codigo_doacao, codigo_doador, status, data_doacao, data_retirada, remarcado_para, data_baixa, data_cancelamento, doadores!inner(nome)')
                .gte('data_doacao', startIso)
                .lte('data_doacao', endIso)
                .order('data_doacao', { ascending: false });

            if (code) {
                query = query.eq('codigo_doador', String(code).replace(/\D/g, '').padStart(6, '0'));
            } else if (name) {
                query = query.ilike('doadores.nome', `%${name}%`);
            }

            const { data, error } = await query;
            if (error) throw error;

            setResults(data || []);
            if ((data || []).length > 0) {
                showToast(`${data.length} registro(s) encontrado(s).`);
            } else {
                showToast('Nenhuma doação encontrada nesse período.', 'error');
            }
        } catch (err) {
            console.error('Erro na consulta:', err);
            showToast('Erro ao consultar banco de dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSearchCode('');
        setSearchName('');
        setDateInicio('');
        setDateFim('');
        setResults([]);
        setSelected(null);
        setSelectedItems([]);
    };

    const handleOpenDetail = async (donation) => {
        setSelected(donation);
        setSelectedItems([]);
        setDetailLoading(true);
        try {
            const { data, error } = await supabase
                .from('itens_doacao')
                .select('*')
                .eq('id_doacao', donation.codigo_doacao);
            if (error) throw error;
            setSelectedItems(data || []);
        } catch (err) {
            console.error('Erro ao carregar itens:', err);
            showToast('Erro ao carregar itens da doação.', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="donor-card" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', borderRadius: 0 }}>
                <div className="donor-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '25px' }}>
                    <div className="icon-box" style={{ background: 'var(--primary-pastel-blue)', color: 'white' }}><Search size={32} /></div>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem' }}>Consulta de Doações</h2>
                        <p style={{ margin: 0, opacity: 0.6 }}>Consultas de doações por doador e período de cadastro.</p>
                    </div>
                </div>

                {/* Filtros da Consulta */}
                <div className="glass-card" style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 2fr) 180px 180px auto auto', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={fieldLabel}>Código do Doador</label>
                            <input
                                className="input-field"
                                style={{ width: '100%' }}
                                list="consulta-doador-codigos"
                                placeholder="Digite ou selecione..."
                                value={searchCode}
                                onChange={e => { setSearchCode(e.target.value.replace(/\D/g, '')); if (e.target.value.replace(/\D/g, '')) setSearchName(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <datalist id="consulta-doador-codigos">
                                {donors.map((d, i) => <option key={i} value={String(d.codigo_doador).padStart(6, '0')}>{d.nome}</option>)}
                            </datalist>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={fieldLabel}>Nome do Doador</label>
                            <input
                                className="input-field"
                                style={{ width: '100%' }}
                                list="consulta-doador-nomes"
                                placeholder="Digite ou selecione..."
                                value={searchName}
                                onChange={e => { setSearchName(e.target.value); if (e.target.value) setSearchCode(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <datalist id="consulta-doador-nomes">
                                {donors.map((d, i) => <option key={i} value={d.nome}>{String(d.codigo_doador).padStart(6, '0')}</option>)}
                            </datalist>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={fieldLabel}>Data Início</label>
                            <input type="date" className="input-field" style={{ width: '100%' }} value={dateInicio} onChange={e => setDateInicio(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={fieldLabel}>Data Fim</label>
                            <input type="date" className="input-field" style={{ width: '100%' }} value={dateFim} onChange={e => setDateFim(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
                        </div>
                        <button className="btn-action btn-primary" style={{ height: '42px', flexShrink: 0 }} onClick={handleSearch} disabled={loading}>
                            <Search size={18} /> {loading ? 'Consultando...' : 'Consultar'}
                        </button>
                        <button className="btn-action btn-secondary" style={{ height: '42px', flexShrink: 0 }} onClick={handleClear}>
                            <X size={18} /> Limpar
                        </button>
                    </div>
                </div>

                {/* Resultados da Consulta (Treeview) */}
                <div className="table-container" style={{ minHeight: '250px' }}>
                    <table className="donation-items-table">
                        <thead>
                            <tr>
                                <th>Cód. Doação</th>
                                <th>Data Cadastro</th>
                                <th>Data Retirada</th>
                                <th>Data Remarcada</th>
                                <th>Data Baixada</th>
                                <th>Data Cancelada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Realize uma consulta para listar as doações. Clique no Cód. Doação para ver os detalhes.</td></tr>
                            ) : (
                                results.map((d) => (
                                    <tr key={d.codigo_doacao} style={{ background: 'transparent', cursor: 'pointer' }} onClick={() => handleOpenDetail(d)}>
                                        <td style={{ fontWeight: 800, color: 'var(--primary-color)' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <ChevronRight size={14} /> {d.codigo_doacao}
                                            </span>
                                        </td>
                                        <td>{formatDate(d.data_doacao)}</td>
                                        <td>{formatDate(d.data_retirada)}</td>
                                        <td>{formatDate(d.remarcado_para)}</td>
                                        <td>{baixaDate(d)}</td>
                                        <td>{formatDate(d.data_cancelamento)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Detalhes da Consulta */}
            {selected && (
                <div className="ficha-modal-overlay" style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', padding: '16px',
                }}>
                    <div className="ficha-modal-card" style={{
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-xl)',
                        maxWidth: '720px',
                        width: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '90vh',
                    }}>
                        <div className="ficha-modal-header" style={{
                            background: 'var(--primary-pastel-blue)',
                            padding: '14px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                                <FileText size={22} />
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Detalhes da Consulta</span>
                            </div>
                            <button
                                onClick={() => { setSelected(null); setSelectedItems([]); }}
                                style={{ background: 'rgba(255,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '8px' }}
                                title="Fechar"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Cód. Doação</label>
                                    <span style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--primary-color)' }}>{selected.codigo_doacao}</span>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Status da Doação</label>
                                    <span className="badge" style={{ background: selected.status === 'Remarcada' ? '#dbeafe' : '#dcfce7', color: selected.status === 'Remarcada' ? '#1e40af' : '#166534', fontWeight: 700, padding: '6px 12px', borderRadius: '8px' }}>
                                        {selected.status}
                                    </span>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Data Retirada</label>
                                    <span style={{ fontWeight: 600 }}>{formatDate(selected.data_retirada)}</span>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Data Remarcada</label>
                                    <span style={{ fontWeight: 600 }}>{formatDate(selected.remarcado_para)}</span>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Data Baixada</label>
                                    <span style={{ fontWeight: 600 }}>{baixaDate(selected)}</span>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={fieldLabel}>Data Cancelada</label>
                                    <span style={{ fontWeight: 600 }}>{formatDate(selected.data_cancelamento)}</span>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px', letterSpacing: '0.02em' }}>Itens da Doação</h4>

                            {detailLoading ? (
                                <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Carregando itens...</p>
                            ) : selectedItems.length === 0 ? (
                                <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>Nenhum item cadastrado para esta doação.</p>
                            ) : (
                                <div className="table-container">
                                    <table className="donation-items-table">
                                        <thead>
                                            <tr>
                                                <th>Descrição do Item</th>
                                                <th>Tipo</th>
                                                <th>Qtde</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedItems.map((it, i) => (
                                                <tr key={i} style={{ background: 'transparent' }}>
                                                    <td style={{ fontWeight: 600 }}>{it.item || it.descricao || it.nome || '---'}</td>
                                                    <td style={{ textAlign: 'center' }}>{it.unidade || 'UN'}</td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700 }}>{it.qtde ?? '0'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConsultaDoacoes;
