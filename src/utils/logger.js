import { api } from '../api';

export const registerLog = async ({ usuario_email, acao, modulo, detalhes = '' }) => {
    try {
        const terminal = `${window.navigator.userAgent.slice(0, 100)} (${window.location.hostname})`;
        await api.logs.register({
            usuario_email,
            acao,
            modulo,
            detalhes,
            terminal
        });
    } catch (err) {
        console.error('Falha ao processar log:', err);
    }
};











