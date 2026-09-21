import React, { useState } from 'react';
import { Search, Printer, FileText, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import ComunicacaoInternaTransportesModal from './ComunicacaoInternaTransportesModal';
import { useAuth } from '../contexts/AuthContext';

const RelatorioComunicacaoInterna = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { user, perfil } = useAuth();

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const qs = searchQuery.trim();
            // Usamos !inner para garantir que o filtro de nome funcione como um filtro real na busca
            let query = supabase.from('doacoes').select('*, doadores(nome, regiao, logradouro, endereco, bairro, complemento, cidade, estado)');
            
            if (/^\d+$/.test(qs)) {
                const padded = qs.padStart(6, '0');
                query = query.eq('codigo_doacao', padded);
            } else {
                // Busca o doador pelo nome primeiro para pegar os códigos
                const { data: donorData } = await supabase.from('doadores').select('codigo_doador').ilike('nome', `%${qs}%`);
                if (donorData && donorData.length > 0) {
                    const ids = donorData.map(d => d.codigo_doador);
                    query = query.in('codigo_doador', ids);
                } else {
                    // Se não achar doador, tenta buscar pelo nome direto na doação (caso o join falhe)
                    query = query.ilike('doador_nome', `%${qs}%`);
                }
            }

            const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
            if (error) throw error;
            if (data && data.length > 0) {
                const codes = data.map(d => d.codigo_doacao);
                const { data: itemsData } = await supabase.from('itens_doacao').select('*').in('id_doacao', codes);
                const itemsByCode = {};
                (itemsData || []).forEach(item => {
                    if (!itemsByCode[item.id_doacao]) itemsByCode[item.id_doacao] = [];
                    itemsByCode[item.id_doacao].push(item);
                });
                data.forEach(d => {
                    d.itens_doacao = itemsByCode[d.codigo_doacao] || [];
                });
            }
            setResults(data || []);
        } catch (err) {
            console.error(err);
            alert('Erro ao buscar doações.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (donation) => {
        setSelectedDonation(donation);
        setShowModal(true);
    };

    const formatDate = (d) => d ? d.split('-').reverse().join('/') : '---';

    return (
        <div className="main-content-layout rel-ci-premium">
            <style>{`
                .rel-ci-premium {
                    justify-content: center;
                }
                .rel-ci-premium .rel-comp-card {
                    max-width: 860px;
                    width: auto;
                    margin: 0 auto;
                }
                .rel-ci-premium .rel-comp-filters {
                    justify-content: center;
                }
                .rel-ci-premium .input-field::placeholder {
                    color: var(--text-muted, #94a3b8);
                    opacity: 0.8;
                }
                .rel-btn-primary { background: #2563eb; color: white; }
                .rel-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .rel-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
            `}</style>
            {showModal && (
                <ComunicacaoInternaTransportesModal 
                    donation={selectedDonation} 
                    onClose={() => setShowModal(false)} 
                />
            )}

            <div className="rel-comp-card">
                <div className="rel-header-premium">
                    <div className="icon-wrapper" style={{background: 'linear-gradient(135deg, #d97706, #92400e)'}}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2>Emissão de Comunicação Interna</h2>
                        <p className="subtitle">Gere o documento de transportes para doações (Canceladas, Remarcadas ou Baixadas)</p>
                    </div>
                </div>

                <form className="rel-comp-filters" onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '40px', width: '100%' }}
                            placeholder="Digite o nome do doador ou código da doação..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="rel-btn rel-btn-primary" disabled={loading} style={{ height: '42px', padding: '0 25px', fontSize: '0.8rem', flexShrink: 0 }}>
                        {loading ? '...' : 'PESQUISAR'}
                    </button>
                </form>

                <div className="table-container" style={{background: 'var(--card-bg)', borderRadius: 0, marginTop: '20px'}}>
                    <table className="rel-table-premium">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Data Doação</th>
                                <th>Doador</th>
                                <th>Status</th>
                                <th>RETIRADA</th>
                                <th style={{textAlign: 'center'}}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((row) => (
                                <tr key={row.codigo_doacao}>
                                    <td style={{fontWeight: 700, color: 'var(--primary-color)'}}>{row.codigo_doacao}</td>
                                    <td>{formatDate(row.data_doacao)}</td>
                                    <td>{Array.isArray(row.doadores) ? row.doadores[0]?.nome : (row.doadores?.nome || row.doador_nome)}</td>
                                    <td>
                                        <span className={`badge ${row.status === 'Cancelada' ? 'badge-danger' : (row.status === 'Remarcada' ? 'badge-warning' : 'badge-success')}`} style={{minWidth: '100px', textAlign: 'center'}}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td>{formatDate(row.data_retirada)}</td>
                                    <td style={{textAlign: 'center'}}>
                                        <button className="btn-action btn-primary" onClick={() => handlePrint(row)} style={{padding: '5px 15px', fontSize: '0.75rem'}}>
                                            <Printer size={14} /> GERAR CI
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {results.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="6" style={{textAlign: 'center', padding: '30px', opacity: 0.5}}>
                                        Pesquise por doações para emitir a Comunicação Interna.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RelatorioComunicacaoInterna;
