import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerLog } from '../utils/logger';
import './Login.css';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const maxRetries = 3;
        let attempt = 0;

        const performAuth = async () => {
            try {
                if (isLogin) {
                    await signIn(email, password);
                    await registerLog({
                        usuario_email: email,
                        acao: 'Login',
                        modulo: 'Autenticação',
                        detalhes: 'Usuário realizou login no sistema'
                    });
                } else {
                    await signUp(email, password);
                    await registerLog({
                        usuario_email: email,
                        acao: 'Cadastro',
                        modulo: 'Autenticação',
                        detalhes: 'Novo usuário criou conta no sistema'
                    });
                    alert('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta (se aplicável) ou tente fazer o login.');
                    setIsLogin(true);
                }
            } catch (err) {
                // Se for erro de rede (Failed to fetch), tenta novamente
                if (attempt < maxRetries && (err.message?.includes('fetch') || err.message?.includes('Network'))) {
                    attempt++;
                    console.warn(`Tentativa de login ${attempt} falhou por rede. Tentando novamente...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Delay progressivo
                    return performAuth();
                }
                throw err;
            }
        };

        try {
            await performAuth();
        } catch (err) {
            console.error('Erro final no login:', err);
            setError(err.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass">
                <div className="login-header">
                    <div className="logo-placeholder">BM</div>
                    <h1>Doações BM</h1>
                    <p>{isLogin ? 'Faça login para acessar o sistema' : 'Crie sua conta administrativa'}</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>E-mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className="login-footer">
                    <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
