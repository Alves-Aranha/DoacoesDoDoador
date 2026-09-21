import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Trash2, Save, Edit2, SkipBack, SkipForward, ChevronLeft, ChevronRight, Plus, X, CheckCircle, AlertTriangle, FileText, User, Users, MapPin, Phone, Mail, Clock, Shield, RefreshCcw, Truck, Zap } from 'lucide-react';
import { api } from '../api';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import FichaModal from './FichaModal';
import QuickPrintModal from './QuickPrintModal';

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


const DonorForm = ({ onNavigateToDoacoes, onNavigateToAlterarDoacoes }) => {
    const { user, perfil, isTransportes } = useAuth();
    const canEdit = !isTransportes;
    const initialFormState = {
        codigo: '', nome: '', celular: '', whatsapp: '', fixo: '', email: '',
        contato: 'O mesmo', cep: '', logradouro: '', endereco: '', complemento: '', bairro: '',
        cidade: '', estado: '', tipo: '', regiao: '', dia_semana: '', mapa: '', cod_tlmk: '', cod_matcob: '', dataCadastro: '', historico: ''
    };

    const [formData, setFormData] = useState(initialFormState);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [showFichaModal, setShowFichaModal] = useState(false);

    const [duplicateDonors, setDuplicateDonors] = useState([]);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    const [searchCode, setSearchCode] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchCep, setSearchCep] = useState('');
    const [searchTel, setSearchTel] = useState('');
    const [searchTlmk, setSearchTlmk] = useState('');
    const [searchMatcob, setSearchMatcob] = useState('');
    const [showQuickPrint, setShowQuickPrint] = useState(false);

    // ── Lista Suspensa Inteligente de Endereços ──
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
    const enderecoInputRef = useRef(null);
    const complementoInputRef = useRef(null);
    const addressDropdownRef = useRef(null);
    const searchTimerRef = useRef(null);


    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    const maskCep = (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    const maskPhone = (value) => {
        const n = value.replace(/\D/g, '');
        if (n.length <= 10) {
            return n.replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        // 11‑digit numbers (e.g., mobile with extra digit)
        return n.replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showDuplicateModal) {
                setShowDuplicateModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showDuplicateModal]);

    const checkDuplicateName = async (nameToCheck) => {
        if (!nameToCheck || nameToCheck.trim().length < 3) return;
        if (!isNaN(nameToCheck)) return;

        try {
            const data = await api.doadores.checkDuplicate(nameToCheck.trim());

            const filteredData = data.filter(d => String(d.codigo_doador) !== formData.codigo);

            if (filteredData && filteredData.length > 0) {
                setDuplicateDonors(filteredData);
                setShowDuplicateModal(true);
            }
        } catch (e) {
            console.error('Erro ao verificar duplicidade de nome:', e);
        }
    };

    const fetchDonor = useCallback(async (index = 0, filter = null, silent = false) => {
        setLoading(true);
        try {
            const params = { index, limit: 1 };
            if (filter) {
                if (filter.type === 'code' && filter.value) {
                    params.codigo = filter.value.padStart(6, '0').replace(/^0+/, '');
                } else if (filter.type === 'name' && filter.value) {
                    params.nome = filter.value;
                } else if (filter.type === 'cep' && filter.value) {
                    params.cep = filter.value.replace(/\D/g, '');
                } else if (filter.type === 'tel' && filter.value) {
                    params.tel = filter.value;
                } else if (filter.type === 'tlmk' && filter.value) {
                    params.tlmk = filter.value.trim();
                } else if (filter.type === 'matcob' && filter.value) {
                    params.matcob = filter.value.trim();
                }
            }
            const { data, count } = await api.doadores.list(params);
            if (data?.length > 0) {
                const d = data[0];
                setFormData({
                    codigo: String(d.codigo_doador).padStart(6, '0'), nome: d.nome || '', celular: maskPhone(d.celular || ''),
                    whatsapp: maskPhone(d.whatsapp || ''), fixo: maskPhone(d.fixo || ''), email: d.email || '',
                    contato: d.contato || '',
                    cep: maskCep(d.cep || ''), logradouro: d.logradouro || '', endereco: d.endereco || '',
                    complemento: d.complemento || '', bairro: d.bairro || '', cidade: d.cidade || '',
                    estado: d.estado || '', tipo: d.tipo_doador || '', regiao: d.regiao || '', dia_semana: d.dia_semana || '', mapa: d.mapa || '',
                    cod_tlmk: d.cod_tlmk || '', cod_matcob: d.cod_matcob || '', dataCadastro: d.data_cadastro || '', historico: d.historico || ''
                });
                setCurrentIndex(index); setTotalRecords(count || 0); setIsEditing(false); setIsNew(false);
            } else {
                if (filter && !silent) showToast('Doador não encontrado.', 'error');
                if (index === 0 && !filter) { setFormData(initialFormState); setCurrentIndex(-1); setTotalRecords(0); }
            }
        } catch (e) {
            console.error('Erro ao buscar doador:', e);
            showToast('Erro de conexão. Tente recarregar.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDonor(0);
    }, [fetchDonor]);

    // Persistência de rascunho
    useEffect(() => {
        if (isEditing) {
            localStorage.setItem('donor_draft', JSON.stringify({ formData, isNew, currentIndex }));
        }
    }, [formData, isEditing, isNew, currentIndex]);

    useEffect(() => {
        const draft = localStorage.getItem('donor_draft');
        if (draft && !isEditing) {
            const parsed = JSON.parse(draft);
            if (parsed.formData.codigo) { // Só restaura se tiver algo
                // Opcional: perguntar ao usuário? Por enquanto vamos deixar o estado vivo se o componente não desmontar
            }
        }
    }, []);

    const generateNextCode = async () => {
        try {
            const { nextCode } = await api.doadores.getNextCode();
            return nextCode;
        } catch {
            return '000001';
        }
    };

    const handleNew = async () => {
        setLoading(true); const nextCode = await generateNextCode();
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setFormData({ ...initialFormState, codigo: nextCode, contato: 'O mesmo', dataCadastro: localDate });
        setIsNew(true); setIsEditing(true); setLoading(false);
    };

    const handleCepBlur = async () => {
        const cleanCep = formData.cep.replace(/\D/g, '');
        if (cleanCep.length === 8) {
            try {
                const finalAddr = await api.enderecos.getByCep(cleanCep);

                if (finalAddr) {
                    setFormData(prev => ({
                        ...prev,
                        logradouro: finalAddr.logradouro || prev.logradouro,
                        endereco: finalAddr.endereco || prev.endereco,
                        bairro: finalAddr.bairro || prev.bairro,
                        cidade: finalAddr.cidade || prev.cidade,
                        estado: finalAddr.estado || prev.estado,
                        mapa: finalAddr.mapa || prev.mapa,
                        complemento: finalAddr.complemento || prev.complemento
                    }));
                    return; 
                }

                // Se não achou na base local, busca no ViaCEP normalmente
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    const fullLogradouro = data.logradouro || '';
                    const parts = fullLogradouro.split(' ');
                    const detectedTipo = parts[0] || '';
                    const detectedEndereco = parts.slice(1).join(' ') || fullLogradouro;

                    setFormData(prev => ({
                        ...prev,
                        logradouro: detectedTipo,
                        endereco: detectedEndereco,
                        bairro: data.bairro || '',
                        cidade: data.localidade || '',
                        estado: data.uf || ''
                    }));
                }
            } catch (e) { console.error(e); }
        }
    };

    // ── Smart Address: Buscar sugestões na tabela enderecos_coleta ──
    const fetchAddressSuggestions = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setAddressSuggestions([]);
            setShowAddressDropdown(false);
            return;
        }
        try {
            const data = await api.enderecos.suggestions({
                q: query,
                logradouro: formData.logradouro
            });
            setAddressSuggestions(data || []);
            setShowAddressDropdown((data || []).length > 0);
            setSelectedSuggestionIdx(-1);
        } catch (e) { console.error(e); }
    }, [formData.logradouro]);

    // Debounce na digitação do endereço
    const handleEnderecoChange = (value) => {
        setFormData(prev => ({ ...prev, endereco: value }));
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => fetchAddressSuggestions(value), 250);
    };

    const handleSelectAddress = (addr) => {
        const enderecoComEspaco = (addr.endereco || '') + ', ';
        setFormData(prev => ({
            ...prev,
            logradouro: addr.logradouro || prev.logradouro,
            endereco: enderecoComEspaco,
            cep: addr.cep ? maskCep(addr.cep) : prev.cep,
            bairro: addr.bairro || prev.bairro,
            cidade: addr.cidade || prev.cidade,
            estado: addr.estado || prev.estado,
            mapa: addr.mapa || prev.mapa
        }));
        setShowAddressDropdown(false);
        setAddressSuggestions([]);
        // Foca no campo Endereço com cursor no final para digitar o número
        setTimeout(() => {
            const input = enderecoInputRef.current;
            if (input) {
                input.focus();
                input.setSelectionRange(enderecoComEspaco.length, enderecoComEspaco.length);
            }
        }, 100);
    };

    // Auto-gravar endereço novo ao sair do campo (TAB/blur)
    const handleEnderecoBlur = async () => {
        setTimeout(async () => {
            setShowAddressDropdown(false);

            const endTrim = (formData.endereco || '').trim();
            const logTrim = (formData.logradouro || '').trim();
            if (!endTrim) return;

            const { exists } = await api.enderecos.checkExists(logTrim, endTrim);

            if (!exists) {
                const newAddr = {
                    logradouro: logTrim,
                    endereco: endTrim,
                    cep: (formData.cep || '').replace(/\D/g, ''),
                    complemento: (formData.complemento || '').trim(),
                    bairro: (formData.bairro || '').trim(),
                    cidade: (formData.cidade || '').trim(),
                    estado: (formData.estado || '').trim(),
                    mapa: (formData.mapa || '').trim()
                };
                await api.enderecos.create(newAddr);
            }
        }, 200);
    };

    // Navegação por teclado na lista de sugestões
    const handleEnderecoKeyDown = (e) => {
        if (!showAddressDropdown || addressSuggestions.length === 0) {
            if (e.key === 'Tab') handleEnderecoBlur();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIdx(prev => Math.min(prev + 1, addressSuggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIdx(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && selectedSuggestionIdx >= 0) {
            e.preventDefault();
            handleSelectAddress(addressSuggestions[selectedSuggestionIdx]);
        } else if (e.key === 'Escape') {
            setShowAddressDropdown(false);
        } else if (e.key === 'Tab') {
            if (selectedSuggestionIdx >= 0) {
                handleSelectAddress(addressSuggestions[selectedSuggestionIdx]);
            } else {
                handleEnderecoBlur();
            }
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const dbData = {
                nome: formData.nome, celular: formData.celular.replace(/\D/g, ''), whatsapp: formData.whatsapp.replace(/\D/g, ''),
                fixo: formData.fixo.replace(/\D/g, ''), email: formData.email, contato: formData.contato,
                cep: formData.cep.replace(/\D/g, ''),
                logradouro: formData.logradouro, endereco: formData.endereco, complemento: formData.complemento,
                bairro: formData.bairro, cidade: formData.cidade, estado: formData.estado, tipo_doador: formData.tipo,
                regiao: formData.regiao, dia_semana: formData.dia_semana, mapa: formData.mapa, cod_tlmk: formData.cod_tlmk, cod_matcob: formData.cod_matcob, historico: formData.historico
            };
            let savedCode;
            if (isNew) {
                const result = await api.doadores.create(dbData);
                savedCode = result.codigo_doador;
            } else {
                await api.doadores.update(formData.codigo, dbData);
                savedCode = formData.codigo;
            }

            localStorage.removeItem('donor_draft');
            await registerLog({
                usuario_email: user?.email || '',
                acao: isNew ? 'Inclusão' : 'Alteração',
                modulo: 'Doadores',
                detalhes: isNew ? `Novo doador: ${formData.nome} (Cód: ${savedCode})` : `Doador ${formData.codigo} - ${formData.nome} alterado`
            });
            showToast('Dados salvos!');
            setIsEditing(false);
            setIsNew(false);
            fetchDonor(0, { type: 'name', value: savedCode }, true);
        } catch { showToast('Erro ao salvar.', 'error'); } finally { setLoading(false); }
    };


    return (
        <div className="main-content-layout" style={{ flexDirection: 'column' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="donor-card" style={{ maxWidth: '100%', margin: '0', width: '100%' }}>
                <div className="donor-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '25px' }}>
                    <div className="icon-box" style={{ background: 'var(--primary-pastel-blue)', color: 'white' }}><Users size={32} /></div>
                    <div><h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem' }}>Cadastro de Doadores</h2><p style={{ margin: 0, opacity: 0.6 }}>Gerenciamento da base de doadores</p></div>
                </div>

                <div className="glass-card" style={{ marginBottom: '25px', padding: '20px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px minmax(150px, 1.5fr) 130px 180px auto auto', gap: '15px', alignItems: 'flex-end', overflowX: 'auto' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Cód. Doador:</label>
                            <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} /><input className="input-field" style={{ paddingLeft: '38px', width: '100%' }} placeholder="Ex: 123" value={searchCode} onChange={e => setSearchCode(e.target.value.replace(/\D/g, ''))} onKeyDown={e => { if (e.key === 'Enter') fetchDonor(0, { type: 'code', value: searchCode }); }} /></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Nome:</label>
                            <div style={{ position: 'relative' }}><Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} /><input className="input-field" style={{ paddingLeft: '38px', width: '100%' }} placeholder="Nome do doador" value={searchName} onChange={e => setSearchName(e.target.value)} onBlur={() => checkDuplicateName(searchName)} onKeyDown={e => { if (e.key === 'Enter') { fetchDonor(0, { type: 'name', value: searchName }); checkDuplicateName(searchName); } else if (e.key === 'Tab') { checkDuplicateName(searchName); } }} /></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>CEP:</label>
                            <div style={{ position: 'relative' }}><MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} /><input className="input-field" style={{ paddingLeft: '38px', width: '100%' }} placeholder="00000-000" value={searchCep} onChange={e => setSearchCep(maskCep(e.target.value))} onKeyDown={e => e.key === 'Enter' && fetchDonor(0, { type: 'cep', value: searchCep })} /></div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Telefone:</label>
                            <div style={{ position: 'relative' }}><Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} /><input className="input-field" style={{ paddingLeft: '38px', width: '100%' }} placeholder="(00) 00000-0000" value={searchTel} onChange={e => setSearchTel(maskPhone(e.target.value))} onKeyDown={e => e.key === 'Enter' && fetchDonor(0, { type: 'tel', value: searchTel })} /></div>
                        </div>
                        <button className="btn-action btn-primary" style={{ height: '45px' }} onClick={() => { if (searchCode) fetchDonor(0, { type: 'code', value: searchCode }); else if (searchName) fetchDonor(0, { type: 'name', value: searchName }); else if (searchCep) fetchDonor(0, { type: 'cep', value: searchCep }); else if (searchTel) fetchDonor(0, { type: 'tel', value: searchTel }); }}><Search size={18} /> Filtrar</button>
                        <button
                            className="btn-action btn-secondary"
                            style={{ height: '45px', background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                            onClick={() => {
                                setSearchCode('');
                                setSearchName('');
                                setSearchCep('');
                                setSearchTel('');
                            }}
                        >
                            <RefreshCcw size={18} /> Limpar
                        </button>
                    </div>
                </div>

                <div className="nav-bar" style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
                        <button className="btn-nav" onClick={() => fetchDonor(0)} disabled={currentIndex <= 0 || loading || isEditing}><SkipBack size={18} /></button>
                        <button className="btn-nav" onClick={() => fetchDonor(currentIndex - 1)} disabled={currentIndex <= 0 || loading || isEditing}><ChevronLeft size={18} /></button>
                        <span className="nav-counter" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{totalRecords === 0 ? '0 / 0' : `${currentIndex + 1} / ${totalRecords}`}</span>
                        <button className="btn-nav" onClick={() => fetchDonor(currentIndex + 1)} disabled={currentIndex >= totalRecords - 1 || loading || isEditing}><ChevronRight size={18} /></button>
                        <button className="btn-nav" onClick={() => fetchDonor(totalRecords - 1)} disabled={currentIndex >= totalRecords - 1 || loading || isEditing}><SkipForward size={18} /></button>

                        <button 
                            className="btn-nav" 
                            style={{ 
                                marginLeft: '10px', 
                                background: 'var(--primary-pastel-blue)', 
                                color: 'white',
                                borderColor: 'var(--primary-pastel-blue)',
                                boxShadow: '0 4px 10px rgba(74, 144, 226, 0.3)'
                            }} 
                            onClick={() => setShowQuickPrint(true)} 
                            title="Impressão Rápida"
                        >
                            <Zap size={18} fill="currentColor" />
                        </button>

                        <button 
                            type="button"
                            className="btn-action btn-success" 
                            style={{ 
                                marginLeft: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0 15px',
                                height: '38px',
                                borderRadius: '0',
                                border: 'none',
                                cursor: (!isEditing || !canEdit) ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                opacity: (!isEditing || !canEdit) ? 0.6 : 1
                            }}
                            disabled={!isEditing || !canEdit}
                            onClick={handleSave}
                            title="Gravar as alterações feitas"
                        >
                            <Save size={18} /> Gravar
                        </button>

                        {!isEditing && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '25px', paddingLeft: '25px', borderLeft: '1px solid var(--border-color)' }}>
                                <button className="btn-action btn-success" style={{ flexShrink: 0, height: '38px' }} onClick={handleNew} disabled={!canEdit}><Plus size={18} /> Novo</button>
                                <button className="btn-action btn-primary" style={{ flexShrink: 0, height: '38px' }} onClick={() => setIsEditing(true)} disabled={totalRecords === 0 || !canEdit}><Edit2 size={18} /> Alterar</button>
                                <button className="btn-action btn-secondary" style={{ height: '38px', padding: '0 15px' }} onClick={() => {
                                    setSearchTlmk('');
                                    setSearchMatcob('');
                                    fetchDonor(0);
                                }}>
                                    Limpar
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', paddingLeft: '30px' }}>
                        {!isEditing && <button className="btn-nav" style={{ flexShrink: 0 }} onClick={() => fetchDonor(0)} title="Atualizar dados"><RefreshCcw size={18} /></button>}

                        {isEditing ? (
                            <button type="button" className="btn-action btn-secondary" onClick={() => { setIsEditing(false); setIsNew(false); fetchDonor(currentIndex); }}><X size={18} /> Cancelar</button>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <input 
                                        className="input-field" 
                                        style={{ width: '110px', height: '38px', textAlign: 'center', fontWeight: 'bold' }} 
                                        placeholder="TLMK" 
                                        value={searchTlmk} 
                                        onChange={e => {setSearchTlmk(e.target.value); setSearchMatcob('');}}
                                        onKeyDown={e => e.key === 'Enter' && fetchDonor(0, { type: 'tlmk', value: searchTlmk })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <input 
                                        className="input-field" 
                                        style={{ width: '110px', height: '38px', textAlign: 'center', fontWeight: 'bold' }} 
                                        placeholder="MATCOB" 
                                        value={searchMatcob} 
                                        onChange={e => {setSearchMatcob(e.target.value); setSearchTlmk('');}}
                                        onKeyDown={e => e.key === 'Enter' && fetchDonor(0, { type: 'matcob', value: searchMatcob })}
                                    />
                                </div>
                                <button className="btn-action btn-primary" style={{ height: '38px', padding: '0 15px' }} onClick={() => {
                                    if (searchTlmk) fetchDonor(0, { type: 'tlmk', value: searchTlmk });
                                    else if (searchMatcob) fetchDonor(0, { type: 'matcob', value: searchMatcob });
                                }}>
                                    <Search size={16} /> Buscar
                                </button>
                                <button className="btn-action btn-primary" style={{ backgroundColor: '#f59e0b', flexShrink: 0, height: '38px' }} onClick={() => onNavigateToAlterarDoacoes?.(formData)} disabled={totalRecords === 0 || isTransportes} title="Alterar doações deste doador"><Edit2 size={18} /> Alterar Doações</button>
                                <button className="btn-action btn-primary" style={{ backgroundColor: 'var(--accent-color)', flexShrink: 0, height: '38px' }} onClick={() => onNavigateToDoacoes(formData)} disabled={totalRecords === 0 || isTransportes} title="Registrar doação para este doador"><Truck size={18} /> Doações</button>
                                <button className="btn-action btn-secondary" style={{ flexShrink: 0 }} onClick={() => setShowFichaModal(true)} disabled={totalRecords === 0} title="Imprimir Ficha do Doador">
                                    <FileText size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>


                <div className="premium-wrapper" style={{ gap: '15px' }}>
                    <form className="glass-card" style={{ flex: 1, padding: '20px', border: '1px solid var(--border-color)' }} onSubmit={handleSave}>
                        <div className="section-title-premium" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><User size={20} /> Identificação Principal</div>
                        <div className="donor-form-grid" style={{ gridTemplateColumns: 'repeat(10, 1fr)', gap: '10px' }}>
                            <div className="form-group" style={{ gridColumn: 'span 6' }}><label>Nome Completo</label><input className="input-field" value={formData.nome || ''} readOnly={!isEditing} onChange={e => setFormData({ ...formData, nome: e.target.value })} onBlur={() => { if (isEditing) checkDuplicateName(formData.nome); }} onKeyDown={e => { if (isEditing && (e.key === 'Enter' || e.key === 'Tab')) checkDuplicateName(formData.nome); }} required /></div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Cód. Doador</label><input className="input-field input-readonly" value={formData.codigo} readOnly style={{ textAlign: 'center', fontWeight: 900 }} /></div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Cadastro</label><input className="input-field input-readonly" value={formData.dataCadastro ? formData.dataCadastro.split(/[-T /]/).slice(0, 3).reverse().join('/') : ''} readOnly style={{ textAlign: 'center' }} /></div>
                        </div>

                        <div className="section-title-premium" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={20} /> Meios de Contato</div>
                        <div className="donor-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                            <div className="form-group"><label>Celular</label><input className="input-field" value={formData.celular} readOnly={!isEditing} onChange={e => setFormData({ ...formData, celular: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" /></div>
                            <div className="form-group"><label>Fixo</label><input className="input-field" value={formData.fixo} readOnly={!isEditing} onChange={e => setFormData({ ...formData, fixo: maskPhone(e.target.value) })} placeholder="(00) 0000-0000" /></div>
                            <div className="form-group"><label>Contato</label><input className="input-field" value={formData.contato} readOnly={!isEditing} onChange={e => setFormData({ ...formData, contato: e.target.value })} placeholder="Ref..." /></div>
                            <div className="form-group"><label>Email</label><input className="input-field" value={formData.email} readOnly={!isEditing} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="exemplo@email.com" /></div>
                            <div className="form-group"><label>WhatsApp</label><input className="input-field" value={formData.whatsapp} readOnly={!isEditing} onChange={e => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" /></div>
                        </div>

                        <div className="section-title-premium" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MapPin size={20} /> Endereço de Coleta</div>

                        {/* Linha de Endereço Principal */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'nowrap' }}>
                            <div className="form-group" style={{ width: '100px', flexShrink: 0 }}>
                                <label>CEP</label>
                                <input className="input-field" style={{ width: '100%', padding: '12px 10px' }} value={formData.cep} readOnly={!isEditing} onChange={e => setFormData({ ...formData, cep: maskCep(e.target.value) })} onBlur={handleCepBlur} placeholder="00000-000" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Logradouro</label>
                                <input
                                    className="input-field"
                                    style={{ width: '100%' }}
                                    value={formData.logradouro}
                                    readOnly={!isEditing}
                                    onChange={e => setFormData({ ...formData, logradouro: e.target.value })}
                                    placeholder="Rua..."
                                    list="logradouros-list"
                                />
                                <datalist id="logradouros-list">
                                    <option value="Rua" />
                                    <option value="Avenida" />
                                    <option value="Alameda" />
                                    <option value="Estrada" />
                                    <option value="Rodovia" />
                                    <option value="Praça" />
                                    <option value="Beco" />
                                    <option value="Travessa" />
                                    <option value="Viela" />
                                    <option value="Lote" />
                                    <option value="Chácara" />
                                    <option value="Condomínio" />
                                    <option value="Residencial" />
                                    <option value="Sítio" />
                                </datalist>
                            </div>
                            <div className="form-group" style={{ flex: 2, position: 'relative' }}>
                                <label>Endereço <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 400 }}>(digite para buscar)</span></label>
                                <input
                                    ref={enderecoInputRef}
                                    className="input-field"
                                    style={{ width: '100%' }}
                                    value={formData.endereco}
                                    readOnly={!isEditing}
                                    onChange={e => handleEnderecoChange(e.target.value)}
                                    onKeyDown={handleEnderecoKeyDown}
                                    onBlur={handleEnderecoBlur}
                                    onFocus={() => { if (formData.endereco && formData.endereco.length >= 2 && isEditing) fetchAddressSuggestions(formData.endereco); }}
                                    placeholder="Nome da rua/avenida..."
                                    autoComplete="off"
                                />
                                {/* Lista Suspensa Inteligente */}
                                {showAddressDropdown && isEditing && addressSuggestions.length > 0 && (
                                    <div
                                        ref={addressDropdownRef}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            background: 'var(--card-bg)',
                                            border: '2px solid var(--primary-color)',
                                            borderRadius: '0 0 0 0',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                            zIndex: 9999,
                                            maxHeight: '280px',
                                            overflowY: 'auto',
                                            marginTop: '-2px'
                                        }}
                                    >
                                        {addressSuggestions.map((addr, idx) => (
                                            <div
                                                key={addr.id}
                                                onMouseDown={(e) => { e.preventDefault(); handleSelectAddress(addr); }}
                                                style={{
                                                    padding: '10px 14px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    background: idx === selectedSuggestionIdx ? 'var(--primary-soft)' : 'transparent',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={() => setSelectedSuggestionIdx(idx)}
                                            >
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-color)' }}>
                                                    {addr.logradouro} {addr.endereco}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6, display: 'flex', gap: '12px', marginTop: '2px' }}>
                                                    <span>{addr.bairro}</span>
                                                    <span>{addr.cidade}/{addr.estado}</span>
                                                    {addr.cep && <span>CEP: {maskCep(addr.cep)}</span>}
                                                    {addr.mapa && <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Mapa: {addr.mapa}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="donor-form-grid" style={{ gridTemplateColumns: '1.2fr 1.5fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>Bairro</label><input className="input-field" value={formData.bairro} readOnly={!isEditing} onChange={e => setFormData({ ...formData, bairro: e.target.value })} /></div>
                            <div className="form-group"><label>Complemento</label><input ref={complementoInputRef} className="input-field" value={formData.complemento} readOnly={!isEditing} onChange={e => setFormData({ ...formData, complemento: e.target.value })} placeholder="Bl, Apto..." /></div>
                            <div className="form-group"><label>Cidade</label><input className="input-field" value={formData.cidade} readOnly={!isEditing} onChange={e => setFormData({ ...formData, cidade: e.target.value })} /></div>
                        </div>

                        <div className="donor-form-grid" style={{ gridTemplateColumns: '100px 150px 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            <div className="form-group"><label>UF</label><input className="input-field" value={formData.estado} readOnly={!isEditing} onChange={e => setFormData({ ...formData, estado: e.target.value })} maxLength={2} style={{ textAlign: 'center', padding: '12px 2px' }} /></div>
                            <div className="form-group"><label style={{ color: 'var(--primary-color)' }}>Mapa</label><input className="input-field" style={{ fontWeight: 800, color: 'var(--primary-color)' }} value={formData.mapa || ''} readOnly={!isEditing} onChange={e => setFormData({ ...formData, mapa: e.target.value })} placeholder="MapoGraph" /></div>
                            
                            <div className="form-group">
                                <label>Tipo de Doador</label>
                                <input 
                                    list="tipo-doador-list"
                                    className="input-field" 
                                    value={formData.tipo} 
                                    readOnly={!isEditing} 
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })} 
                                    placeholder="Selecione ou digite..."
                                />
                                <datalist id="tipo-doador-list">
                                    <option value="Comum" />
                                    <option value="Boleto Bancário" />
                                    <option value="Contribuinte" />
                                    <option value="Telemarketing" />
                                    <option value="Voluntário(a)" />
                                    <option value="Parente de Diretor(a)" />
                                    <option value="Parente de Contribuinte" />
                                    <option value="Parente de Funcionário(a)" />
                                    <option value="Mensal" />
                                    <option value="Semanal" />
                                    <option value="Quinzenal" />
                                    <option value="Semestral" />
                                    <option value="Frequentador(a) do Centro" />
                                </datalist>
                            </div>
                            <div className="form-group">
                                <label>Região</label>
                                <input 
                                    list="regiao-list"
                                    className="input-field" 
                                    value={formData.regiao} 
                                    readOnly={!isEditing} 
                                    onChange={e => setFormData({ ...formData, regiao: e.target.value })} 
                                    placeholder="Selecione ou digite..."
                                />
                                <datalist id="regiao-list">
                                    <option value="Guarulhos" />
                                    <option value="Itaquera" />
                                    <option value="Penha" />
                                    <option value="Ponte Grande" />
                                    <option value="Sapopemba" />
                                    <option value="Tatuapé" />
                                    <option value="Zona Norte" />
                                    <option value="Zona Oeste" />
                                    <option value="Zona Leste" />
                                    <option value="Zona Sul" />
                                </datalist>
                            </div>
                        </div>

                        <div className="donor-form-grid" style={{ gridTemplateColumns: '150px 150px 150px auto', gap: '10px', marginTop: '10px' }}>
                            <div className="form-group"><label>TLMK</label><input className="input-field" value={formData.cod_tlmk} readOnly={!isEditing} onChange={e => setFormData({ ...formData, cod_tlmk: e.target.value })} /></div>
                            <div className="form-group"><label>MATCOB</label><input className="input-field" value={formData.cod_matcob} readOnly={!isEditing} onChange={e => setFormData({ ...formData, cod_matcob: e.target.value })} /></div>
                            <div className="form-group">
                                <label>Dia da Semana</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%' }}
                                    value={formData.dia_semana}
                                    disabled={!isEditing}
                                    onChange={e => setFormData({ ...formData, dia_semana: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Segunda">Segunda</option>
                                    <option value="Terça">Terça</option>
                                    <option value="Quarta">Quarta</option>
                                    <option value="Quinta">Quinta</option>
                                    <option value="Sexta">Sexta</option>
                                    <option value="Sábado">Sábado</option>
                                    <option value="Domingo">Domingo</option>
                                    <option value="Seg/Ter/Sex">Seg/Ter/Sex</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Histórico</label><input className="input-field" value={formData.historico || ''} readOnly={!isEditing} onChange={e => setFormData({ ...formData, historico: e.target.value })} placeholder="Histórico do doador..." /></div>
                        </div>
                    </form>

                    <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '15px', flexShrink: 0 }}>
                        <div className="glass-card">
                            <div className="section-title-premium" style={{ marginTop: 0 }}><Clock size={16} /> Escalas de Coleta</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', marginTop: '10px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                            <th style={{ padding: '8px 4px', fontWeight: 600, color: '#c53030', textAlign: 'left' }}>Dias da semana:</th>
                                            <th style={{ padding: '8px 4px', fontWeight: 600, color: '#c53030', textAlign: 'left' }}>Região:</th>
                                            <th style={{ padding: '8px 4px', fontWeight: 600, color: '#c53030', textAlign: 'left' }}>Período:</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { d: 'segunda/terça/sexta', r: 'Penha', p: 'semanal' },
                                            { d: 'segunda/terça:', r: 'Ponte Grande', p: 'semanal' },
                                            { d: 'quarta-feira', r: 'Tatuapé/Sapopemba', p: 'semanal' },
                                            { d: 'quinta-feira', r: 'Itaquera', p: 'quinzenal' },
                                            { d: 'quinta-feira', r: 'Zona Oeste', p: 'mensal' },
                                            { d: 'quinta-feira', r: 'Zona Norte', p: 'mensal' },
                                            { d: 'sábado', r: 'à definir', p: 'eventual' }
                                        ].map((s, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '10px 4px', fontWeight: 600, color: 'var(--text-color)' }}>{s.d}</td>
                                                <td style={{ padding: '10px 4px', color: 'var(--primary-color)', fontWeight: 700 }}>{s.r}</td>
                                                <td style={{ padding: '10px 4px', color: 'var(--text-muted)' }}>{s.p}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center' }}><div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--success-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={32} /></div><div><h4 style={{ margin: 0 }}>Doador Ativo</h4></div></div>
                    </div>
                </div>
            </div>
            {/* Duplicate Alert Modal */}
            {showDuplicateModal && (
                <div className="modal-overlay" style={{ zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDuplicateModal(false)}>
                    <div className="modal-content" style={{ background: 'var(--card-bg, #1a1b1e)', width: '90%', maxWidth: '600px', borderRadius: '0', border: '3px solid #ef4444', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertTriangle /> Atenção: Nome(s) já cadastrado(s)</h3>
                            <button className="btn-close" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-color)' }} onClick={() => setShowDuplicateModal(false)}><X size={24} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <p style={{ marginBottom: '15px', fontSize: '0.95rem' }}>Os seguintes doadores foram encontrados com um nome semelhante. Verifique se não é a mesma pessoa antes de prosseguir:</p>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                                        <th style={{ padding: '8px' }}>CÓDIGO</th>
                                        <th style={{ padding: '8px' }}>Nome</th>
                                        <th style={{ padding: '8px' }}>CEP</th>
                                        <th style={{ padding: '8px' }}>Celular</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duplicateDonors.map((d, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{d.codigo_doador}</td>
                                            <td style={{ padding: '8px' }}>{d.nome}</td>
                                            <td style={{ padding: '8px' }}>{d.cep ? maskCep(d.cep) : ''}</td>
                                            <td style={{ padding: '8px' }}>{d.celular ? maskPhone(d.celular) : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <FichaModal isOpen={showFichaModal} doador={formData} onClose={() => setShowFichaModal(false)} />

            {showQuickPrint && (
                <QuickPrintModal 
                    initialDonorCode={formData.codigo} 
                    userLoggerName={perfil?.nome || user?.email || 'Sistema'}
                    onClose={() => setShowQuickPrint(false)} 
                />
            )}
        </div>
    );
};

export default DonorForm;
