import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Trash2, Shield, User, Mail, Plus, Users, ShieldCheck, ShieldAlert, Clock, CheckCircle2, X, AlertTriangle, CheckCircle, UserCheck, UserX, Power, Key, Lock } from 'lucide-react';
import { registerLog } from '../utils/logger';

// ─── Toast Notification ───────────────────────────────────────────────────────
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

// ─── Confirm Modal ────────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel, confirmText = "Confirmar", isDanger = false }) => (
    <div className="modal-overlay">
        <div className="modal-box">
            <div className="modal-icon">
                {isDanger ? <AlertTriangle size={36} color="var(--danger-color)" /> : <Shield size={36} color="var(--primary-pastel-blue)" />}
            </div>
            <p className="modal-message">{message}</p>
            <div className="modal-actions">
                <button className={`btn-action ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                    {isDanger ? <Trash2 size={16} /> : <Shield size={16} />} <span>{confirmText}</span>
                </button>
                <button className="btn-action btn-secondary" onClick={onCancel}><X size={16} /> <span>Cancelar</span></button>
            </div>
        </div>
    </div>
);

const UserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState('user');
    const [newDept, setNewDept] = useState('Doações');
    const [submitting, setSubmitting] = useState(false);
    const [myPassword, setMyPassword] = useState('');
    const [confirmMyPassword, setConfirmMyPassword] = useState('');
    const [toast, setToast] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const { isAdmin, user } = useAuth();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('perfis_usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Erro detalhado supabase:', error);
                throw error;
            }
            setUsuarios(data || []);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            showToast('Erro ao carregar usuários: ' + (error.message || 'Erro de conexão'), 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsuarios();
        }
    }, [isAdmin]);

    const handleAddUsuario = async (e) => {
        e.preventDefault();
        if (!newEmail) return;

        try {
            setSubmitting(true);
            const { error } = await supabase
                .from('perfis_usuarios')
                .insert([{
                    email: newEmail.toLowerCase().trim(),
                    role: newRole,
                    departamento: newDept,
                    status: 'Ativo'
                }]);

            if (error) throw error;

            setNewEmail('');
            setNewDept('Doações');
            fetchUsuarios();
            showToast('E-mail autorizado com sucesso!', 'success');

            await registerLog({
                usuario_email: user?.email,
                acao: 'Inclusão',
                modulo: 'Usuários',
                detalhes: `Autorizou e-mail: ${newEmail.toLowerCase().trim()} (${newRole} - ${newDept})`
            });
        } catch (error) {
            showToast('Erro: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUsuario = async (id, email) => {
        setConfirmAction({
            message: `Tem certeza que deseja remover o acesso de "${email}"?`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('perfis_usuarios')
                        .delete()
                        .eq('id', id);

                    if (error) throw error;
                    fetchUsuarios();
                    showToast('Acesso revogado com sucesso.', 'success');

                    await registerLog({
                        usuario_email: user?.email,
                        acao: 'Exclusão',
                        modulo: 'Usuários',
                        detalhes: `Revogou acesso do e-mail: ${email}`
                    });
                } catch (error) {
                    showToast('Erro ao remover usuário.', 'error');
                }
                setConfirmAction(null);
            },
            isDanger: true,
            confirmText: "Revogar Acesso"
        });
    };

    const handleToggleRole = async (id, email, currentRole) => {
        const newRoleVal = currentRole === 'admin' ? 'user' : 'admin';
        setConfirmAction({
            message: `Alterar privilégios de "${email}" para ${newRoleVal === 'admin' ? 'Administrador' : 'Usuário padrão'}?`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase
                        .from('perfis_usuarios')
                        .update({ role: newRoleVal })
                        .eq('id', id);

                    if (error) throw error;
                    fetchUsuarios();
                    showToast('Privilégios atualizados.', 'success');

                    await registerLog({
                        usuario_email: user?.email,
                        acao: 'Alteração',
                        modulo: 'Usuários',
                        detalhes: `Alterou nível de ${email} para ${newRoleVal}`
                    });
                } catch (error) {
                    showToast('Erro ao alterar privilégios.', 'error');
                }
                setConfirmAction(null);
            },
            isDanger: false,
            confirmText: "Alterar Nível"
        });
    };

    const handleResetPassword = async (email) => {
        setConfirmAction({
            message: `Deseja enviar um e-mail de redefinição de senha para "${email}"?`,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin
                    });
                    if (error) throw error;
                    showToast('E-mail de recuperação enviado com sucesso.', 'success');
                    
                    await registerLog({
                        usuario_email: user?.email,
                        acao: 'Alteração',
                        modulo: 'Usuários',
                        detalhes: `Solicitou redefinição de senha para: ${email}`
                    });
                } catch (error) {
                    showToast('Erro ao solicitar redefinição: ' + error.message, 'error');
                }
                setConfirmAction(null);
            },
            isDanger: false,
            confirmText: "Enviar E-mail"
        });
    };

    const handleUpdateMyPassword = async (e) => {
        e.preventDefault();
        if (myPassword !== confirmMyPassword) {
            return showToast('As senhas não coincidem.', 'error');
        }
        if (myPassword.length < 6) {
            return showToast('A senha deve ter pelo menos 6 caracteres.', 'error');
        }

        try {
            setSubmitting(true);
            const { error } = await supabase.auth.updateUser({ password: myPassword });
            if (error) throw error;
            
            setMyPassword('');
            setConfirmMyPassword('');
            showToast('Sua senha foi alterada com sucesso!', 'success');

            await registerLog({
                usuario_email: user?.email,
                acao: 'Alteração',
                modulo: 'Usuários',
                detalhes: `Alterou a própria senha`
            });
        } catch (error) {
            showToast('Erro ao alterar senha: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChangeDept = async (id, email, newDeptVal) => {
        try {
            const { error } = await supabase
                .from('perfis_usuarios')
                .update({ departamento: newDeptVal })
                .eq('id', id);

            if (error) throw error;
            fetchUsuarios();
            showToast('Departamento atualizado.', 'success');

            await registerLog({
                usuario_email: user?.email,
                acao: 'Alteração',
                modulo: 'Usuários',
                detalhes: `Alterou departamento de ${email} para ${newDeptVal}`
            });
        } catch (error) {
            showToast('Erro ao alterar departamento.', 'error');
        }
    };

    const handleToggleStatus = async (id, email, currentStatus) => {
        const newStatus = currentStatus === 'Inativo' ? 'Ativo' : 'Inativo';
        try {
            const { error } = await supabase
                .from('perfis_usuarios')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            fetchUsuarios();
            showToast(`Usuário ${newStatus === 'Ativo' ? 'ativado' : 'desativado'} com sucesso.`, 'success');

            await registerLog({
                usuario_email: user?.email,
                acao: 'Alteração',
                modulo: 'Usuários',
                detalhes: `Alterou status de ${email} para ${newStatus}`
            });
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            showToast('Erro ao alterar status. Verifique se a coluna existe.', 'error');
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px', color: 'var(--text-color)' }}>
                <ShieldAlert size={64} color="var(--danger-color)" />
                <h2 style={{ margin: 0 }}>Acesso Negado</h2>
                <p style={{ opacity: 0.7 }}>Apenas administradores podem gerenciar usuários do sistema.</p>
            </div>
        );
    }

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column', gap: '24px' }}>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {confirmAction && (
                <ConfirmModal
                    message={confirmAction.message}
                    onConfirm={confirmAction.onConfirm}
                    onCancel={() => setConfirmAction(null)}
                    confirmText={confirmAction.confirmText}
                    isDanger={confirmAction.isDanger}
                />
            )}



            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>

                <div className="form-section" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Shield size={20} color="var(--primary-pastel-blue)" /> Usuários Autorizados
                        </h3>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: 'var(--card-bg)', padding: '4px 12px', borderRadius: '20px', color: 'var(--primary-pastel-blue)' }}>
                            {usuarios.length} Total
                        </span>
                    </div>

                    <div className="table-container" style={{ margin: 0, borderRadius: 0, flex: 1, overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-color)', opacity: 0.6 }}>
                                <div className="loader" style={{ marginBottom: '20px' }}></div>
                                <p>Carregando base de usuários...</p>
                            </div>
                        ) : usuarios.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', opacity: 0.5 }}>
                                <User size={48} style={{ marginBottom: '16px' }} />
                                <p>Nenhum usuário autorizado encontrado.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead style={{ backgroundColor: 'var(--bg-color)' }}>
                                    <tr>
                                        <th>Identificação</th>
                                        <th style={{ textAlign: 'center', width: '130px' }}>Departamento</th>
                                        <th style={{ textAlign: 'center', width: '100px' }}>Nível</th>
                                        <th style={{ textAlign: 'center', width: '110px' }}>Vínculo</th>
                                        <th style={{ textAlign: 'center', width: '110px' }}>Status</th>
                                        <th style={{ width: '100px' }}>Data</th>
                                        <th style={{ textAlign: 'center', width: '160px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((u) => (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        backgroundColor: u.role === 'admin' ? 'rgba(43, 108, 176, 0.15)' : 'rgba(0,0,0,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: u.role === 'admin' ? '#2563eb' : 'inherit'
                                                    }}>
                                                        {u.role === 'admin' ? <ShieldCheck size={20} /> : <User size={20} />}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{u.email}</span>
                                                        <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{u.user_id ? 'Conta Vinculada' : 'Aguardando Cadastro'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <select 
                                                    className="input-field" 
                                                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', width: 'auto', minWidth: '120px' }}
                                                    value={u.departamento || 'Doações'}
                                                    onChange={(e) => handleChangeDept(u.id, u.email, e.target.value)}
                                                >
                                                    <option value="Doações">Doações</option>
                                                    <option value="Transportes">Transportes</option>
                                                    <option value="Diretoria">Diretoria</option>
                                                    <option value="Suporte">Suporte</option>
                                                </select>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                                                    {u.role === 'admin' ? 'Admin' : 'Usuário'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', backgroundColor: u.user_id ? 'rgba(39, 103, 73, 0.1)' : 'rgba(214, 158, 11, 0.1)', color: u.user_id ? 'var(--success-color)' : '#b45309', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    {u.user_id ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                                    {u.user_id ? 'Vinculado' : 'Pendente'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '6px', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '12px', 
                                                    backgroundColor: u.status === 'Inativo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                                                    color: u.status === 'Inativo' ? 'var(--danger-color)' : 'var(--success-color)', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: '600' 
                                                }}>
                                                    {u.status === 'Inativo' ? <UserX size={14} /> : <UserCheck size={14} />}
                                                    {u.status === 'Inativo' ? 'Inativo' : 'Ativo'}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', opacity: 0.8, whiteSpace: 'nowrap' }}>
                                                {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : 'Data N/D'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-buttons" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        className="btn-icon"
                                                        title={u.status === 'Inativo' ? 'Ativar Usuário' : 'Desativar Usuário'}
                                                        onClick={() => handleToggleStatus(u.id, u.email, u.status)}
                                                        style={{ color: u.status === 'Inativo' ? 'var(--danger-color)' : 'var(--success-color)' }}
                                                    >
                                                        <Power size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title="Redefinir Senha (E-mail)"
                                                        onClick={() => handleResetPassword(u.email)}
                                                        style={{ color: 'var(--primary-pastel-blue)' }}
                                                    >
                                                        <Key size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-icon"
                                                        title={u.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                        onClick={() => handleToggleRole(u.id, u.email, u.role)}
                                                        style={{ 
                                                            color: u.role === 'admin' ? 'var(--primary-pastel-blue)' : '#4b5563', 
                                                            opacity: 1,
                                                            backgroundColor: u.role === 'admin' ? 'rgba(43, 108, 176, 0.1)' : 'transparent'
                                                        }}
                                                    >
                                                        <Shield size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-icon danger"
                                                        title="Revogar Acesso"
                                                        onClick={() => handleDeleteUsuario(u.id, u.email)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-section" style={{ position: 'sticky', top: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-pastel-blue)' }}>
                            <UserPlus size={20} /> Autorizar E-mail
                        </h3>

                        <form onSubmit={handleAddUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Endereço de E-mail</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        type="email"
                                        className="input-field"
                                        style={{ paddingLeft: '38px' }}
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        required
                                        placeholder="exemplo@email.com"
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Nível de Acesso</label>
                                <select
                                    className="input-field"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                >
                                    <option value="user">Usuário padrão</option>
                                    <option value="admin">Administrador (Total)</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Departamento</label>
                                <select
                                    className="input-field"
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                >
                                    <option value="Doações">Doações</option>
                                    <option value="Transportes">Transportes</option>
                                    <option value="Diretoria">Diretoria</option>
                                    <option value="Suporte">Suporte</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                                style={{ width: '100%', marginTop: '10px', height: '45px', justifyContent: 'center', boxShadow: '0 4px 6px rgba(43, 108, 176, 0.2)' }}
                            >
                                {submitting ? (
                                    'Processando...'
                                ) : (
                                    <>
                                        <Plus size={18} /> Autorizar Acesso
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="form-section">
                        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-pastel-blue)', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                            <Lock size={20} /> Alterar Minha Senha
                        </h3>
                        <form onSubmit={handleUpdateMyPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ paddingLeft: '38px' }}
                                        value={myPassword}
                                        onChange={(e) => setMyPassword(e.target.value)}
                                        required
                                        placeholder="No mínimo 6 caracteres"
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Confirmar Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                    <input
                                        type="password"
                                        className="input-field"
                                        style={{ paddingLeft: '38px' }}
                                        value={confirmMyPassword}
                                        onChange={(e) => setConfirmMyPassword(e.target.value)}
                                        required
                                        placeholder="Repita a nova senha"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="btn-action btn-secondary"
                                disabled={submitting || !myPassword}
                                style={{ width: '100%', marginTop: '10px', height: '40px', justifyContent: 'center' }}
                            >
                                <Key size={18} /> Atualizar Senha
                            </button>
                        </form>
                    </div>
                </aside>

            </div>
        </div>
    );
};

export default UserManagement;
