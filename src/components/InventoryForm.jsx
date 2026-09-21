import React, { useState, useEffect, useCallback } from 'react';
import { Package, Tags, Save, Edit2, Trash2, Plus, X, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, SkipBack, SkipForward, Info, LayoutGrid, List } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';

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

const ConfirmModal = ({ message, onConfirm, onCancel, type = 'danger' }) => (
    <div className="modal-overlay">
        <div className="modal-box">
            <div className="modal-icon"><AlertTriangle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} /></div>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className={`btn-action ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirmar</button>
                <button className="btn-action btn-secondary" onClick={onCancel}><X size={16} /> Cancelar</button>
            </div>
        </div>
    </div>
);

const UNIDADES_PADRAO = ["UN", "KG", "PÇ", "LT", "MT", "PCT", "CX", "DZ", "SAC", "PAR"];

const InventoryForm = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('categories');
    const [toast, setToast] = useState(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [loading, setLoading] = useState(false);

    // ——— State ———
    const [categories, setCategories] = useState([]);
    const [catForm, setCatForm] = useState({ codigo_base: '', nome: '', descricao: '', status: 'Ativo' });
    const [catIndex, setCatIndex] = useState(-1);
    const [totalCats, setTotalCats] = useState(0);

    const [items, setItems] = useState([]);
    const [itemForm, setItemForm] = useState({ codigo_completo: '', nome: '', codigo_base: '', qtde: 0, unidade: '' });
    const [itemIndex, setItemIndex] = useState(-1);
    const [totalItems, setTotalItems] = useState(0);
    const [extraUnits, setExtraUnits] = useState([]);

    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    const handleCategoryChange = async (catCode) => {
        if (!catCode) {
            setItemForm(prev => ({ ...prev, codigo_base: '', codigo_completo: '' }));
            return;
        }

        try {
            // Buscar todos os itens desta categoria para calcular o próximo código sem ponto (.)
            const { data, error } = await supabase
                .from('itens')
                .select('codigo_completo')
                .eq('codigo_base', catCode);

            let nextCode = '';
            if (!error && data && data.length > 0) {
                let maxSuffix = 0;
                let padLength = 3;

                data.forEach(item => {
                    if (!item.codigo_completo) return;
                    // Remove qualquer ponto que possa existir
                    const cleanCode = item.codigo_completo.replace(/\./g, '');
                    const suffixStr = cleanCode.startsWith(catCode) 
                        ? cleanCode.slice(catCode.length) 
                        : cleanCode;
                    
                    const num = parseInt(suffixStr, 10);
                    if (!isNaN(num)) {
                        if (num > maxSuffix) {
                            maxSuffix = num;
                            if (suffixStr.length > padLength) {
                                padLength = suffixStr.length;
                            }
                        }
                    }
                });

                if (maxSuffix > 0) {
                    const nextNum = maxSuffix + 1;
                    nextCode = `${catCode}${nextNum.toString().padStart(padLength, '0')}`;
                } else {
                    nextCode = `${catCode}001`;
                }
            } else {
                // Primeiro item da categoria (ex: 2300001)
                nextCode = `${catCode}001`;
            }

            setItemForm(prev => ({ ...prev, codigo_base: catCode, codigo_completo: nextCode }));
        } catch (err) {
            console.error('Erro ao gerar código do item:', err);
            setItemForm(prev => ({ ...prev, codigo_base: catCode }));
        }
    };

    const handleNewCategory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categoria')
                .select('codigo_base');

            let maxCode = 0;
            if (!error && data && data.length > 0) {
                data.forEach(item => {
                    const num = parseInt(item.codigo_base, 10);
                    if (!isNaN(num) && num > maxCode) {
                        maxCode = num;
                    }
                });
            }

            const nextCode = maxCode > 0 ? (maxCode + 100).toString() : '100';

            setCatForm({ codigo_base: nextCode, nome: '', descricao: '', status: 'Ativo' });
            setCatIndex(-1);
        } catch (err) {
            console.error('Erro ao gerar código da categoria:', err);
            setCatForm({ codigo_base: '', nome: '', descricao: '', status: 'Ativo' });
            setCatIndex(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        if (!catForm.codigo_base || !catForm.nome) {
            showToast('Código e Nome são obrigatórios.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('categoria')
                .upsert([catForm], { onConflict: 'codigo_base' });
            
            if (error) throw error;
            showToast('Categoria salva com sucesso!');
            await registerLog({ usuario_email: user?.email || '', acao: catIndex >= 0 ? 'Alteração' : 'Inclusão', modulo: 'Inventário - Categorias', detalhes: `Categoria ${catForm.codigo_base} - ${catForm.nome}` });
            fetchCategories();
        } catch (err) {
            showToast('Erro ao salvar categoria: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveItem = async (e) => {
        e.preventDefault();
        if (!itemForm.codigo_completo || !itemForm.nome || !itemForm.codigo_base) {
            showToast('Código, Nome e Categoria são obrigatórios.', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('itens')
                .upsert([itemForm], { onConflict: 'codigo_completo' });
            
            if (error) throw error;
            showToast('Produto salva com sucesso!');
            await registerLog({ usuario_email: user?.email || '', acao: itemIndex >= 0 ? 'Alteração' : 'Inclusão', modulo: 'Inventário - Itens', detalhes: `Item ${itemForm.codigo_completo} - ${itemForm.nome}` });
            fetchItems();
        } catch (err) {
            showToast('Erro ao salvar produto: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async () => {
        if (!catForm.codigo_base) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('categoria').delete().eq('codigo_base', catForm.codigo_base);
            if (error) throw error;
            showToast('Categoria excluída!');
            await registerLog({ usuario_email: user?.email || '', acao: 'Exclusão', modulo: 'Inventário - Categorias', detalhes: `Categoria ${catForm.codigo_base} - ${catForm.nome} excluída` });
            fetchCategories();
        } catch (err) {
            showToast('Erro ao excluir: ' + err.message, 'error');
        } finally {
            setLoading(false);
            setShowConfirmDelete(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemForm.codigo_completo) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('itens').delete().eq('codigo_completo', itemForm.codigo_completo);
            if (error) throw error;
            showToast('Produto excluído!');
            await registerLog({ usuario_email: user?.email || '', acao: 'Exclusão', modulo: 'Inventário - Itens', detalhes: `Item ${itemForm.codigo_completo} - ${itemForm.nome} excluído` });
            fetchItems();
        } catch (err) {
            showToast('Erro ao excluir: ' + err.message, 'error');
        } finally {
            setLoading(false);
            setShowConfirmDelete(false);
        }
    };

    const fetchCategories = async (index = 0) => {
        setLoading(true);
        try {
            const { data, count, error } = await supabase.from('categoria').select('*', { count: 'planned' }).order('codigo_base', { ascending: true });
            if (error) throw error;
            setCategories(data || []);
            setTotalCats(count || 0);
            if (data?.length > 0) { setCatIndex(index); setCatForm(data[index]); }
            else { setCatIndex(-1); setCatForm({ codigo_base: '', nome: '', descricao: '', status: 'Ativo' }); }
        } catch (err) { showToast('Erro ao carregar categorias.', 'error'); } finally { setLoading(false); }
    };

    const fetchItems = async (index = 0) => {
        setLoading(true);
        try {
            const { data, count, error } = await supabase.from('itens').select('*', { count: 'planned' }).order('codigo_completo', { ascending: true });
            if (error) throw error;
            setItems(data || []);
            setTotalItems(count || 0);
            if (data?.length > 0) { setItemIndex(index); setItemForm(data[index]); }
            else { setItemIndex(-1); setItemForm({ codigo_completo: '', nome: '', codigo_base: '', qtde: 0, unidade: '' }); }
        } catch (err) { showToast('Erro ao carregar itens.', 'error'); } finally { setLoading(false); }
    };

    useEffect(() => { 
        fetchCategories(0); 
        fetchItems(0); 
        const saved = localStorage.getItem('inv_extra_units');
        if (saved) setExtraUnits(JSON.parse(saved));
    }, []);

    const recordUnit = (val) => {
        if (!val) return;
        const u = val.trim().toUpperCase();
        // Se não estiver na lista padrão, nem nas já gravadas localmente, adiciona
        if (!UNIDADES_PADRAO.includes(u) && !extraUnits.includes(u)) {
            const next = [...extraUnits, u];
            setExtraUnits(next);
            localStorage.setItem('inv_extra_units', JSON.stringify(next));
        }
    };

    return (
        <div className="main-content-layout" style={{flexDirection: 'column'}}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {showConfirmDelete && (
                <ConfirmModal 
                    message={`Excluir este ${deleteTarget === 'category' ? 'categoria' : 'item'} permanentemente?`} 
                    onConfirm={deleteTarget === 'category' ? handleDeleteCategory : handleDeleteItem} 
                    onCancel={() => setShowConfirmDelete(false)} 
                />
            )}

            <div className="inv-premium-card">

                <div className="nav-bar" style={{background: 'var(--bg-color)', border: 'none', boxShadow: 'none', padding: 0}}>
                    <div style={{display: 'flex', gap: '8px', flex: 1}}>
                        <button className={`btn-action ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`} style={{flex: 1}} onClick={() => setActiveTab('categories')}><Tags size={18} /> Categorias</button>
                        <button className={`btn-action ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`} style={{flex: 1}} onClick={() => setActiveTab('items')}><List size={18} /> Itens / Produtos</button>
                    </div>
                </div>

                <div className="premium-wrapper">
                    {activeTab === 'categories' ? (
                        <>
                            <div className="glass-card" style={{flex: 1, padding: '24px'}}>
                                <div className="section-title-premium" style={{marginTop: 0}}>Categorias Registradas</div>
                                <div className="nav-bar" style={{marginBottom: '20px', padding: '10px 15px'}}>
                                    <div className="nav-controls">
                                        <button className="btn-nav" onClick={() => fetchCategories(0)} disabled={catIndex <= 0}><SkipBack size={16} /></button>
                                        <button className="btn-nav" onClick={() => fetchCategories(catIndex - 1)} disabled={catIndex <= 0}><ChevronLeft size={16} /></button>
                                        <span className="nav-counter">{catIndex + 1} / {totalCats}</span>
                                        <button className="btn-nav" onClick={() => fetchCategories(catIndex + 1)} disabled={catIndex >= totalCats - 1}><ChevronRight size={16} /></button>
                                    </div>
                                    <button className="btn-action btn-success" style={{height: '38px'}} onClick={handleNewCategory}><Plus size={16} /> Nova</button>
                                    <button className="btn-action btn-secondary" style={{height: '38px'}} onClick={() => { setCatForm({codigo_base: '', nome: '', descricao: '', status: 'Ativo'}); setCatIndex(-1); if (categories.length > 0) fetchCategories(0); }}><X size={16} /> Cancelar</button>
                                </div>
                                <div className="table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    <table className="donation-items-table">
                                        <thead><tr><th>Cód</th><th>Nome Categoria</th></tr></thead>
                                        <tbody>
                                            {categories.map((c, i) => (
                                                <tr key={i} onClick={() => fetchCategories(i)} style={{cursor: 'pointer', background: catIndex === i ? 'var(--primary-soft)' : 'transparent'}}>
                                                    <td><span className="badge">{c.codigo_base}</span></td>
                                                    <td style={{fontWeight: 700}}>{c.nome}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="glass-card" style={{flex: 1.5, padding: '30px'}}>
                                <div className="section-title-premium" style={{marginTop: 0}}>Dados da Categoria</div>
                                <form className="donor-form-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'}} onSubmit={handleSaveCategory}>
                                    <div className="form-group"><label>Código Base</label><input className="input-field" value={catForm.codigo_base} onChange={e => setCatForm({...catForm, codigo_base: e.target.value.toUpperCase()})} maxLength={10} /></div>
                                    <div className="form-group" style={{gridColumn: 'span 2'}}><label>Nome</label><input className="input-field" value={catForm.nome} onChange={e => setCatForm({...catForm, nome: e.target.value})} /></div>
                                    <div className="form-group" style={{gridColumn: 'span 3'}}><label>Descrição Completa</label><textarea className="input-field" style={{minHeight: '100px'}} value={catForm.descricao} onChange={e => setCatForm({...catForm, descricao: e.target.value})} /></div>
                                    <div className="form-group" style={{gridColumn: 'span 3', display: 'flex', gap: '10px', marginTop: '20px'}}>
                                        <button type="submit" className="btn-action btn-primary" style={{flex: 1}} disabled={loading}><Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}</button>
                                        <button type="button" className="btn-action btn-danger" onClick={() => { setDeleteTarget('category'); setShowConfirmDelete(true); }}><Trash2 size={18} /></button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="glass-card" style={{flex: 1, padding: '24px'}}>
                                <div className="section-title-premium" style={{marginTop: 0}}>Itens no Estoque</div>
                                <div className="nav-bar" style={{marginBottom: '20px', padding: '10px 15px'}}>
                                    <div className="nav-controls">
                                        <button className="btn-nav" onClick={() => fetchItems(0)} disabled={itemIndex <= 0}><SkipBack size={16} /></button>
                                        <button className="btn-nav" onClick={() => fetchItems(itemIndex - 1)} disabled={itemIndex <= 0}><ChevronLeft size={16} /></button>
                                        <span className="nav-counter">{itemIndex + 1} / {totalItems}</span>
                                        <button className="btn-nav" onClick={() => fetchItems(itemIndex + 1)} disabled={itemIndex >= totalItems - 1}><ChevronRight size={16} /></button>
                                    </div>
                                    <button className="btn-action btn-success" style={{height: '38px'}} onClick={() => { setItemForm({codigo_completo: '', nome: '', codigo_base: '', qtde: 0, unidade: 'UN'}); setItemIndex(-1); }}><Plus size={16} /> Novo</button>
                                    <button className="btn-action btn-secondary" style={{height: '38px'}} onClick={() => { setItemForm({codigo_completo: '', nome: '', codigo_base: '', qtde: 0, unidade: ''}); setItemIndex(-1); if (items.length > 0) fetchItems(0); }}><X size={16} /> Cancelar</button>
                                </div>
                                <div className="table-container" style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    <table className="donation-items-table">
                                        <thead><tr><th>Cód</th><th>Nome Item</th><th style={{textAlign: 'center'}}>Qtd</th></tr></thead>
                                        <tbody>
                                            {items.map((it, i) => (
                                                <tr key={i} onClick={() => fetchItems(i)} style={{cursor: 'pointer', background: itemIndex === i ? 'var(--primary-soft)' : 'transparent'}}>
                                                    <td style={{fontSize: '0.7rem'}}>{it.codigo_completo}</td>
                                                    <td style={{fontWeight: 700}}>{it.nome}</td>
                                                    <td style={{textAlign: 'center', fontWeight: 900}}>{it.qtde}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="glass-card" style={{flex: 1.5, padding: '30px'}}>
                                <div className="section-title-premium" style={{marginTop: 0}}>Ficha do Produto</div>
                                <form className="donor-form-grid" onSubmit={handleSaveItem}>
                                    <div className="form-group"><label>Categoria</label>
                                        <select className="input-field" value={itemForm.codigo_base} onChange={e => handleCategoryChange(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {categories.map(c => <option key={c.codigo_base} value={c.codigo_base}>{c.codigo_base} - {c.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Cód. Completo</label><input className="input-field input-readonly" value={itemForm.codigo_completo} readOnly /></div>
                                    <div className="form-group" style={{gridColumn: 'span 3'}}><label>Descrição do Item</label><input className="input-field" value={itemForm.nome} onChange={e => setItemForm({...itemForm, nome: e.target.value})} /></div>
                                    <div className="form-group"><label>Quantidade Atual</label><input type="number" className="input-field" value={itemForm.qtde} onChange={e => setItemForm({...itemForm, qtde: e.target.value})} /></div>
                                    <div className="form-group">
                                        <label>Unidade</label>
                                        <input 
                                            className="input-field" 
                                            value={itemForm.unidade} 
                                            onChange={e => setItemForm({...itemForm, unidade: e.target.value.toUpperCase()})} 
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    recordUnit(e.target.value);
                                                }
                                            }}
                                            onBlur={e => recordUnit(e.target.value)}
                                            list="unidades-estoque-list"
                                            placeholder="UN"
                                            autoComplete="off"
                                        />
                                        <datalist id="unidades-estoque-list">
                                            {UNIDADES_PADRAO.map(u => (
                                                <option key={u} value={u} />
                                            ))}
                                            {[...new Set([
                                                ...items.map(it => it.unidade?.toUpperCase()),
                                                ...extraUnits
                                            ])].filter(u => u && !UNIDADES_PADRAO.includes(u)).map(u => (
                                                <option key={u} value={u} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="form-group" style={{gridColumn: 'span 3', display: 'flex', gap: '10px', marginTop: '20px'}}>
                                        <button type="submit" className="btn-action btn-primary" style={{flex: 1}} disabled={loading}><Save size={18} /> {loading ? 'Salvando...' : 'Salvar Produto'}</button>
                                        <button type="button" className="btn-action btn-danger" onClick={() => { setDeleteTarget('item'); setShowConfirmDelete(true); }}><Trash2 size={18} /></button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryForm;
