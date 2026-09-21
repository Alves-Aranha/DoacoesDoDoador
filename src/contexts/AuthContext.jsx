import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [perfil, setperfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const initialized = useRef(false);

    const loadperfil = useCallback(async (userId, userEmail) => {
        if (!userId) return null;
        console.log(`AuthContext: Buscando perfil para ${userEmail}...`);

        const withTimeout = (promise, ms = 5000) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout na consulta')), ms))
            ]);
        };

        try {
            const profile = await withTimeout(api.auth.profile(userEmail));
            if (profile && !profile.error) {
                return profile;
            }
            return null;
        } catch (err) {
            console.error('AuthContext: Erro ou Timeout no carregamento:', err.message);
            return null;
        }
    }, []);

    const lastFetchedUserId = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const failsafe = setTimeout(() => {
            if (isMounted && loading) {
                console.warn('Auth Failsafe disparou: O carregamento estava demorando demais.');
                setLoading(false);
            }
        }, 10000);

        const restore = async () => {
            // Só restaura o usuário do app se existir uma sessão Supabase real.
            // Sem isso, um token expirado deixaria a tela "logada" mas todas as
            // consultas rodariam como anon -> permission denied em todas as telas.
            const { data: supabaseSession } = await supabase.auth.getSession();
            const stored = localStorage.getItem('auth_session');

            if (!supabaseSession?.session) {
                localStorage.removeItem('auth_session');
                sessionStorage.clear();
                if (isMounted) {
                    setUser(null);
                    setperfil(null);
                    setLoading(false);
                    clearTimeout(failsafe);
                }
                return;
            }

            if (stored) {
                try {
                    const session = JSON.parse(stored);
                    if (isMounted && !lastFetchedUserId.current) {
                        setUser(session.user);
                        if (lastFetchedUserId.current !== session.user.id) {
                            loadperfil(session.user.id, session.user.email).then(p => {
                                if (isMounted) {
                                    setperfil(p);
                                    lastFetchedUserId.current = session.user.id;
                                }
                            });
                        }
                    }
                } catch {
                    localStorage.removeItem('auth_session');
                }
            }

            if (isMounted) {
                setLoading(false);
                clearTimeout(failsafe);
            }
        };

        restore();

        return () => { isMounted = false; };
    }, [loadperfil]);

    const signIn = async (email, password) => {
        setError(null);
        try {
            const result = await api.auth.login(email, password);
            const session = { user: result.user, token: result.token };
            localStorage.setItem('auth_session', JSON.stringify(session));
            setUser(result.user);
            const p = await loadperfil(result.user.id, result.user.email);
            setperfil(p);
        } catch (e) {
            setError(e.message);
            throw e;
        }
    };

    const signUp = async (email, password) => {
        setError(null);
        const profile = await api.auth.profile(email);
        if (!profile || profile.error) {
            throw new Error('Apenas e-mails autorizados pelo Administrador podem se cadastrar.');
        }
        await signIn(email, password);
    };

    const signOut = async () => {
        console.log('AuthContext: Iniciando logout...');
        await supabase.auth.signOut().catch(() => {});
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setperfil(null);
        window.location.assign('/');
    };

    const isAdmin = perfil?.role === 'admin' || user?.email === 'virgo.aranha@gmail.com';
    const isSuporte = (perfil?.departamento || '').toString().trim().toLowerCase() === 'suporte' || user?.email === 'virgo.aranha@gmail.com';
    const dept = (perfil?.departamento || (isAdmin ? 'Suporte' : '')).toString().trim().toLowerCase();
    const isDoacoes = dept === 'doações';
    const isTransportes = dept === 'transportes';
    const isDiretoria = dept === 'diretoria';
    const AGRADECIMENTO_EMAILS = ['eli.almeida7306@gmail.com', 'shirlinhaesantos@gmail.com'];
    const canAccessAgradecimento = isAdmin || AGRADECIMENTO_EMAILS.includes(user?.email) || (!isDoacoes && (isSuporte || isDiretoria));

    return (
        <AuthContext.Provider value={{ 
            user, 
            perfil: perfil || (user?.email === 'virgo.aranha@gmail.com' ? { role: 'admin', departamento: 'Suporte', email: user.email } : null), 
            loading, 
            error, 
            signIn, 
            signUp, 
            signOut, 
            isAdmin,
            isSuporte,
            isDoacoes,
            isTransportes,
            isDiretoria,
            canAccessAgradecimento
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    return context;
}
