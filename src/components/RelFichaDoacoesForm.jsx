import React, { useState } from 'react';
import { Printer, Search, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import RelFichaDoacoes from './RelFichaDoacoes';

const RelFichaDoacoesForm = () => {
    const { user } = useAuth();
    const [donationCode, setDonationCode] = useState('');
    const [donorCode, setDonorCode]       = useState('');
    const [donation, setDonation]         = useState(null);
    const [loading, setLoading]           = useState(false);
    const [showModal, setShowModal]       = useState(false);

    const normalizeCode = (value) => value.trim().padStart(6, '0');

    const mapDonation = (data) => ({
        ...data,
        codigo:       data.codigo_doacao,
        codigoDoador: data.codigo_doador,
        nomeDoador:   data.doadores?.nome || '',
        itens:        data.itens_doacao || [],
    });

    const handleSearch = async () => {
        const codeDonation = donationCode.trim();
        const codeDonor    = donorCode.trim();

        if (!codeDonation && !codeDonor) {
            alert('Informe o Código da Doação ou o Código do Doador.');
            return;
        }

        setLoading(true);
        setDonation(null);

        try {
            let query = supabase
                .from('doacoes')
                .select(`
                    *,
                    doadores (*)
                `);

            if (codeDonation) {
                query = query
                    .eq('codigo_doacao', normalizeCode(codeDonation))
                    .maybeSingle();
            } else {
                query = query
                    .eq('codigo_doador', normalizeCode(codeDonor))
                    .order('codigo_doacao', { ascending: false })
                    .limit(1)
                    .maybeSingle();
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data) {
                alert('Nenhuma doação encontrada para o código informado.');
                return;
            }

            const { data: itens } = await supabase.from('itens_doacao').select('*').eq('id_doacao', data.codigo_doacao);
            data.itens_doacao = itens || [];

            setDonation(mapDonation(data));
            setShowModal(true);
        } catch (err) {
            console.error('Erro ao buscar ficha:', err);
            alert('Erro ao realizar a busca. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const userLoggerName = user?.email || '';

    return (
        <div className="main-content-layout" style={{ padding: '24px' }}>
            <div
                className="card-premium"
                style={{ maxWidth: '700px', margin: '0 auto', padding: '30px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                    <div style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(15,23,42,0.35)',
                    }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                            Ficha de Doações
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.65 }}>
                            Impressão em 80 colunas para Epson FX-890 (papel contínuo)
                        </p>
                    </div>
                </div>

                <div style={{
                    background: 'var(--input-bg)',
                    padding: '22px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '18px',
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.83rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Cód. Doação
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: 000080"
                                value={donationCode}
                                onChange={(e) => setDonationCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.83rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}>
                                Cód. Doador
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: 000123"
                                value={donorCode}
                                onChange={(e) => setDonorCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-action btn-primary"
                        style={{
                            width: '100%',
                            height: '44px',
                            background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
                            fontSize: '0.9rem',
                            letterSpacing: '0.5px',
                        }}
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        <Search size={18} />
                        {loading ? 'BUSCANDO...' : 'BUSCAR FICHA'}
                    </button>
                </div>

                <div style={{
                    marginTop: '18px',
                    padding: '14px 16px',
                    background: 'var(--input-bg)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                    opacity: 0.75,
                    lineHeight: 1.6,
                }}>
                    <strong>Instruções:</strong><br />
                    • Informe o <em>Código da Doação</em> para busca exata.<br />
                    • Informe o <em>Código do Doador</em> para buscar a última doação registrada.
                </div>
            </div>

            {showModal && (
                <RelFichaDoacoes
                    donation={donation}
                    userLoggerName={userLoggerName}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default RelFichaDoacoesForm;
