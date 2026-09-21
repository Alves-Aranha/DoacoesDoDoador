import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Users, Calendar, CheckCircle, Package, AlertTriangle, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { toLocalIsoDate, toDatePart } from '../utils/date';

const Dashboard = ({ onNavigateToProjections }) => {
    const { isTransportes } = useAuth();
    const [stats, setStats] = useState({ totalDoadores: 0, doacoesHoje: 0, doacoesBaixadas: 0, volumeMensal: [], itensEstoque: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async (manual = false) => {
        console.log('Dashboard: Fetching stats...');
        if (manual) setRefreshing(true);
        try {
            // Contagem exata de Doadores
            const { count: doadores } = await supabase
                .from('doadores')
                .select('*', { count: 'exact', head: true });

            // Doações em aberto (Pendentes / Remarcadas - não baixadas e não canceladas)
            const { data: doacoesAbertas, error: doacoesErr } = await supabase
                .from('doacoes')
                .select('codigo_doacao, status, data_retirada, remarcado_para, data_doacao');

            let coletasAbertasHoje = 0;
            if (doacoesAbertas && !doacoesErr) {
                const hoje = toLocalIsoDate();
                // Apenas doações Pendentes e Remarcadas contam como coletas em aberto
                const abertas = doacoesAbertas.filter(d => {
                    const s = (d.status || '').toString().toLowerCase().trim();
                    return s === 'pendente' || s === 'remarcada';
                });
                // Coletas do dia de hoje (prioriza data remarcada sobre a de retirada)
                coletasAbertasHoje = abertas.filter(d => toDatePart(d.status === 'Remarcada' && d.remarcado_para ? d.remarcado_para : d.data_retirada) === hoje).length;
            }

            // Contagem exata de doações baixadas
            const { count: baixadas } = await supabase
                .from('doacoes')
                .select('*', { count: 'exact', head: true })
                .or('status.eq.Baixada,status.eq.Baixado');

            // Contagem exata de tipos no estoque
            const { count: itens } = await supabase
                .from('itens')
                .select('*', { count: 'exact', head: true });

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const minDate = toLocalIsoDate(sixMonthsAgo);
            const { data: mensal, error: mensalErr } = await supabase.from('doacoes')
                .select('data_doacao')
                .gte('data_doacao', minDate)
                .limit(500);

            let chartData = [];
            if (mensal && !mensalErr) {
                const grouped = mensal.reduce((acc, curr) => {
                    try {
                        if (!curr.data_doacao) return acc;
                        const datePart = toDatePart(curr.data_doacao);
                        if (!datePart) return acc;
                        const [year, month] = datePart.split('-').map(Number);
                        if (!year || !month) return acc;
                        const monthName = new Date(year, month - 1, 1).toLocaleString('pt-BR', { month: 'short' });
                        acc[monthName] = (acc[monthName] || 0) + 1;
                    } catch (e) { console.error('Error processing date:', e); }
                    return acc;
                }, {});
                chartData = Object.entries(grouped).map(([name, total]) => ({ name, total }));
            }

            setStats({
                totalDoadores: doadores || 0,
                doacoesHoje: coletasAbertasHoje,
                doacoesAbertoHoje: coletasAbertasHoje,
                doacoesBaixadas: baixadas || 0,
                volumeMensal: chartData,
                itensEstoque: itens || 0
            });
        } catch (e) {
            console.error('Final Dashboard Error:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        console.log('Dashboard mounted');
        fetchStats();
        // Realtime removido: cada aba mantinha um socket aberto e disparamos
        // reconsultas a cada alteração no banco, esgotando recursos no plano free.
        // Use o botão "Atualizar" para recarregar manualmente.
    }, [fetchStats]);

    return (
        <div className="main-content-layout" style={{flexDirection: 'column', gap: '30px'}}>

            <div className="premium-wrapper" style={{justifyContent: 'flex-end', gap: '12px', marginTop: '-10px'}}>
                <button
                    className="btn-action btn-secondary"
                    style={{width: 'auto'}}
                    onClick={() => fetchStats(true)}
                    disabled={refreshing || loading}
                    title="Recarregar estatísticas"
                >
                    <RefreshCw size={16} className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
            </div>

            <div className="premium-wrapper" style={{gap: '20px', flexWrap: 'wrap'}}>
                <div className="dashboard-card card-blue" style={{flex: '1 1 240px'}}>
                    <div className="dash-icon"><Users size={24} /></div>
                    <div className="dash-info"><h3>Total de Doadores</h3><p>{stats.totalDoadores}</p></div>
                </div>
                <div className="dashboard-card card-orange" style={{flex: '1 1 240px'}}>
                    <div className="dash-icon"><Calendar size={24} /></div>
                    <div className="dash-info"><h3>Coletas para Hoje</h3><p>{stats.doacoesHoje}</p></div>
                </div>
                <div className="dashboard-card card-green" style={{flex: '1 1 240px'}}>
                    <div className="dash-icon"><CheckCircle size={24} /></div>
                    <div className="dash-info"><h3>Total Baixadas</h3><p>{stats.doacoesBaixadas}</p></div>
                </div>
                <div className="dashboard-card card-purple" style={{flex: '1 1 240px'}}>
                    <div className="dash-icon"><Package size={24} /></div>
                    <div className="dash-info"><h3>Tipos no Estoque</h3><p>{stats.itensEstoque}</p></div>
                </div>
            </div>

            <div className="premium-wrapper" style={{gap: '30px'}}>
                <div className="glass-card" style={{flex: 1.5, minHeight: '400px', display: 'flex', flexDirection: 'column'}}>
                     <div className="section-title-premium" style={{marginTop: 0}}><TrendingUp size={16} /> Fluxo Mensal de Doações</div>
                     <div style={{flex: 1, marginTop: '20px'}}>
                         <ResponsiveContainer width="100%" height={320}>
                             <AreaChart data={stats.volumeMensal}>
                                 <defs>
                                     <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                         <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                                         <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                                     </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                 <YAxis axisLine={false} tickLine={false} tick={{fill: 'var(--text-muted)', fontSize: 12}} />
                                 <Tooltip contentStyle={{borderRadius: '12px', border: 'none', background: 'var(--card-bg)', boxShadow: 'var(--shadow-lg)'}} />
                                 <Area type="monotone" dataKey="total" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                             </AreaChart>
                         </ResponsiveContainer>
                     </div>
                </div>

                <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '30px'}}>
                    <div className="glass-card">
                         <div className="section-title-premium" style={{marginTop: 0}}><AlertTriangle size={16} /> Pendências de Coleta</div>
                          <div style={{margin: '20px 0', textAlign: 'center'}}>
                               <div style={{fontSize: '3rem', fontWeight: 900, color: 'var(--danger-color)'}}>{stats.doacoesAbertoHoje || 0}</div>
                               <div style={{fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: 700}}>Coletas em Aberto para Hoje</div>
                          </div>
                         <button
                            className="btn-action btn-primary"
                            style={{width: '100%', opacity: isTransportes ? 0.5 : 1, cursor: isTransportes ? 'not-allowed' : 'pointer'}}
                            onClick={() => onNavigateToProjections('table')}
                            disabled={isTransportes}
                            title={isTransportes ? 'Acesso não permitido para o Departamento de Transportes' : ''}
                         >
                            Verificar Logística <ArrowRight size={16} />
                         </button>
                    </div>

                    <div className="glass-card" style={{background: 'var(--primary-soft)', border: '1px solid var(--primary-color)'}}>
                         <div className="section-title-premium" style={{marginTop: 0, color: 'var(--primary-color)'}}><Users size={16} /> Novos Doadores</div>
                         <p style={{fontSize: '0.85rem', margin: '15px 0'}}>Base de dados em expansão. +12% em relação ao mês anterior.</p>
                         <div style={{display: 'flex', gap: '5px'}}>
                              {[1,2,3,4,5].map(i => <div key={i} style={{width:'32px', height:'32px', borderRadius:'50%', background:'var(--card-bg)', border:'2px solid white', marginLeft: i > 1 ? '-10px' : '0'}} />)}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;