import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Key, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { registerLog } from '../utils/logger';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const ChangePassword = () => {
    const { user } = useAuth();
    const [myPassword, setMyPassword] = useState('');
    const [confirmMyPassword, setConfirmMyPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    const handleSubmit = async (e) => {
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
            showToast('Senha alterada com sucesso!', 'success');
            await registerLog({
                usuario_email: user?.email,
                acao: 'Alteração',
                modulo: 'Perfil',
                detalhes: 'Alterou a própria senha'
            });
        } catch (error) {
            showToast('Erro ao alterar senha: ' + error.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column', gap: '24px', maxWidth: '500px', margin: '0 auto' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="form-section" style={{ background: 'linear-gradient(135deg, rgba(43, 108, 176, 0.05), rgba(43, 108, 176, 0.1))', border: '1px solid rgba(43, 108, 176, 0.2)', padding: '20px 30px', borderRadius: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ backgroundColor: 'var(--primary-pastel-blue)', padding: '14px', borderRadius: '15px', color: 'white', boxShadow: '0 4px 12px rgba(43, 108, 176, 0.3)' }}>
                        <Lock size={32} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--text-color)', fontSize: '1.6rem' }}>Alterar Senha</h2>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.7, color: 'var(--text-color)', fontSize: '0.9rem' }}>{user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="form-section" style={{ padding: '30px', borderRadius: 0 }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>
                    <div className="input-group">
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '6px', display: 'block' }}>Confirmar Nova Senha</label>
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
                        className="btn-action btn-primary"
                        disabled={submitting || !myPassword}
                        style={{ width: '100%', height: '45px', justifyContent: 'center', gap: '8px' }}
                    >
                        <Key size={18} /> {submitting ? 'Alterando...' : 'Alterar Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
