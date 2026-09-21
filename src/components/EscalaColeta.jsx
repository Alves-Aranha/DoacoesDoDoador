import React from 'react';
import { X, Calendar } from 'lucide-react';

const ROWS = [
    { d: 'segunda/terça/sexta', r: 'Penha', p: 'semanal' },
    { d: 'segunda/terça:', r: 'Ponte Grande', p: 'semanal' },
    { d: 'quarta-feira', r: 'Tatuapé/Sapopemba', p: 'semanal' },
    { d: 'quinta-feira', r: 'Itaquera', p: 'quinzenal' },
    { d: 'quinta-feira', r: 'Zona Oeste', p: 'mensal' },
    { d: 'quinta-feira', r: 'Zona Norte', p: 'mensal' },
    { d: 'sábado', r: 'à definir', p: 'eventual' },
];

const EscalaColeta = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            right: '20px',
            transform: 'translateY(-50%)',
            width: '520px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-color)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ background: 'var(--primary-pastel-blue)', padding: '12px 16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>ESCALA DE COLETA</span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'rgba(255,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '8px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
                    title="Fechar"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
                <table style={{ width: '100%', fontSize: '0.72rem', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '8px 6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Dias da semana:</th>
                            <th style={{ padding: '8px 6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Região:</th>
                            <th style={{ padding: '8px 6px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Período:</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ROWS.map((s, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '8px 6px', fontWeight: 600, color: 'var(--text-color)' }}>{s.d}</td>
                                <td style={{ padding: '8px 6px', color: 'var(--primary-color)', fontWeight: 700 }}>{s.r}</td>
                                <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>{s.p}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EscalaColeta;
