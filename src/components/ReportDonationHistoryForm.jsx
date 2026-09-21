import React, { useState } from 'react';
import { Search, Printer, Calendar, History, Clock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import printService from '../services/printService';

const ReportDonationHistoryForm = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [codigoDoador, setCodigoDoador] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleConsultar = async () => {
        if (!dateRange.start || !dateRange.end) {
            alert('Por favor, informe pelo menos o período (Data Início e Data Fim).');
            return;
        }

        setLoading(true);
        try {
            // Inicia a query base
            let query = supabase
                .from('doacoes')
                .select(`
                    data_doacao, 
                    codigo_doacao, 
                    codigo_doador, 
                    status,
                    doadores (nome)
                `)
                .gte('data_doacao', dateRange.start)
                .lte('data_doacao', dateRange.end)
                // Filtra pelos status solicitados (incluindo variações de gênero)
                .or('status.ilike.Pendente,status.ilike.Baixada,status.ilike.Baixado,status.ilike.Remarcada,status.ilike.Remarcado');

            // Se informou o código do doador, aplica o filtro específico
            if (codigoDoador.trim() !== '') {
                query = query.eq('codigo_doador', String(codigoDoador).padStart(6, '0'));
            }

            // Ordenação solicitada: por Código do Doador e depois por Data
            const { data, error } = await query
                .order('codigo_doador', { ascending: true })
                .order('data_doacao', { ascending: true });

            if (error) throw error;

            const formatted = data.map(d => ({
                data_doacao: d.data_doacao,
                codigo_doacao: d.codigo_doacao,
                codigo_doador: d.codigo_doador,
                nome_doador: d.doadores?.nome || '---',
                ano_doacao: d.data_doacao ? d.data_doacao.split('-')[0] : '-',
                status: d.status
            }));

            setReportData(formatted);
            if (formatted.length === 0) alert('Nenhuma doação encontrada para os critérios informados.');
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar histórico: ' + err.message);
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrintMatricial = async () => {
        if (reportData.length === 0) return;

        let content = '';
        content += "HISTORICO DE DOAÇÕES - PERIODO: " + formatDate(dateRange.start) + " A " + formatDate(dateRange.end) + "\n";
        if (codigoDoador) content += "FILTRO DOADOR: " + String(codigoDoador).padStart(6, '0') + "\n";
        
        const line = "=".repeat(80) + "\n";
        const columns = "DATA      COD.DOA  COD.DOA  NOME DO DOADOR                         ANO \n";
        const subline = "-".repeat(80) + "\n";

        content += line + columns + subline;

        reportData.forEach(row => {
            const dataCol = formatDate(row.data_doacao).padEnd(10, ' ');
            const codDoa = String(row.codigo_doacao).padEnd(8, ' ');
            const codDoador = String(row.codigo_doador).padEnd(8, ' ');
            const nome = (row.nome_doador || '').substring(0, 38).padEnd(39, ' ');
            const ano = String(row.ano_doacao);
            
            content += `${dataCol} ${codDoa} ${codDoador} ${nome} ${ano}\n`;
        });

        content += line;
        content += `TOTAL DE REGISTROS: ${reportData.length}\n`;
        content += "\x0C"; 

        try {
            const res = await printService.printRawMatricial(content);
            if (!res.success) alert('Erro na impressão: ' + res.error);
        } catch (e) {
            alert('Erro ao processar impressão matricial.');
        }
    };

    return (
        <div className="main-content-layout history-report-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                .history-report-premium { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
                .report-card { background: var(--card-bg); border-radius: 20px; padding: 30px; box-shadow: var(--shadow-xl); border: 1px solid var(--border-color); }
                .report-header-ui { display: flex; align-items: center; gap: 16px; margin-bottom: 30px; }
                .report-header-ui .icon-box { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3); }
                .report-header-ui h2 { margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--text-color); }
                .report-header-ui p { margin: 4px 0 0 0; opacity: 0.6; font-size: 0.9rem; }

                .filter-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px; background: var(--input-bg); padding: 20px; border-radius: 16px; border: 1px solid var(--border-color); align-items: end; }
                .filter-group { display: flex; flex-direction: column; gap: 6px; }
                .filter-group label { font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                
                .btn-report { display: flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.2s; border: none; font-size: 0.9rem; height: 42px; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-secondary { background: #64748b; color: white; }
                
                .table-container { margin-top: 30px; border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; }
                .report-table { width: 100%; border-collapse: collapse; }
                .report-table th { background: var(--input-bg); padding: 14px; text-align: left; font-size: 0.7rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; border-bottom: 2px solid var(--border-color); }
                .report-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-color); }
                .report-table tr:hover td { background: rgba(59, 130, 246, 0.05); }
                
                .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; }
                .status-pendente { background: #fef3c7; color: #92400e; }
                .status-baixada { background: #dcfce7; color: #166534; }
                .status-baixado { background: #dcfce7; color: #166534; }
                .status-remarcada { background: #e0f2fe; color: #075985; }
                .status-remarcado { background: #e0f2fe; color: #075985; }
            `}} />

            <div className="report-card">
                <div className="report-header-ui">
                    <div className="icon-box"><History size={32} /></div>
                    <div>
                        <h2>Histórico de Doações</h2>
                        <p>Relatório de todas as doações por período e doador</p>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group">
                        <label>Data Início</label>
                        <input type="date" className="input-field" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} />
                    </div>
                    <div className="filter-group">
                        <label>Data Fim</label>
                        <input type="date" className="input-field" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} />
                    </div>
                    <div className="filter-group">
                        <label>Cód. Doador (Opcional)</label>
                        <input 
                            className="input-field" 
                            placeholder="000000" 
                            value={codigoDoador} 
                            onChange={e => setCodigoDoador(e.target.value)} 
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                        <button className="btn-report btn-primary" onClick={handleConsultar} disabled={loading}>
                            {loading ? <Clock className="animate-spin" size={18} /> : <Search size={18} />}
                            {loading ? 'Consultando...' : 'Consultar'}
                        </button>
                        <button className="btn-report btn-secondary" onClick={handlePrintMatricial} disabled={reportData.length === 0}>
                            <Printer size={18} /> Imprimir Matricial
                        </button>
                    </div>
                </div>

                {reportData.length > 0 && (
                    <div className="table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Data Doação</th>
                                    <th>Cód. Doação</th>
                                    <th>Cód. Doador</th>
                                    <th style={{fontWeight: 'normal'}}>Nome do Doador</th>
                                    <th>Ano</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td style={{fontWeight:700}}>{formatDate(row.data_doacao)}</td>
                                        <td>{row.codigo_doacao}</td>
                                        <td style={{color:'var(--primary-color)', fontWeight:700}}>{row.codigo_doador}</td>
                                        <td style={{fontWeight:600}}>{row.nome_doador}</td>
                                        <td>{row.ano_doacao}</td>
                                        <td>
                                            <span className={`status-badge status-${row.status.toLowerCase()}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDonationHistoryForm;
