import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { toDatePart } from '../utils/date';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart2, Search, Calendar, CheckSquare, Clock, Printer, FileText, Ban } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-color)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ margin: '4px 0', color: entry.color, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <span>{entry.name}:</span>
                        <span style={{ fontWeight: 'bold' }}>{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const DonationsBarChart = () => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 11);
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ retiradas: 0, remarcadas: 0, canceladas: 0 });
    const chartRef = React.useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: dataRetiradas, error: errRet } = await supabase
                .from('doacoes')
                .select('data_retirada')
                .not('data_retirada', 'is', null)
                .gte('data_retirada', startDate)
                .lte('data_retirada', `${endDate} 23:59:59`);
                
            if (errRet) throw errRet;

            const { data: dataRemarcadas, error: errRem } = await supabase
                .from('doacoes')
                .select('remarcado_para')
                .not('remarcado_para', 'is', null)
                .gte('remarcado_para', startDate)
                .lte('remarcado_para', `${endDate} 23:59:59`);
                
            if (errRem) throw errRem;

            const { data: dataCanceladas, error: errCan } = await supabase
                .from('doacoes')
                .select('data_cancelamento')
                .eq('status', 'Cancelada')
                .not('data_cancelamento', 'is', null)
                .gte('data_cancelamento', startDate)
                .lte('data_cancelamento', `${endDate} 23:59:59`);
                
            if (errCan) throw errCan;

            const start = new Date(startDate);
            const end = new Date(endDate);
            const monthsMap = new Map();
            
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
                const mesAno = `${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`;
                monthsMap.set(mesAno, { name: mesAno, sortKey: current.getTime(), retiradas: 0, remarcadas: 0, canceladas: 0 });
                current.setMonth(current.getMonth() + 1);
            }

            let totalRetiradas = 0;
            dataRetiradas?.forEach(item => {
                const dtStr = toDatePart(item.data_retirada);
                const [y, m, d] = dtStr.split('-');
                const mesAno = `${m}/${y}`;
                if (monthsMap.has(mesAno)) {
                    monthsMap.get(mesAno).retiradas += 1;
                    totalRetiradas++;
                }
            });

            let totalRemarcadas = 0;
            dataRemarcadas?.forEach(item => {
                const dtStr = toDatePart(item.remarcado_para);
                const [y, m, d] = dtStr.split('-');
                const mesAno = `${m}/${y}`;
                if (monthsMap.has(mesAno)) {
                    monthsMap.get(mesAno).remarcadas += 1;
                    totalRemarcadas++;
                }
            });

            let totalCanceladas = 0;
            dataCanceladas?.forEach(item => {
                const dtStr = toDatePart(item.data_cancelamento);
                const [y, m, d] = dtStr.split('-');
                const mesAno = `${m}/${y}`;
                if (monthsMap.has(mesAno)) {
                    monthsMap.get(mesAno).canceladas += 1;
                    totalCanceladas++;
                }
            });

            const result = Array.from(monthsMap.values()).sort((a, b) => a.sortKey - b.sortKey);
            
            setChartData(result);
            setStats({ retiradas: totalRetiradas, remarcadas: totalRemarcadas, canceladas: totalCanceladas });

        } catch (error) {
            console.error('Erro ao buscar dados do gráfico:', error);
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchData() }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const handleExportPDF = async () => {
        if (!chartData || chartData.length === 0) return;
        
        try {
            setLoading(true);
            const doc = new jsPDF();
            
            // Logomarca e Cabeçalho
            doc.addImage('/logo-instituicao.png', 'PNG', 15, 10, 30, 15);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Relatório Estatístico de Doações", 50, 20);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Período: ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`, 50, 26);
            
            doc.line(15, 30, 195, 30);
            
            // Resumo de Totais
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Resumo Geral", 15, 40);
            
            autoTable(doc, {
                startY: 45,
                head: [['Descrição', 'Quantidade']],
                body: [
                    ['Total de Doações Retiradas', stats.retiradas],
                    ['Total de Doações Remarcadas', stats.remarcadas],
                    ['Total de Doações Canceladas', stats.canceladas]
                ],
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235] }
            });
            
            // Dados Mensais (Tabela)
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Detalhamento Mensal", 15, doc.lastAutoTable.finalY + 15);
            
            autoTable(doc, {
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Mês/Ano', 'Retiradas', 'Remarcadas', 'Canceladas']],
                body: chartData.map(d => [d.name, d.retiradas, d.remarcadas, d.canceladas]),
                theme: 'grid',
                headStyles: { fillColor: [37, 99, 235] }
            });

            // Adicionando Captura do Gráfico se existir
            if (chartRef.current) {
                const canvas = await html2canvas(chartRef.current, { 
                    scale: 2,
                    backgroundColor: '#ffffff'
                });
                const imgData = canvas.toDataURL('image/png');
                
                // Nova página para o gráfico ou no final se couber
                const finalY = doc.lastAutoTable.finalY;
                if (finalY > 150) {
                    doc.addPage();
                    doc.text("Gráfico Evolutivo", 15, 20);
                    doc.addImage(imgData, 'PNG', 15, 30, 180, 90);
                } else {
                    doc.text("Gráfico Evolutivo", 15, finalY + 15);
                    doc.addImage(imgData, 'PNG', 15, finalY + 20, 180, 90);
                }
            }
            
            doc.save(`Relatorio_Estatistico_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content-layout bar-chart-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                .bar-chart-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .bar-chart-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
                }
                .bar-chart-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .bar-chart-header .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2563eb, #1e40af);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .bar-chart-header h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                }
                .bar-chart-header .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }

                .bar-chart-section-title {
                    color: #1e3a8a;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 16px 0 16px 0;
                }
                .bar-chart-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                [data-theme='dark'] .bar-chart-section-title {
                    color: #60a5fa;
                }
                [data-theme='dark'] .bar-chart-section-title::after {
                    background: #334155;
                }

                .bar-chart-filter {
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

                .bar-chart-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                    background: #2563eb;
                    color: white;
                }
                .bar-chart-btn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .bar-chart-btn:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                .bar-chart-btn-green {
                    background: #10b981;
                }
                .bar-chart-btn-green:hover {
                    background: #059669;
                }

                .chart-container-wrapper {
                    border: 1px solid var(--border-color);
                    background: var(--bg-color);
                    border-radius: 0;
                    padding: 20px 20px 0 0;
                    margin-top: 24px;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
                }

                .chart-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                    margin-top: 24px;
                }
                .chart-stat-box {
                    padding: 20px;
                    border-radius: 0;
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: var(--input-bg);
                }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                .stat-blue { background: #2563eb; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3); }
                .stat-red { background: #ef4444; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3); }
                .stat-content h3 { margin: 0; font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-content p { margin: 4px 0 0 0; font-size: 1.5rem; font-weight: 800; color: var(--text-color); }
            `}} />

            <div className="bar-chart-card">
                <div className="bar-chart-header">
                    <div className="icon-wrapper">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h2>Estatísticas de Doações</h2>
                        <p className="subtitle">Comparativo entre Retiradas, Remarcadas e Canceladas</p>
                    </div>
                </div>

                <div className="bar-chart-section-title">🔍 Filtro de Período</div>
                
                <form onSubmit={handleSearch} className="bar-chart-filter">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Data Início</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Data Fim</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={endDate} onChange={e => setEndDate(e.target.value)} required />
                        </div>
                    </div>
                    <button type="submit" className="bar-chart-btn" disabled={loading}>
                        <Search size={18} /> {loading ? 'Gerando...' : 'Gerar Gráfico'}
                    </button>
                    <button type="button" className="bar-chart-btn bar-chart-btn-green" onClick={handleExportPDF} disabled={loading || chartData.length === 0}>
                        <Printer size={18} /> Imprimir Relatório
                    </button>
                </form>

                {chartData.length > 0 ? (
                    <>
                        <div className="chart-stats-grid">
                            <div className="chart-stat-box">
                                <div className="stat-icon stat-blue"><CheckSquare size={24} /></div>
                                <div className="stat-content">
                                    <h3>Total Retiradas</h3>
                                    <p>{stats.retiradas}</p>
                                </div>
                            </div>
                            <div className="chart-stat-box">
                                <div className="stat-icon stat-red"><Clock size={24} /></div>
                                <div className="stat-content">
                                    <h3>Total Remarcadas</h3>
                                    <p>{stats.remarcadas}</p>
                                </div>
                            </div>
                            <div className="chart-stat-box">
                                <div className="stat-icon" style={{ background: '#64748b', boxShadow: '0 4px 10px rgba(100, 116, 139, 0.3)' }}><Ban size={24} /></div>
                                <div className="stat-content">
                                    <h3>Total Canceladas</h3>
                                    <p>{stats.canceladas}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bar-chart-section-title" style={{ marginTop: '24px' }}>📊 Gráfico Mensal</div>
                        <div className="chart-container-wrapper" ref={chartRef}>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-color)', fontSize: 12 }} tickMargin={10} axisLine={{ stroke: 'var(--border-color)' }} />
                                    <YAxis allowDecimals={false} stroke="var(--text-muted)" tick={{ fill: 'var(--text-color)', fontSize: 12 }} axisLine={{ stroke: 'var(--border-color)' }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--input-bg)' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                    <Bar dataKey="retiradas" name="Doações Retiradas" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="remarcadas" name="Doações Remarcadas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="canceladas" name="Doações Canceladas" fill="#64748b" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                ) : (
                    !loading && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 0, marginTop: '24px' }}>
                            Nenhum dado encontrado para o período selecionado.
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default DonationsBarChart;
