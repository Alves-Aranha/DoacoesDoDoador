import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { Save, Trash2, Edit2, X, CheckCircle, AlertTriangle, UserPlus, Users } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
    <div className="modal-overlay">
        <div className="modal-box">
            <div className="modal-icon"><AlertTriangle size={36} color="#E53E3E" /></div>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className="btn-action btn-danger" onClick={onConfirm}><Trash2 size={16} /> Excluir</button>
                <button className="btn-action btn-secondary" onClick={onCancel}><X size={16} /> Cancelar</button>
            </div>
        </div>
    </div>
);

const DriversForm = () => {
    const { user } = useAuth();
    const [drivers, setDrivers] = useState([]);
    const [formData, setFormData] = useState({ id: null, nome: '', rg: '', cpf: '', telefone: '' });
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        const { data, error } = await supabase.from('motoristas').select('*').order('nome');
        if (error) {
            console.error(error);
        } else {
            setDrivers(data || []);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (formData.id) {
                const { error } = await supabase.from('motoristas').update({
                    nome: formData.nome,
                    rg: formData.rg,
                    cpf: formData.cpf,
                    telefone: formData.telefone
                }).eq('id', formData.id);
                if (error) throw error;
                showToast('Motorista atualizado com sucesso!');
                await registerLog({ usuario_email: user?.email || '', acao: 'Alteração', modulo: 'Motoristas', detalhes: `Motorista ${formData.nome} alterado` });
            } else {
                const { error } = await supabase.from('motoristas').insert({
                    nome: formData.nome,
                    rg: formData.rg,
                    cpf: formData.cpf,
                    telefone: formData.telefone
                });
                if (error) throw error;
                showToast('Motorista cadastrado com sucesso!');
                await registerLog({ usuario_email: user?.email || '', acao: 'Inclusão', modulo: 'Motoristas', detalhes: `Novo motorista: ${formData.nome}` });
            }
            setFormData({ id: null, nome: '', rg: '', cpf: '', telefone: '' });
            fetchDrivers();
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar motorista.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (driver) => {
        setFormData({
            id: driver.id,
            nome: driver.nome,
            rg: driver.rg,
            cpf: driver.cpf,
            telefone: driver.telefone
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        const { error } = await supabase.from('motoristas').delete().eq('id', confirmDelete);
        if (error) {
            showToast('Erro ao excluir motorista.', 'error');
        } else {
            const deleted = drivers.find(d => d.id === confirmDelete);
            showToast('Motorista excluído com sucesso.');
            await registerLog({ usuario_email: user?.email || '', acao: 'Exclusão', modulo: 'Motoristas', detalhes: `Motorista ${deleted?.nome || ''} excluído` });
            fetchDrivers();
        }
        setConfirmDelete(null);
    };

    const clearForm = () => {
        setFormData({ id: null, nome: '', rg: '', cpf: '', telefone: '' });
    };

    return (
        <div className="main-content-layout drivers-page-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                .drivers-page-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .drivers-premium-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    max-width: 900px;
                    margin: 0 auto;
                    width: 100%;
                }
                .drivers-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                }
                .drivers-header-premium .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                .drivers-header-premium h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                    letter-spacing: 0.5px;
                }
                .drivers-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }
                .drivers-section-title {
                    color: #1e3a8a;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 24px 0 16px 0;
                }
                .drivers-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                [data-theme='dark'] .drivers-section-title {
                    color: #60a5fa;
                }
                [data-theme='dark'] .drivers-section-title::after {
                    background: #334155;
                }

                .drivers-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .drivers-form-grid .full-span {
                    grid-column: 1 / -1;
                }

                .drivers-btn-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 8px;
                }
                .drivers-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                    flex: 1;
                    justify-content: center;
                }
                .drivers-btn-save { background: #2563eb; color: white; }
                .drivers-btn-save:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .drivers-btn-save:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
                .drivers-btn-cancel { background: #64748b; color: white; }
                .drivers-btn-cancel:hover { background: #475569; transform: translateY(-1px); }

                .drivers-table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 12px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .drivers-table-premium th {
                    background: var(--input-bg);
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                }
                .drivers-table-premium td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.875rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .drivers-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .drivers-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }
                .drivers-table-premium .name-cell {
                    font-weight: 600;
                    color: var(--text-color);
                }

                .drivers-table-actions {
                    display: flex;
                    gap: 6px;
                    justify-content: center;
                }
                .drivers-table-actions button {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    border: 1px solid var(--border-color);
                    background: var(--card-bg);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-color);
                    transition: all 0.2s;
                }
                .drivers-table-actions button:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                    background: rgba(37, 99, 235, 0.05);
                }
                .drivers-table-actions button.danger-btn:hover {
                    border-color: #ef4444;
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                .drivers-empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-muted, #94a3b8);
                }
                .drivers-empty-state .empty-icon {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: var(--input-bg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 12px;
                    color: var(--text-muted, #94a3b8);
                }

                .drivers-counter-badge {
                    background: var(--input-bg);
                    color: var(--text-color);
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid var(--border-color);
                    margin-left: auto;
                }
            `}} />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {confirmDelete && (
                <ConfirmModal
                    message="Confirma a exclusão deste motorista?"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            <div className="drivers-premium-card">
                {/* Header */}
                <div className="drivers-header-premium">
                    <div className="icon-wrapper">
                        <Users size={24} />
                    </div>
                    <div>
                        <h2>Cadastro de Motoristas</h2>
                        <p className="subtitle">Gerenciar motoristas para logística de doações</p>
                    </div>
                    <span className="drivers-counter-badge">{drivers.length} registro(s)</span>
                </div>

                {/* Formulário */}
                <div className="drivers-section-title">
                    {formData.id ? '✏️ Editando Motorista' : '➕ Novo Motorista'}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="drivers-form-grid">
                        <div className="form-group">
                            <label>Data</label>
                            <input value={new Date().toLocaleDateString('pt-BR')} readOnly className="input-field input-readonly" />
                        </div>
                        <div className="form-group">
                            <label>Nome Completo</label>
                            <input name="nome" value={formData.nome} onChange={handleInputChange} required className="input-field" placeholder="Nome completo do motorista" />
                        </div>
                        <div className="form-group">
                            <label>RG</label>
                            <input name="rg" value={formData.rg} onChange={handleInputChange} className="input-field" placeholder="00.000.000-0" />
                        </div>
                        <div className="form-group">
                            <label>CPF</label>
                            <input name="cpf" value={formData.cpf} onChange={handleInputChange} className="input-field" placeholder="000.000.000-00" />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input name="telefone" value={formData.telefone} onChange={handleInputChange} className="input-field" placeholder="(00) 00000-0000" />
                        </div>

                        <div className="full-span">
                            <div className="drivers-btn-group">
                                <button type="submit" className="drivers-btn drivers-btn-save" disabled={loading}>
                                    <Save size={18} /> {formData.id ? 'Atualizar' : 'Salvar'}
                                </button>
                                {formData.id && (
                                    <button type="button" className="drivers-btn drivers-btn-cancel" onClick={clearForm}>
                                        <X size={18} /> Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Lista */}
                <div className="drivers-section-title">📋 Motoristas Cadastrados</div>

                <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto', borderRadius: '0' }}>
                    <table className="drivers-table-premium">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Nome</th>
                                <th>RG</th>
                                <th>CPF</th>
                                <th>Telefone</th>
                                <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.length === 0 ? (
                                <tr>
                                    <td colSpan="6">
                                        <div className="drivers-empty-state">
                                            <div className="empty-icon"><Users size={24} /></div>
                                            <p>Nenhum motorista cadastrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                drivers.map(d => (
                                    <tr key={d.id}>
                                        <td>{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="name-cell">{d.nome}</td>
                                        <td>{d.rg}</td>
                                        <td>{d.cpf}</td>
                                        <td>{d.telefone}</td>
                                        <td>
                                            <div className="drivers-table-actions">
                                                <button onClick={() => handleEdit(d)} title="Editar"><Edit2 size={14} /></button>
                                                <button className="danger-btn" onClick={() => setConfirmDelete(d.id)} title="Excluir"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DriversForm;
