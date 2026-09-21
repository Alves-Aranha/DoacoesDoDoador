import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import { Save, Trash2, Edit2, X, CheckCircle, AlertTriangle, Truck } from 'lucide-react';

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

const VehiclesForm = () => {
    const { user } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({ id: null, descricao: '', placa: '' });
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const showToast = (message, type = 'success') => setToast({ message, type });

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        const { data, error } = await supabase.from('veiculos').select('*').order('descricao');
        if (error) {
            console.error(error);
        } else {
            setVehicles(data || []);
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
                const { error } = await supabase.from('veiculos').update({
                    descricao: formData.descricao,
                    placa: formData.placa.toUpperCase()
                }).eq('id', formData.id);
                if (error) throw error;
                showToast('Veículo atualizado com sucesso!');
                await registerLog({ usuario_email: user?.email || '', acao: 'Alteração', modulo: 'Veículos', detalhes: `Veículo ${formData.descricao} (${formData.placa}) alterado` });
            } else {
                const { error } = await supabase.from('veiculos').insert({
                    descricao: formData.descricao,
                    placa: formData.placa.toUpperCase()
                });
                if (error) throw error;
                showToast('Veículo cadastrado com sucesso!');
                await registerLog({ usuario_email: user?.email || '', acao: 'Inclusão', modulo: 'Veículos', detalhes: `Novo veículo: ${formData.descricao} (${formData.placa})` });
            }
            setFormData({ id: null, descricao: '', placa: '' });
            fetchVehicles();
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar veículo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vehicle) => {
        setFormData({
            id: vehicle.id,
            descricao: vehicle.descricao,
            placa: vehicle.placa
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteConfirm = async () => {
        if (!confirmDelete) return;
        const { error } = await supabase.from('veiculos').delete().eq('id', confirmDelete);
        if (error) {
            showToast('Erro ao excluir veículo.', 'error');
        } else {
            const deleted = vehicles.find(v => v.id === confirmDelete);
            showToast('Veículo excluído com sucesso.');
            await registerLog({ usuario_email: user?.email || '', acao: 'Exclusão', modulo: 'Veículos', detalhes: `Veículo ${deleted?.descricao || ''} (${deleted?.placa || ''}) excluído` });
            fetchVehicles();
        }
        setConfirmDelete(null);
    };

    const clearForm = () => {
        setFormData({ id: null, descricao: '', placa: '' });
    };

    return (
        <div className="main-content-layout vehicles-page-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                .vehicles-page-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .vehicles-premium-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    max-width: 900px;
                    margin: 0 auto;
                    width: 100%;
                }
                .vehicles-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 28px;
                }
                .vehicles-header-premium .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .vehicles-header-premium h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                    letter-spacing: 0.5px;
                }
                .vehicles-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }
                .vehicles-section-title {
                    color: #065f46;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 24px 0 16px 0;
                }
                .vehicles-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                [data-theme='dark'] .vehicles-section-title {
                    color: #34d399;
                }
                [data-theme='dark'] .vehicles-section-title::after {
                    background: #334155;
                }

                .vehicles-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                    margin-bottom: 20px;
                }
                .vehicles-form-grid .full-span {
                    grid-column: 1 / -1;
                }

                .vehicles-btn-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 8px;
                }
                .vehicles-btn {
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
                .vehicles-btn-save { background: #2563eb; color: white; }
                .vehicles-btn-save:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .vehicles-btn-save:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
                .vehicles-btn-cancel { background: #64748b; color: white; }
                .vehicles-btn-cancel:hover { background: #475569; transform: translateY(-1px); }

                .vehicles-table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 12px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .vehicles-table-premium th {
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
                .vehicles-table-premium td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.875rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .vehicles-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .vehicles-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }
                .vehicles-table-premium .name-cell {
                    font-weight: 600;
                    color: var(--text-color);
                }
                .vehicles-table-premium .placa-badge {
                    display: inline-block;
                    background: var(--input-bg);
                    padding: 4px 12px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    border: 1px solid var(--border-color);
                    color: var(--text-color);
                }

                .vehicles-table-actions {
                    display: flex;
                    gap: 6px;
                    justify-content: center;
                }
                .vehicles-table-actions button {
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
                .vehicles-table-actions button:hover {
                    border-color: #10b981;
                    color: #10b981;
                    background: rgba(16, 185, 129, 0.05);
                }
                .vehicles-table-actions button.danger-btn:hover {
                    border-color: #ef4444;
                    color: #ef4444;
                    background: rgba(239, 68, 68, 0.05);
                }

                .vehicles-empty-state {
                    text-align: center;
                    padding: 40px 20px;
                    color: var(--text-muted, #94a3b8);
                }
                .vehicles-empty-state .empty-icon {
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

                .vehicles-counter-badge {
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
                    message="Confirma a exclusão deste veículo?"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}

            <div className="vehicles-premium-card">
                {/* Header */}
                <div className="vehicles-header-premium">
                    <div className="icon-wrapper">
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2>Cadastro de Veículos</h2>
                        <p className="subtitle">Gerenciar veículos para transporte de doações</p>
                    </div>
                    <span className="vehicles-counter-badge">{vehicles.length} registro(s)</span>
                </div>

                {/* Formulário */}
                <div className="vehicles-section-title">
                    {formData.id ? '✏️ Editando Veículo' : '➕ Novo Veículo'}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="vehicles-form-grid">
                        <div className="form-group">
                            <label>Data</label>
                            <input value={new Date().toLocaleDateString('pt-BR')} readOnly className="input-field input-readonly" />
                        </div>
                        <div className="form-group">
                            <label>Veículo (Descrição)</label>
                            <input name="descricao" value={formData.descricao} onChange={handleInputChange} required className="input-field" placeholder="Ex: Caminhão Mercedes Benz" />
                        </div>
                        <div className="form-group">
                            <label>Placa</label>
                            <input name="placa" value={formData.placa} onChange={handleInputChange} required className="input-field" placeholder="ABC-1D23" maxLength={8} style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }} />
                        </div>

                        <div className="full-span">
                            <div className="vehicles-btn-group">
                                <button type="submit" className="vehicles-btn vehicles-btn-save" disabled={loading}>
                                    <Save size={18} /> {formData.id ? 'Atualizar' : 'Salvar'}
                                </button>
                                {formData.id && (
                                    <button type="button" className="vehicles-btn vehicles-btn-cancel" onClick={clearForm}>
                                        <X size={18} /> Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Lista */}
                <div className="vehicles-section-title">📋 Veículos Cadastrados</div>

                <div className="table-container" style={{ maxHeight: '380px', overflowY: 'auto', borderRadius: '0' }}>
                    <table className="vehicles-table-premium">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Veículo</th>
                                <th>Placa</th>
                                <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="4">
                                        <div className="vehicles-empty-state">
                                            <div className="empty-icon"><Truck size={24} /></div>
                                            <p>Nenhum veículo cadastrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                vehicles.map(v => (
                                    <tr key={v.id}>
                                        <td>{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td className="name-cell">{v.descricao}</td>
                                        <td><span className="placa-badge">{v.placa}</span></td>
                                        <td>
                                            <div className="vehicles-table-actions">
                                                <button onClick={() => handleEdit(v)} title="Editar"><Edit2 size={14} /></button>
                                                <button className="danger-btn" onClick={() => setConfirmDelete(v.id)} title="Excluir"><Trash2 size={14} /></button>
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

export default VehiclesForm;
