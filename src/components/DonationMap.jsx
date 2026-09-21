import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Navigation, Info, Package, MapPin, Printer, RefreshCw, User, Phone, Clock, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toDatePart } from '../utils/date';

const DonationMap = () => {
    const [range, setRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Estado para o dia selecionado e detalhes
    const [selectedDateStr, setSelectedDateStr] = useState(null);
    const [selectedDayDonations, setSelectedDayDonations] = useState([]);

    // Feriados Nacionais 2026
    const holidays = ['2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25'];

    // Função crucial para formatar a data sem erro de fuso horário
    const formatDisplayDateCorrectly = (dStr) => {
        if (!dStr) return '';
        const [year, month, day] = dStr.split('-');
        return `${day}/${month}/${year}`;
    };

    const fetchRangeDonations = useCallback(async () => {
        if (!range.start || !range.end) return;
        setLoading(true);

        try {
            // Buscamos doações que não foram dadas baixas nem canceladas
            const { data, error } = await supabase
                .from('doacoes')
                .select('*, doadores(*)')
                .not('status', 'in', '("Baixada","Cancelada")')
                .or(`data_retirada.gte.${range.start},remarcado_para.gte.${range.start}`)
                .order('data_retirada', { ascending: true })
                .limit(2000);

            if (error) throw error;
            
            const filtered = (data || []).filter(don => {
                const effectiveDate = toDatePart(don.status === 'Remarcada' && don.remarcado_para ? don.remarcado_para : don.data_retirada);
                return effectiveDate >= range.start && effectiveDate <= range.end;
            });

            setDonations(filtered);
            
            if (selectedDateStr) {
                const dayFiltered = filtered.filter(don => {
                    const effectiveDate = toDatePart(don.status === 'Remarcada' && don.remarcado_para ? don.remarcado_para : don.data_retirada);
                    return effectiveDate === selectedDateStr;
                });
                setSelectedDayDonations(dayFiltered);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [range, selectedDateStr]);

    useEffect(() => {
        fetchRangeDonations();
    }, [fetchRangeDonations]);

    const handleDayClick = (dateStr) => {
        setSelectedDateStr(dateStr);
        const dayFiltered = donations.filter(don => {
            const effectiveDate = toDatePart(don.status === 'Remarcada' && don.remarcado_para ? don.remarcado_para : don.data_retirada);
            return effectiveDate === dateStr;
        });
        setSelectedDayDonations(dayFiltered);
    };

    const getCalendarDays = () => {
        if (!range.start || !range.end) return [];
        const start = new Date(range.start + 'T12:00:00');
        const end = new Date(range.end + 'T12:00:00');
        const days = [];
        let datePtr = new Date(start);
        
        while (datePtr <= end) {
            const dayOfWeek = datePtr.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                days.push(new Date(datePtr));
            }
            datePtr.setDate(datePtr.getDate() + 1);
        }
        return days;
    };

    const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    return (
        <div className="main-content-layout" style={{flexDirection: 'column'}}>
            <style dangerouslySetInnerHTML={{ __html: `
                .premium-wrapper { display: flex; gap: 20px; align-items: flex-start; width: 100%; }
                .map-grid-side { 
                    display: grid; 
                    grid-template-columns: repeat(5, 1fr); 
                    gap: 12px; 
                    flex: 1.2;
                }
                .side-panel { 
                    width: 440px; 
                    flex-shrink: 0; 
                    position: sticky; 
                    top: 0; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 20px; 
                }
                
                .day-column-header {
                    text-align: center; font-weight: 800; font-size: 0.7rem; 
                    text-transform: uppercase; color: var(--primary-color);
                    padding: 10px 0;
                }

                .day-cell { 
                    background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 12px; 
                    min-height: 160px; padding: 10px; cursor: pointer; transition: all 0.2s;
                    display: flex; flex-direction: column;
                }
                .day-cell:hover { border-color: var(--primary-color); background: var(--card-bg); transform: translateY(-3px); }
                .day-cell.active { border: 2.5px solid var(--primary-color); background: var(--primary-soft); box-shadow: var(--shadow-md); }
                .day-cell.holiday { background: rgba(239, 68, 68, 0.05); border-color: #fca5a5; }

                .day-num { font-weight: 900; opacity: 0.2; font-size: 1.1rem; margin-bottom: 5px; }

                .mini-card { 
                    background: var(--card-bg); padding: 5px 8px; border-radius: 6px; 
                    font-size: 0.65rem; border: 1px solid var(--border-color); margin-bottom: 4px; 
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .mini-card strong { color: var(--primary-color); }
                
                .detail-donation-entry { 
                    padding: 18px; border-radius: 14px; border: 1px solid var(--border-color); 
                    background: var(--card-bg); margin-bottom: 15px; border-left: 6px solid var(--primary-color);
                    box-shadow: var(--shadow-sm);
                }
                
                @media print { .side-panel, .no-print { display: none !important; } .map-grid-side { grid-template-columns: repeat(5, 1fr); } }
                @media (max-width: 1400px) { .premium-wrapper { flex-direction: column; } .side-panel { width: 100%; position: static; } }
            `}} />

            <div className="donor-card">
                <div className="donor-header no-print">
                    <div className="icon-box" style={{background: 'var(--primary-color)', color: 'white'}}><Calendar size={28} /></div>
                    <div>
                        <h2 style={{margin:0, fontWeight:900, fontSize:'1.5rem'}}>Mapa de Coletas (Roteiro)</h2>
                        <p style={{margin:0, opacity:0.6}}>Planejamento semanal (Segunda a Sexta)</p>
                    </div>
                    
                    <div style={{marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center'}}>
                        <div className="range-selector" style={{display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--input-bg)', padding: '5px 15px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                            <div className="form-group" style={{marginBottom:0}}>
                                <label style={{fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', opacity:0.6}}>Início</label>
                                <input type="date" className="input-field" style={{padding: '4px 8px', fontSize:'0.8rem'}} value={range.start} onChange={e => setRange({...range, start: e.target.value})} />
                            </div>
                            <span style={{opacity:0.4, marginTop:'15px'}}>→</span>
                            <div className="form-group" style={{marginBottom:0}}>
                                <label style={{fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', opacity:0.6}}>Fim</label>
                                <input type="date" className="input-field" style={{padding: '4px 8px', fontSize:'0.8rem'}} value={range.end} onChange={e => setRange({...range, end: e.target.value})} />
                            </div>
                        </div>
                        </div>
                    </div>

                <div className="premium-wrapper">
                    <div className="map-grid-side">
                        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map(d => <div key={d} className="day-column-header">{d}</div>)}
                        {getCalendarDays().map((date, i) => {
                            const dStr = date.toISOString().split('T')[0];
                            const isHoliday = holidays.includes(dStr);
                            const dayDonations = donations.filter(don => {
                                const effectiveDate = toDatePart(don.status === 'Remarcada' && don.remarcado_para ? don.remarcado_para : don.data_retirada);
                                return effectiveDate === dStr;
                            });
                            
                            return (
                                <div key={i} className={`day-cell ${selectedDateStr === dStr ? 'active' : ''} ${isHoliday ? 'holiday' : ''}`} onClick={() => handleDayClick(dStr)}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                        <div style={{display:'flex', flexDirection:'column'}}>
                                            <span className="day-num">{date.getDate()}</span>
                                            <span style={{fontSize:'0.55rem', opacity:0.4, marginTop:'-5px', fontWeight:800}}>{months[date.getMonth()].substring(0,3)}</span>
                                        </div>
                                        {dayDonations.length > 0 && <span className="badge" style={{background: 'var(--primary-color)', color: 'white', fontSize: '0.65rem', fontWeight: 900}}>{dayDonations.length}</span>}
                                    </div>
                                    <div style={{flex: 1, overflow: 'hidden'}}>
                                        {dayDonations.slice(0, 4).map((don, idx) => (
                                            <div key={idx} className="mini-card"><strong>{don.doadores?.nome?.split(' ')[0]} {don.doadores?.nome?.split(' ')[1] || ''}</strong></div>
                                        ))}
                                        {dayDonations.length > 4 && <div style={{fontSize: '0.6rem', textAlign: 'center', opacity: 0.5}}>+ {dayDonations.length - 4} mais...</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="side-panel">
                        <div className="glass-card" style={{padding: '25px', minHeight: '520px', borderLeft: '1px solid var(--border-color)'}}>
                            <div className="section-title-premium" style={{marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Info size={18} /> Detalhes do Dia</div>
                                {selectedDateStr && (
                                    <span className="badge" style={{fontSize: '0.85rem', background: 'var(--primary-color)', color: 'white', fontWeight: 800}}>
                                        {formatDisplayDateCorrectly(selectedDateStr)}
                                    </span>
                                )}
                            </div>

                            {selectedDayDonations.length > 0 ? (
                                <div style={{maxHeight: '700px', overflowY: 'auto', paddingRight: '8px', marginTop: '15px'}}>
                                    {selectedDayDonations.map((don, i) => (
                                        <div key={i} className="detail-donation-entry">
                                            <div style={{fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-color)', marginBottom: '10px'}}>{don.doadores?.nome}</div>
                                            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', opacity: 0.9}}>
                                                <div style={{display: 'flex', gap: '10px'}}><MapPin size={16} style={{color: 'var(--primary-color)', flexShrink: 0}} /> {don.doadores?.logradouro}, {don.doadores?.endereco}</div>
                                                <div style={{display: 'flex', gap: '10px'}}><Navigation size={15} style={{opacity: 0.5}} /> {don.doadores?.bairro} • {don.doadores?.regiao}</div>
                                                <div style={{display: 'flex', gap: '10px'}}><Phone size={15} style={{color: 'var(--success-color)'}} /> {don.doadores?.celular || '—'} / {don.doadores?.fixo || '—'}</div>
                                                <div style={{display: 'flex', gap: '10px', fontWeight: 700}}><Clock size={15} style={{color: 'var(--warning-color)'}} /> Cód: {don.codigo_doacao} {don.doadores?.mapa ? ` • Mapa: ${don.doadores.mapa}` : ''}</div>
                                            </div>
                                            {don.observacoes && (
                                                <div style={{marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '0.8rem', lineHeight: '1.4'}}>
                                                    <strong>Obs/Roteiro:</strong> {don.observacoes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{textAlign: 'center', opacity: 0.4, marginTop: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'}}>
                                    <Package size={64} />
                                    <div>
                                        <h4 style={{margin: 0}}>Nenhuma Doação</h4>
                                        <p style={{fontSize: '0.8rem', marginTop: '5px'}}>Selecione um dia com coletas na grade para ver os detalhes.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {loading && <div style={{position:'fixed', bottom:'20px', right:'20px'}}><RefreshCw size={24} className="animate-spin" /></div>}
        </div>
    );
};

export default DonationMap;
