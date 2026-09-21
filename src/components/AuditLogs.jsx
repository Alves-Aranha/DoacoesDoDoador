import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Calendar, FileText, Clock, AlertCircle } from 'lucide-react';

const AuditLogs = () => {
    const { isAdmin } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Inicia com um intervalo bem largo para não ter erro
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.logs.list();
            if (data && data.length > 0) {
                console.log('Logs carregados:', data.length, ' Primeiro:', data[0]);
            } else {
                console.warn('Nenhum log retornado pela API');
            }
            setLogs(data || []);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log => {
        const s = searchTerm.toLowerCase();
        const created = log.created_at || '';
        const dataIn = `${created} ${log.usuario_email} ${log.acao} ${log.modulo} ${log.detalhes}`.toLowerCase();

        let logDate = '';
        try { logDate = new Date(created).toISOString().split('T')[0]; } catch (e) { logDate = ''; }
        const isWithinDate = logDate ? (logDate >= startDate && logDate <= endDate) : true;

        return dataIn.includes(s) && isWithinDate;
    });

    // Se você não for Admin, avisamos, mas vamos tentar mostrar se houver erro de permissão
    if (!isAdmin) {
        console.warn("Aviso: Usuário não identificado como Admin. Se os logs não aparecerem, verifique as permissões no Supabase.");
    }

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column', gap: '24px' }}>
            <div className="form-section" style={{ borderRadius: 0, maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ backgroundColor: '#3b82f6', padding: '12px', borderRadius: '12px', color: 'white' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>Logs de Auditoria</h2>
                        <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Mostrando todos os registros do banco</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.02)', padding: '20px', borderRadius: 0 }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Desde:</label>
                        <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Até:</label>
                        <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 'bold' }}>Busca Geral</label>
                        <input type="text" className="input-field" placeholder="Pesquise qualquer coisa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button className="btn-primary" onClick={fetchLogs} style={{ height: '42px' }}>Atualizar</button>
                </div>
            </div>

            <div className="form-section" style={{ padding: 0 }}>
                <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <colgroup>
                        <col style={{ width: '150px' }} />
                        <col style={{ width: '260px' }} />
                        <col style={{ width: '160px' }} />
                        <col style={{ width: '300px' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Usuário</th>
                            <th>Ação</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map((log) => (
                            <tr key={log.id}>
                                <td style={{ fontSize: '0.8rem' }}>{log.created_at ? new Date(log.created_at).toLocaleString('pt-BR') : '-'}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>{log.usuario_email}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'nowrap',
                                        backgroundColor: log.acao === 'Login' ? '#dbeafe' : '#fef3c7',
                                        color: log.acao === 'Login' ? '#1e40af' : '#92400e'
                                    }}>
                                        {log.acao}
                                    </span>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{log.detalhes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;