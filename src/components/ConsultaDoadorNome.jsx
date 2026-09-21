import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Search, CheckCircle, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
    React.useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const fieldLabel = {
    color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase',
    display: 'block', fontSize: '0.62rem', letterSpacing: '0.02em', marginBottom: 4,
};

const formatCep = (cep) => {
    if (!cep) return '';
    const digits = String(cep).replace(/\D/g, '');
    if (digits.length === 8) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return String(cep);
};

const formatMapa = (mapa) => {
    if (mapa === null || mapa === undefined || mapa === '') return '';
    const num = Number(mapa);
    if (!Number.isNaN(num)) return String(num).padStart(3, '0');
    return String(mapa);
};

const ConsultaDoadorNome = () => {
    const [searchName, setSearchName] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

    // Busca incremental: à medida que o usuário digita, os nomes vão surgindo na Treeview.
    useEffect(() => {
        let active = true;
        const term = searchName.trim();

        if (!term) {
            setResults([]);
            setSearched(false);
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('doadores')
                    .select('codigo_doador, nome, endereco, cep, bairro, cidade, mapa')
                    .ilike('nome', `%${term}%`)
                    .order('nome');
                if (error) throw error;
                if (!active) return;
                setResults(data || []);
                setSearched(true);
            } catch (err) {
                console.error('Erro na consulta de doadores:', err);
                if (active) showToast('Erro ao consultar banco de dados.', 'error');
            } finally {
                if (active) setLoading(false);
            }
        }, 300);

        return () => { active = false; clearTimeout(timer); };
    }, [searchName, showToast]);

    const handleClear = () => {
        setSearchName('');
        setResults([]);
        setSearched(false);
    };

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style>{`
                .cdn-table th {
                    position: sticky; top: 0; z-index: 1;
                    background: var(--primary-pastel-blue);
                    color: #ffffff;
                }
                .cdn-table tbody tr:hover td {
                    background: var(--primary-soft);
                }
                .cdn-cod-cell {
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    color: var(--primary-color);
                }
                .cdn-mapa-cell {
                    font-family: 'JetBrains Mono', monospace;
                    text-align: center;
                    color: var(--accent-color);
                    font-weight: 700;
                }
            `}</style>

            <div className="donor-card" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', borderRadius: 0 }}>
                {/* Parâmetro da Consulta */}
                <div className="glass-card" style={{
                    marginBottom: '25px',
                    padding: '20px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 320px' }}>
                            <label style={fieldLabel}>Nome do Doador</label>
                            <input
                                className="input-field"
                                style={{ width: '100%' }}
                                placeholder="Digite as letras do nome..."
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            className="btn-action btn-secondary"
                            style={{ height: '42px', flexShrink: 0 }}
                            onClick={handleClear}
                            disabled={!searchName && !searched}
                        >
                            <X size={18} /> Limpar
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <Search size={14} />
                        {loading
                            ? <span>Consultando...</span>
                            : searched
                                ? <span>{results.length} doador(es) encontrado(s).</span>
                                : <span>Aguardando digitação...</span>}
                    </div>
                </div>

                {/* Resultado da Consulta (Treeview) */}
                <div className="table-container" style={{
                    minHeight: '250px',
                    maxHeight: '55vh',
                    overflowY: 'auto',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                }}>
                    <table className="donation-items-table cdn-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center', width: '90px' }}>Cód.Doador</th>
                                <th>Nome</th>
                                <th>Endereço</th>
                                <th style={{ textAlign: 'center', width: '110px' }}>Cep</th>
                                <th>Bairro</th>
                                <th>Cidade</th>
                                <th style={{ textAlign: 'center', width: '100px' }}>Mapa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!searched && !loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Digite o Nome do Doador para listar os registros.</td></tr>
                            ) : loading && results.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Consultando...</td></tr>
                            ) : searched && results.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Nenhum doador encontrado com esses caracteres.</td></tr>
                            ) : (
                                results.map((d) => (
                                    <tr key={d.codigo_doador} style={{ background: 'transparent' }}>
                                        <td className="cdn-cod-cell" style={{ textAlign: 'center' }}>{String(d.codigo_doador ?? '').padStart(6, '0')}</td>
                                        <td style={{ fontWeight: 600 }}>{d.nome || ''}</td>
                                        <td>{d.endereco || d.logradouro || ''}</td>
                                        <td style={{ textAlign: 'center' }}>{formatCep(d.cep)}</td>
                                        <td>{d.bairro || ''}</td>
                                        <td>{d.cidade || ''}</td>
                                        <td className="cdn-mapa-cell">{formatMapa(d.mapa)}</td>
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

export default ConsultaDoadorNome;
