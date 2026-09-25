import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Printer, List, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toDatePart } from '../utils/date';


import FichaDoacoesNovaModal from './FichaDoacoesNovaModal';

const ReportForm = () => {
    const [donations, setDonations] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Todas');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totals, setTotals] = useState({ total: 0, baixadas: 0, pendentes: 0, canceladas: 0, remarcadas: 0 });
    const [selectedDonation, setSelectedDonation] = useState(null);

    const formatDate = (d) => {
        const datePart = toDatePart(d);
        if (!datePart) return '';
        const [y, m, day] = datePart.split('-');
        return day && m && y ? `${day}/${m}/${y}` : datePart;
    };

    const fetchDonations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const filter = statusFilter;
            let query = supabase.from('doacoes').select('*, doadores(*)');
            if (filter === 'Todas') {
                query = query.neq('status', 'Baixada').neq('status', 'Cancelada');
            } else {
                query = query.eq('status', filter);
            }
            // FIX 3: Ordenar por Código do Doador crescente (quando filtrado por status)
            query = query.order('codigo_doador', { ascending: true });

            const { data, error } = await query;
            if (error) throw error;

            const safeData = data || [];
            let finalData = filter === 'Todas'
                ? safeData.filter(d => {
                    if (!d.status) return true;
                    const s = d.status.toString().toLowerCase().trim();
                    return s !== 'baixada' && s !== 'cancelada';
                })
                : safeData;

            // Garantia de ordenação numérica por Código do Doador crescente no frontend
            finalData = [...finalData].sort((a, b) => {
                const ca = parseInt(a.codigo_doador) || 0;
                const cb = parseInt(b.codigo_doador) || 0;
                if (ca !== cb) return ca - cb;
                // desempate por código da doação
                return String(a.codigo_doacao).localeCompare(String(b.codigo_doacao));
            });

            setDonations(finalData);
            setTotals({
                total: safeData.length,
                baixadas: safeData.filter(d => d.status === 'Baixada').length,
                pendentes: safeData.filter(d => d.status === 'Pendente').length,
                canceladas: safeData.filter(d => d.status === 'Cancelada').length,
                remarcadas: safeData.filter(d => d.status === 'Remarcada').length
            });
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao carregar doações');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchDonations(); }, [fetchDonations]);



    return (
        <div className="main-content-layout" style={{flexDirection: 'column'}}>
            <div className="report-premium-card">
                <div className="report-header-premium">
                    <div className="icon-box" style={{background: 'var(--primary-color)', color: 'white'}}><FileText size={28} /></div>
                    <div>
                        <h2 style={{margin:0, fontWeight:900, fontSize:'1.5rem'}}>Relatório de Doações</h2>
                        <p style={{margin:0, opacity:0.6}}>Filtre, analise e exporte os dados do projeto</p>
                    </div>
                </div>

                <div className="nav-bar">
                    <div style={{display:'flex', gap:'10px', flex:1}}>
                        {['Todas', 'Pendente', 'Baixada', 'Cancelada', 'Remarcada'].map(s => (
                            <button key={s} className={`btn-action ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStatusFilter(s)}>{s}</button>
                        ))}
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>

                    </div>
                </div>

                <div className="premium-wrapper" style={{gap:'20px'}}>
                    {[
                        { label: 'Total Registros', val: totals.total, color: 'var(--primary-color)' },
                        { label: 'Baixadas/Retiradas', val: totals.baixadas, color: 'var(--success-color)' },
                        { label: 'Pendentes', val: totals.pendentes, color: 'var(--warning-color)' },
                        { label: 'Canceladas', val: totals.canceladas, color: 'var(--danger-color)' }
                    ].map((t, i) => (
                        <div key={i} className="glass-card" style={{flex: 1, textAlign: 'center', padding: '20px', borderBottom: `4px solid ${t.color}`}}>
                            <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.6, marginBottom: '5px'}}>{t.label}</div>
                            <div style={{fontSize: '1.8rem', fontWeight: 900, color: t.color}}>{t.val}</div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div style={{padding: '16px', marginBottom: '16px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600}}>
                        <AlertTriangle size={20} /> {error}
                    </div>
                )}
                <div className="glass-card" style={{padding: '30px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                    <div className="section-title-premium" style={{marginTop: 0}}><List size={16} /> Lista de Doações {loading && <span style={{opacity:0.5, fontSize:'0.8rem'}}>— Carregando...</span>} (Filtro Ativo: {statusFilter})</div>
                    <div className="table-container" style={{maxHeight:'550px', overflowY:'auto'}}>
                        <table className="donation-items-table">
                            <thead>
                                <tr>
                                    <th style={{width: '120px', whiteSpace: 'nowrap'}}>Código</th>
                                    <th style={{width: '110px', whiteSpace: 'nowrap'}}>Cód. Doador</th>
                                    <th>Doador</th>
                                    <th style={{textAlign: 'center', width: '120px'}}>Data</th>
                                    <th style={{textAlign: 'center', width: '150px'}}>Status</th>
                                    <th style={{textAlign: 'center', width: '80px'}}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.length > 0 ? donations.map((d) => (
                                    <tr key={d.codigo_doacao}>
                                        <td style={{whiteSpace: 'nowrap'}}><span className="badge"># {d.codigo_doacao}</span></td>
                                        <td style={{fontWeight: 600}}>{d.codigo_doador}</td>
                                        <td style={{fontWeight: 700}}>{d.doadores?.nome}</td>
                                        <td style={{textAlign: 'center'}}>{formatDate(d.data_doacao)}</td>
                                        <td style={{textAlign: 'center'}}><span className="badge" style={{background: d.status === 'Baixada' ? 'var(--success-color)' : (d.status === 'Cancelada' ? 'var(--danger-color)' : 'var(--warning-color)'), color: 'white'}}>{d.status}</span></td>
                                        <td style={{textAlign: 'center'}}>
                                            <div style={{display:'flex', gap:'8px', justifyContent:'center'}}>
                                                <button className="btn-nav" onClick={async () => {
                                                    let itens = d.itens_doacao || [];
                                                    if (!itens.length && d.codigo_doacao) {
                                                        const { data: itemData } = await supabase.from('itens_doacao').select('*').eq('id_doacao', d.codigo_doacao);
                                                        itens = itemData || [];
                                                    }
                                                    const dForModal = {
                                                        ...d,
                                                        codigo: d.codigo_doacao,
                                                        codigoDoador: d.codigo_doador,
                                                        nomeDoador: d.doadores?.nome,
                                                        dataDoacao: d.data_doacao,
                                                        itens,
                                                        doadores: d.doadores
                                                    };
                                                    setSelectedDonation(dForModal);
                                                }}>
                                                    <Printer size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} style={{textAlign: 'center', opacity: 0.5, padding: '50px'}}>Nenhum registro encontrado com este filtro.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedDonation && (
                <FichaDoacoesNovaModal 
                    donation={selectedDonation} 
                    onClose={() => setSelectedDonation(null)} 
                />
            )}
        </div>
    );
};

export default ReportForm;
