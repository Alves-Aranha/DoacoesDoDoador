import React, { useState, useEffect, useCallback } from 'react';
import { Search, Save, Trash2, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, SkipBack, SkipForward, X, Ban, Clock, Check, Package, FileText, Info, Shield, RefreshCcw, Calendar, User, Printer, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { toDatePart } from '../utils/date';
import FichaDoacaoModal from './FichaDoacaoModal';
import ComunicacaoInternaModal from './ComunicacaoInternaModal';
import ComunicacaoInternaTransportesModal from './ComunicacaoInternaTransportesModal';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const DonationStatusForm = () => {
    const [searchDonorCode, setSearchDonorCode] = useState('');
    const [searchDonationCode, setSearchDonationCode] = useState('');
    const [donations, setDonations] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [formData, setFormData] = useState({ 
        codigo: '', codigo_doador: '', doador_nome: '', data_doacao: '', 
        status: '', observacoes: '', itens: [], data_retirada: '', 
        remarcado_para: '', data_cancelamento: '', responsavel: '' 
    });
    const [cancelReason, setCancelReason] = useState('');
    
    const [selectedAction, setSelectedAction] = useState(null); 
    const [isStatusAppliedToCard, setIsStatusAppliedToCard] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [toast, setToast] = useState(null);
    const [showCIModal, setShowCIModal] = useState(false);
    const { user, perfil } = useAuth();

    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    const fetchDonations = useCallback(async (donorCode = '', donationCode = '') => {
        setSearching(true);
        try {
            let sQuery = supabase.from('doacoes').select('*, doadores(*)').order('codigo_doacao', { ascending: false });
            if (donationCode) {
                const paddedDon = donationCode.trim().padStart(6, '0');
                sQuery = sQuery.eq('codigo_doacao', paddedDon);
            } else if (donorCode) {
                const paddedDonor = donorCode.trim().padStart(6, '0');
                sQuery = sQuery.eq('codigo_doador', paddedDonor);
            } else { 
                sQuery = sQuery.limit(20); 
            }

            const { data, error } = await sQuery;
            if (error) throw error;
            const codes = data.map(d => d.codigo_doacao);
            if (codes.length > 0) {
                const { data: allItens } = await supabase.from('itens_doacao').select('*').in('id_doacao', codes);
                const itensByCode = {};
                (allItens || []).forEach(item => {
                    if (!itensByCode[item.id_doacao]) itensByCode[item.id_doacao] = [];
                    itensByCode[item.id_doacao].push(item);
                });
                data.forEach(d => { d.itens_doacao = itensByCode[d.codigo_doacao] || []; });
            }
            const mapped = data.filter(d => d.doadores).map(d => ({
                codigo: d.codigo_doacao, codigo_doacao: d.codigo_doacao, codigo_doador: d.codigo_doador, doador_nome: d.doadores.nome, 
                doador_endereco: `${d.doadores.logradouro || ''} ${d.doadores.endereco || ''}`.trim(),
                doador_complemento: d.doadores.complemento || '',
                doador_bairro: d.doadores.bairro || '',
                doadores: d.doadores,
                data_doacao: d.data_doacao,
                created_at: d.created_at,
                data_retirada: d.data_retirada, data_baixa: d.data_baixa, data_cancelamento: d.data_cancelamento,
                remarcado_para: d.remarcado_para, status: d.status, observacoes: d.observacoes || '', itens: d.itens_doacao || [],
                responsavel: d.responsavel || ''
            }));
            setDonations(mapped);
            if (mapped.length > 0) { 
                setCurrentIndex(0); 
                setFormData(mapped[0]);
                setSelectedAction(null);
                setIsStatusAppliedToCard(false);
                setCancelReason('');
            } else { 
                setCurrentIndex(-1); 
                setFormData({ codigo: '', codigo_doador: '', doador_nome: '', data_doacao: '', status: '', observacoes: '', itens: [], responsavel: '' });
                setSelectedAction(null);
                setIsStatusAppliedToCard(false);
                setCancelReason('');
                if (donorCode || donationCode) {
                    if (donationCode) {
                        showToast('Doação não encontrada.', 'error');
                    } else {
                        const { data: donorCheck } = await supabase
                            .from('doadores')
                            .select('codigo_doador, nome')
                            .eq('codigo_doador', parseInt(String(donorCode).trim(), 10))
                            .maybeSingle();
                        if (donorCheck) {
                            showToast(`Doador ${donorCheck.nome} encontrado, mas sem doações registradas.`, 'error');
                        } else {
                            showToast('Doador não encontrado.', 'error');
                        }
                    }
                }
            }
        } catch (err) { showToast('Erro ao buscar doações.', 'error'); } finally { setSearching(false); }
    }, [showToast]);

    useEffect(() => {
        if (currentIndex >= 0 && donations[currentIndex]) {
            setFormData(donations[currentIndex]);
            setSelectedAction(null);
            setIsStatusAppliedToCard(false);
            setCancelReason('');
        }
    }, [currentIndex, donations]);

    const handleApplyStatusToCard = () => {
        if (!selectedAction) {
            showToast('Selecione primeiro uma ação (Baixar, Remarcar ou Cancelar).', 'error');
            return;
        }

        if (selectedAction === 'Baixar' && (!formData.data_baixa || formData.data_baixa.trim() === '')) {
            showToast('A Data de Baixa é obrigatória para esta ação.', 'error');
            return;
        }
        if (selectedAction === 'Remarcada' && (!formData.remarcado_para || formData.remarcado_para.trim() === '')) {
            showToast('A Data de Remarcação é obrigatória para esta ação.', 'error');
            return;
        }
        if (selectedAction === 'Cancelada' && (!formData.data_cancelamento || formData.data_cancelamento.trim() === '')) {
            showToast('A Data de Cancelamento é obrigatória para esta ação.', 'error');
            return;
        }

        setIsStatusAppliedToCard(true);
        showToast(`Status visual atualizado! Agora você pode Gravar.`, 'success');
    };

    const handleSave = async () => {
        if (!formData.codigo) {
            showToast('Selecione uma doação primeiro.', 'error');
            return;
        }

        if (!isStatusAppliedToCard) {
            showToast('Siga a sequência: Ação -> Datas -> Obs -> Alterar Card -> Gravar.', 'error');
            return;
        }

        if (selectedAction === 'Baixar' && (!formData.data_baixa || formData.data_baixa.trim() === '')) {
            showToast('A Data de Baixa é obrigatória para esta ação.', 'error');
            return;
        }
        if (selectedAction === 'Remarcada' && (!formData.remarcado_para || formData.remarcado_para.trim() === '')) {
            showToast('A Data de Remarcação é obrigatória para esta ação.', 'error');
            return;
        }
        if (selectedAction === 'Cancelada' && (!formData.data_cancelamento || formData.data_cancelamento.trim() === '')) {
            showToast('A Data de Cancelamento é obrigatória para esta ação.', 'error');
            return;
        }

        const finalStatus = selectedAction === 'Baixar' ? 'Baixada' : selectedAction;
        let finalObservacoes = formData.observacoes || '';

        if (finalStatus === 'Cancelada') {
            if (!cancelReason || cancelReason.trim() === '') {
                showToast('Para cancelar, o motivo do cancelamento deve ser preenchido.', 'error');
                return;
            }
            const dateStr = new Date().toLocaleDateString('pt-BR');
            const cancelText = `[Cancelado em ${dateStr}]: ${cancelReason.trim()}`;
            finalObservacoes = finalObservacoes.trim() 
                ? `${finalObservacoes.trim()}\n\n${cancelText}`
                : cancelText;
        }

        setLoading(true);
        try {
            const updates = { 
                status: finalStatus, 
                observacoes: finalObservacoes,
                responsavel: formData.responsavel,
                data_retirada: formData.data_retirada || null,
                data_baixa: (finalStatus === 'Baixada') ? (formData.data_baixa || new Date().toISOString().split('T')[0]) : null,
                data_cancelamento: formData.data_cancelamento || null,
                remarcado_para: formData.remarcado_para || null
            };

            const { error } = await supabase.from('doacoes').update(updates).eq('codigo_doacao', formData.codigo);
            if (error) throw error;

            await registerLog({
                usuario_email: user?.email || '',
                acao: 'Alteração',
                modulo: 'Status Doações',
                detalhes: `Status atualizado: ${finalStatus} (Doação ${formData.codigo})`
            });

            showToast(`Dados gravados com sucesso!`);
            
            // Atualiza o estado local imediatamente para refletir na impressão sem precisar de novo clique
            setFormData(prev => ({
                ...prev,
                ...updates,
                status: finalStatus
            }));
            
            fetchDonations(searchDonorCode, searchDonationCode);
        } catch (err) { 
            console.error(err);
            showToast('Erro ao gravar no banco.', 'error'); 
        } finally { setLoading(false); }
    };

    const cardStatus = isStatusAppliedToCard ? (selectedAction === 'Baixar' ? 'Baixada' : selectedAction) : (formData.status || 'Pendente');

    return (
        <div className="main-content-layout" style={{flexDirection: 'column'}}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {showCIModal && <ComunicacaoInternaTransportesModal donation={formData} onClose={() => setShowCIModal(false)} />}

            <div className="status-card">

                <div className="nav-bar">
                    <div className="nav-controls">
                        <button className="btn-nav" onClick={() => setCurrentIndex(0)} disabled={currentIndex <= 0}><SkipBack size={18} /></button>
                        <button className="btn-nav" onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex <= 0}><ChevronLeft size={18} /></button>
                        <span className="nav-counter">{donations.length === 0 ? '0/0' : `${currentIndex + 1} / ${donations.length}`}</span>
                        <button className="btn-nav" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={currentIndex >= donations.length - 1}><ChevronRight size={18} /></button>
                        <button className="btn-nav" onClick={() => setCurrentIndex(donations.length - 1)} disabled={currentIndex >= donations.length - 1}><SkipForward size={18} /></button>
                    </div>
                    <div style={{display: 'flex', gap: '10px', flex: 1}}>
                        <div style={{position: 'relative', flex: 1}}>
                            <Search size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                            <input className="input-field" style={{paddingLeft: '38px', width: '100%'}} placeholder="Cód. Doador" value={searchDonorCode} onChange={e => {setSearchDonorCode(e.target.value.replace(/\D/g, '')); setSearchDonationCode('');}} onKeyDown={e => e.key === 'Enter' && fetchDonations(searchDonorCode, searchDonationCode)} />
                        </div>
                        <div style={{position: 'relative', flex: 1}}>
                            <Search size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                            <input className="input-field" style={{paddingLeft: '38px', width: '100%'}} placeholder="Cód. Doação" value={searchDonationCode} onChange={e => {setSearchDonationCode(e.target.value.replace(/\D/g, '')); setSearchDonorCode('');}} onKeyDown={e => e.key === 'Enter' && fetchDonations(searchDonorCode, searchDonationCode)} />
                        </div>
                        <button className="btn-action btn-primary" style={{height: '45px', padding: '0 15px'}} onClick={() => fetchDonations(searchDonorCode, searchDonationCode)} disabled={searching}>
                            <Search size={18} /> Filtrar
                        </button>
                        <button className="btn-action btn-secondary" style={{height: '45px', padding: '0 15px'}} onClick={() => {setSearchDonorCode(''); setSearchDonationCode(''); fetchDonations('', '');}} disabled={searching}>
                            <RefreshCcw size={18} /> Limpar
                        </button>
                    </div>
                </div>

                <div className="premium-wrapper">
                    <div className="glass-card" style={{flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        
                        <div className="section-title-premium" style={{marginTop: 0}}>1. Selecione a Ação</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className={`btn-action ${selectedAction === 'Baixar' ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1, padding: '15px' }} onClick={() => setSelectedAction('Baixar')}><CheckCircle size={20} /> Baixar (Retirada)</button>
                            <button className={`btn-action ${selectedAction === 'Remarcada' ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, background: selectedAction === 'Remarcada' ? '#6366f1' : '' }} onClick={() => setSelectedAction('Remarcada')}><RefreshCcw size={20} /> Remarcar</button>
                            <button className={`btn-action ${selectedAction === 'Cancelada' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1 }} onClick={() => setSelectedAction('Cancelada')}><Ban size={20} /> Cancelar</button>
                        </div>

                        {formData.doador_nome && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '5px' }}>
                                <User size={20} style={{ color: 'var(--primary-color)' }} />
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-color)', opacity: 0.8 }}>Doador Selecionado</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-color)' }}>{formData.doador_nome}</div>
                                </div>
                            </div>
                        )}

                        <div className="section-title-premium">2. Datas</div>
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px'}}>
                            <div className="form-group"><label style={{fontSize: '0.65rem', opacity: 0.7}}>Data Solicitação</label><input type="date" className="input-field" value={new Date().toLocaleDateString('en-CA')} disabled style={{opacity: 0.6, fontSize: '0.8rem'}} /></div>
                            <div className="form-group"><label style={{fontSize: '0.65rem', opacity: 0.7}}>Data Retirada</label><input type="date" className="input-field" value={formData.data_retirada ? toDatePart(formData.data_retirada) : ''} disabled style={{opacity: 0.6, fontSize: '0.8rem'}} /></div>
                            <div className="form-group"><label style={{fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--success-color)'}}>Data Baixa</label><input type="date" className="input-field" value={formData.data_baixa ? toDatePart(formData.data_baixa) : ''} onChange={e => setFormData({...formData, data_baixa: e.target.value})} disabled={selectedAction !== 'Baixar'} /></div>
                            <div className="form-group"><label style={{fontSize: '0.65rem'}}>Remarcar</label><input type="date" className="input-field" value={formData.remarcado_para ? toDatePart(formData.remarcado_para) : ''} onChange={e => setFormData({...formData, remarcado_para: e.target.value})} disabled={selectedAction !== 'Remarcada'} /></div>
                            <div className="form-group"><label style={{fontSize: '0.65rem'}}>Cancelamento</label><input type="date" className="input-field" value={formData.data_cancelamento ? toDatePart(formData.data_cancelamento) : ''} onChange={e => setFormData({...formData, data_cancelamento: e.target.value})} disabled={selectedAction !== 'Cancelada'} /></div>
                        </div>

                        <div className="section-title-premium">3. Observações e Responsável</div>
                        <div style={{display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '10px'}}>
                            <textarea className="input-field" style={{minHeight: '60px', height: '100%'}} value={formData.observacoes} onChange={e => setFormData({...formData, observacoes: e.target.value})} placeholder="Observações gerais da doação..." />
                            
                            <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                                <label style={{fontSize: '0.75rem'}}>Responsável Atual</label>
                                <div style={{position: 'relative', flex: 1}}>
                                    <User size={16} style={{position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4}} />
                                    <input className="input-field" style={{paddingLeft: '40px', height: '100%', width: '100%'}} value={formData.responsavel || ''} onChange={e => setFormData({...formData, responsavel: e.target.value})} placeholder="Nome do responsável..." />
                                </div>
                            </div>
                        </div>

                        {selectedAction === 'Cancelada' && (
                            <div style={{marginTop: '15px'}}>
                                <label style={{fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--danger-color)'}}>Motivo do Cancelamento (Obrigatório)</label>
                                <textarea className="input-field" style={{minHeight: '60px', borderColor: 'var(--danger-color)'}} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Informe o motivo do cancelamento..." />
                            </div>
                        )}

                        <div style={{marginTop: '10px', display: 'flex', gap: '15px'}}>
                            <button className="btn-action btn-primary" style={{flex: 1, height: '50px', background: isStatusAppliedToCard ? '#10b981' : '#f59e0b'}} onClick={handleApplyStatusToCard} disabled={!selectedAction}>
                                <ArrowRight size={20} /> ALTERAR CARD DE STATUS
                            </button>
                            <button className="btn-action btn-success" style={{flex: 1, height: '50px', fontWeight: 900}} onClick={handleSave} disabled={loading || !isStatusAppliedToCard}>
                                <Save size={20} /> GRAVAR DADOS
                            </button>
                        </div>
                    </div>

                    <div style={{width: '350px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        <div className="glass-card" style={{
                            background: cardStatus === 'Baixada' ? 'var(--success-color)' : (cardStatus === 'Cancelada' ? 'var(--danger-color)' : (cardStatus === 'Remarcada' ? 'var(--primary-color)' : 'var(--warning-color)')), 
                            color: 'white', minHeight: '100px', display: 'flex', alignItems: 'center', gap: '15px'
                        }}>
                            <div style={{background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px'}}><Info size={24} /></div>
                            <div>
                                <div style={{fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700}}>Status Atual</div>
                                <div style={{fontSize: '1.4rem', fontWeight: 900}}>{cardStatus}</div>
                            </div>
                        </div>

                        <div className="glass-card" style={{flex: 1}}>
                            <div className="section-title-premium" style={{marginTop: 0}}><Package size={16} /> Itens</div>
                            <div className="table-container" style={{maxHeight: '200px', overflowY: 'auto'}}>
                                <table className="donation-items-table">
                                    <thead><tr><th>Item</th><th>Qtd</th></tr></thead>
                                    <tbody>
                                        {formData.itens && formData.itens.length > 0 ? formData.itens.map((it, i) => (
                                            <tr key={i}><td>{it.item}</td><td style={{textAlign: 'center'}}>{it.qtde}</td></tr>
                                        )) : <tr><td colSpan={2} style={{textAlign: 'center', padding: '20px', opacity: 0.5}}>Vazio.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            {/* Botão de Impressão (Garantindo que apareça no Dev) */}
                            <div style={{marginTop: '20px'}}>
                                <button className="btn-action btn-primary" style={{width: '100%', background: '#d97706'}} onClick={() => setShowCIModal(true)} disabled={!formData.codigo}>
                                    <Printer size={20} /> IMPRIMIR CI
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonationStatusForm;
