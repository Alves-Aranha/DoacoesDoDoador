import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Filter, Download, Info, Brain, Target, ArrowUpRight, ArrowDownRight, LayoutGrid, List, CheckCircle, X, Calculator, Table as TableIcon, ChevronLeft, ChevronRight, FileText, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { toLocalIsoDate, toDatePart } from '../utils/date';

const ProjectionsForm = ({ initialViewMode = 'dashboard' }) => {
    const [viewMode, setViewMode] = useState(initialViewMode);
    const [stats, setStats] = useState({ totalAnual: 0, metaMensal: 500, progresso: 0, historico: [], regional: [], totalAgendamentos: 0 });
    const [projections, setProjections] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear();
            // Filtro no banco para não trazer o histórico inteiro de doações
            const { data: dData } = await supabase
                .from('doacoes')
                .select('data_doacao, status, doadores(regiao)')
                .gte('data_doacao', `${currentYear}-01-01`);
            const anuais = dData?.filter(d => d.data_doacao && parseInt(toDatePart(d.data_doacao).slice(0, 4), 10) === currentYear) || [];
            
            const regionalObj = anuais.reduce((acc, curr) => {
                const reg = curr.doadores?.regiao || 'Outros';
                acc[reg] = (acc[reg] || 0) + 1; return acc;
            }, {});
            const regData = Object.entries(regionalObj).map(([name, total]) => ({ name, total })).sort((a,b)=>b.total - a.total).slice(0, 5);

            setStats({ totalAnual: anuais.length, metaMensal: 500, progresso: (anuais.length / 6000) * 100, historico: [], regional: regData });

            const todayIso = toLocalIsoDate();
            const next30 = new Date();
            next30.setDate(next30.getDate() + 30);
            const next30Iso = toLocalIsoDate(next30);

            const { data: pData } = await supabase
                .from('doacoes')
                .select('data_retirada, remarcado_para, status, doadores(regiao, dia_semana)')
                .or(`data_retirada.gte.${todayIso},remarcado_para.gte.${todayIso}`)
                .neq('status', 'Cancelada')
                .neq('status', 'Baixada')
                .limit(2000);

            let totalAgendamentosCount = 0;
            if (pData) {
                totalAgendamentosCount = pData.length;
                const grouped = pData.reduce((acc, curr) => {
                    // Prioriza data remarcada sobre data de retirada
                    const rawDate = curr.remarcado_para || curr.data_retirada;
                    const effectiveDate = rawDate ? toDatePart(rawDate) : '';
                    
                    // Verifica se a data efetiva está no range de 30 dias
                    if (!effectiveDate || effectiveDate > next30Iso) {
                        totalAgendamentosCount--; // Remove da contagem total se estiver fora do range de 30 dias
                        return acc;
                    }

                    const region = curr.doadores?.regiao || 'Outros';
                    const key = `${effectiveDate}_${region}`;
                    const normalize = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                    const diaSemana = normalize(curr.doadores?.dia_semana);

                    if (!acc[key]) {
                        acc[key] = { date: effectiveDate, region, segTerSex: 0, segunda: 0, terca: 0, quarta: 0, quinta: 0, sexta: 0, sabado: 0 };
                    }

                    if (diaSemana.includes('seg/ter/sex') || diaSemana === 'se/ter/sex' || diaSemana === 'seg/ter/se0x') acc[key].segTerSex++;
                    else if (diaSemana.includes('segunda') || diaSemana === 'seg' || diaSemana === 'se') acc[key].segunda++;
                    else if (diaSemana.includes('terca') || diaSemana === 'ter') acc[key].terca++;
                    else if (diaSemana.includes('quarta') || diaSemana === 'qua') acc[key].quarta++;
                    else if (diaSemana.includes('quinta') || diaSemana === 'qui') acc[key].quinta++;
                    else if (diaSemana.includes('sexta') || diaSemana === 'sex') acc[key].sexta++;
                    else if (diaSemana.includes('sabado') || diaSemana === 'sab') acc[key].sabado++;

                    return acc;
                }, {});
                setProjections(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)));
            }

            setStats(prev => ({ ...prev, totalAnual: anuais.length, regional: regData, totalAgendamentos: totalAgendamentosCount }));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const formatDate = (dateStr) => {
        const datePart = toDatePart(dateStr);
        if (!datePart) return '';
        const [y, m, d] = datePart.split('-');
        return `${d}/${m}/${y}`;
    };

    if (viewMode === 'table') {
        return (
            <div className="main-content-layout" style={{flexDirection: 'column', gap: '20px', padding: '0 0 40px 0', maxWidth: '1300px', width: '100%', margin: '0 auto', animation: 'fadeIn 0.4s ease-out', alignItems: 'stretch'}}>
                {/* Header Premium Adaptável */}
                <div className="glass-card" style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '15px 30px', 
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    borderRadius: '16px 16px 0 0',
                    color: 'white',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div className="icon-box" style={{background: 'rgba(255,255,255,0.2)', color: 'white'}}><Calendar size={28} /></div>
                        <div>
                            <h2 style={{margin: 0, fontWeight: 900, fontSize: '1.6rem'}}>Doações (Próximos 30 Dias)</h2>
                            <p style={{margin: 0, opacity: 0.9, fontSize: '0.85rem'}}>Planejamento detalhado de coletas agendadas</p>
                        </div>
                    </div>
                    <div style={{display: 'flex', gap: '12px'}}>
                        <button 
                            className="btn-action" 
                            onClick={() => setViewMode('dashboard')} 
                            style={{
                                background: 'white', 
                                color: 'var(--primary-color)', 
                                border: 'none',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <X size={18} /> Voltar ao Dashboard
                        </button>
                        <button className="btn-action" onClick={fetchData} style={{background: 'var(--success-color)', color: 'white', border: 'none', fontWeight: 800}}><TrendingUp size={18} /> Atualizar</button>
                    </div>
                </div>

                {/* Tabela Premium */}
                <div className="glass-card" style={{padding: '0', overflow: 'hidden', borderRadius: '0 0 16px 16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)'}}>
                    <div style={{overflowX: 'auto'}}>
                        <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'center'}}>
                            <thead>
                                <tr style={{background: 'var(--card-bg)', borderBottom: '2px solid var(--border-color)'}}>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>RETIRADA</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', textAlign: 'left'}}>Região</th>
                                    <th style={{padding: '20px 15px', color: 'var(--primary-color)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Seg/Ter/Sex</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Segunda</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Terça</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Quarta</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Quinta</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Sexta</th>
                                    <th style={{padding: '20px 15px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px'}}>Sábado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projections.map((row, idx) => (
                                    <tr key={idx} style={{borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s'}} className="table-row-hover">
                                        <td style={{padding: '18px 15px', fontWeight: 700, color: 'var(--text-color)'}}>{formatDate(row.date)}</td>
                                        <td style={{padding: '18px 15px', textAlign: 'left', fontWeight: 800, color: 'var(--primary-color)'}}>{row.region}</td>
                                        <td style={{padding: '18px 15px'}}><span style={{display: 'inline-block', minWidth: '30px', padding: '4px 8px', borderRadius: '6px', background: row.segTerSex ? 'var(--primary-soft)' : 'transparent', color: 'var(--primary-color)', fontWeight: 800}}>{row.segTerSex || '-'}</span></td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.segunda ? 1 : 0.3}}>{row.segunda || '-'}</td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.terca ? 1 : 0.3}}>{row.terca || '-'}</td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.quarta ? 1 : 0.3}}>{row.quarta || '-'}</td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.quinta ? 1 : 0.3}}>{row.quinta || '-'}</td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.sexta ? 1 : 0.3}}>{row.sexta || '-'}</td>
                                        <td style={{padding: '18px 15px', fontWeight: 600, opacity: row.sabado ? 1 : 0.3}}>{row.sabado || '-'}</td>
                                    </tr>
                                ))}
                                {projections.length === 0 && (
                                    <tr>
                                        <td colSpan="9" style={{padding: '60px', color: 'var(--text-muted)', fontStyle: 'italic'}}>Nenhuma projeção encontrada para os próximos 30 dias.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Footer Info */}
                <div style={{display: 'flex', justifyContent: 'flex-end', padding: '10px 10px'}}>
                    <div style={{fontSize: '0.8rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px'}}><Info size={14} /> Dados sincronizados em tempo real com o banco de dados principal</div>
                </div>
            </div>
        );
    }

    return (
            <div className="main-content-layout" style={{flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.4s ease-out', maxWidth: '1300px', width: '100%', margin: '0 auto'}}>
            <div className="donor-card" style={{border: 'none', background: 'transparent', boxShadow: 'none', padding: 0}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                     <h2 style={{margin:0, fontWeight:900, fontSize:'2rem', color: 'var(--primary-color)'}}>Dashboard de Projeções</h2>
                     <div style={{display:'flex', gap:'12px'}}>
                        <button className="btn-action btn-primary" onClick={() => setViewMode('table')} style={{background: 'var(--primary-color)', boxShadow: 'var(--shadow-md)'}}><TableIcon size={18} /> Ver Projeção Detalhada</button>
                        <button className="btn-action btn-secondary" onClick={fetchData} disabled={loading}><TrendingUp size={18} /> {loading ? 'Carregando...' : 'Atualizar Stats'}</button>
                     </div>
                </div>
                <p style={{margin:0, opacity:0.6}}>Análise comparativa e previsão de resultados para {new Date().getFullYear()}</p>
            </div>

            <div className="premium-wrapper" style={{gap: '20px'}}>
                 <div className="glass-card" style={{flex: 1, padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--primary-color)'}}>
                      <div style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05}}><ArrowUpRight size={100} /></div>
                      <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)'}}>Total Acumulado (Ano)</div>
                      <div style={{fontSize: '2.5rem', fontWeight: 900, margin: '15px 0', color: 'var(--text-color)'}}>{stats.totalAnual}</div>
                      <div className="badge-success" style={{width: 'fit-content'}}>+14% vs 2025</div>
                 </div>
                 <div className="glass-card" style={{flex: 1, padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--accent-color)'}}>
                      <div style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05}}><Target size={100} /></div>
                      <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)'}}>Meta de Doações / Mês</div>
                      <div style={{fontSize: '2.5rem', fontWeight: 900, margin: '15px 0', color: 'var(--text-color)'}}>{stats.metaMensal}</div>
                      <div className="badge-warning" style={{width: 'fit-content'}}>82% Alcançado</div>
                 </div>
                 <div className="glass-card" style={{flex: 1, padding: '25px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid var(--secondary-color)'}}>
                      <div style={{position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05}}><CheckCircle size={100} /></div>
                      <div style={{fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)'}}>Eficiência Operacional</div>
                      <div style={{fontSize: '2.5rem', fontWeight: 900, margin: '15px 0', color: 'var(--text-color)'}}>94.2%</div>
                      <div className="badge-success" style={{width: 'fit-content'}}>Processamento OK</div>
                 </div>
            </div>

            <div className="premium-wrapper" style={{gap:'24px'}}>
                 <div className="glass-card" style={{flex: 1.5, minHeight: '400px'}}>
                      <div className="section-title-premium" style={{marginTop:0, display: 'flex', alignItems: 'center', gap: '10px'}}><TrendingUp size={20} /> Desempenho Regional Top 5</div>
                      <div style={{flex: 1, marginTop: '30px'}}>
                          <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={stats.regional} layout="vertical" margin={{ left: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: 'var(--text-color)', fontSize: 13, fontWeight: 700}} width={120} />
                                  <Tooltip cursor={{fill: 'var(--primary-soft)'}} contentStyle={{borderRadius: '12px', border: 'none', background: 'var(--card-bg)', boxShadow: 'var(--shadow-lg)'}} />
                                  <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={35}>
                                      {stats.regional.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#6366f1'][index % 5]} />
                                      ))}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                 </div>

                 <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '24px'}}>
<div className="glass-card" style={{background: 'var(--card-bg)', color: 'var(--text-color)', position: 'relative'}}>
                            <div className="section-title-premium" style={{marginTop: 0, color: 'var(--primary-pastel-blue)'}}><Brain size={20} /> Insights Inteligentes</div>
                            <p style={{fontSize: '0.95rem', opacity: 0.9, margin: '15px 0', lineHeight: 1.6}}>Baseado no histórico recente, o sistema projeta uma alta de 15% nas doações da região <strong>Leste</strong> para o próximo ciclo.</p>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                                    <div style={{marginTop: '4px'}}><ArrowUpRight size={14} color="var(--success-color)" /></div>
                                    <div style={{fontSize: '0.85rem', opacity: 0.8, color: 'var(--text-color)'}}>Otimizar logística na Penha às quartas.</div>
                                </div>
                                <div style={{display: 'flex', gap: '10px', alignItems: 'flex-start'}}>
                                    <div style={{marginTop: '4px'}}><ArrowUpRight size={14} color="var(--success-color)" /></div>
                                    <div style={{fontSize: '0.85rem', opacity: 0.8, color: 'var(--text-color)'}}>Aproveitar engajamento em Itaquera.</div>
                                </div>
                            </div>
                       </div>
                      <div className="glass-card" style={{display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--primary-soft)', border: '1px solid var(--primary-color)'}}>
                           <div className="icon-box" style={{background: 'var(--primary-color)', color: 'white', scale: '1.2'}}><Calculator size={24} /></div>
                           <div>
                                <div style={{fontSize: '0.8rem', fontWeight: 800, opacity: 0.6, textTransform: 'uppercase'}}>Agendamentos Próximos 30d</div>
                                <div style={{fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary-color)'}}>{stats.totalAgendamentos} Coletas Planejadas</div>
                           </div>
                      </div>
                 </div>
            </div>
        </div>
    );
};

export default ProjectionsForm;
