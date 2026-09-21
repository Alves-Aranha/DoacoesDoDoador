import React, { useState } from 'react';
import { Printer, Search, AlignLeft } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import DoacaoFichaMatricial from './DoacaoFichaMatricial';

const ReportDoacaoFichaMatricial = () => {
    const { user } = useAuth();
    const [donationCode, setDonationCode] = useState('');
    const [donorCode, setDonorCode]       = useState('');
    const [donation, setDonation]         = useState(null);
    const [loading, setLoading]           = useState(false);
    const [showModal, setShowModal]       = useState(false);
    const [searchInfo, setSearchInfo]     = useState('');

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
        setSearchInfo('');

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

            const { data: itemData } = await supabase.from('itens_doacao').select('*').eq('id_doacao', data.codigo_doacao);
            data.itens_doacao = itemData || [];

            setDonation(mapDonation(data));
            setSearchInfo(
                codeDonation
                    ? 'Busca por Código da Doação'
                    : 'Busca por Código do Doador — última doação localizada'
            );
        } catch (err) {
            console.error('Erro ao buscar ficha matricial:', err);
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
                {/* Cabeçalho do card */}
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
                        <AlignLeft size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                            Ficha de Doação — Matricial
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.65 }}>
                            Impressão em 80 colunas para Epson FX-890 (papel contínuo)
                        </p>
                    </div>
                </div>

                {/* Painel de busca */}
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
                                Código da Doação
                            </label>
                            <input
                                id="ficha-mat-codigo-doacao"
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
                                Código do Doador
                            </label>
                            <input
                                id="ficha-mat-codigo-doador"
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
                        id="ficha-mat-btn-buscar"
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

                    {/* Resultado encontrado */}
                    {donation && (
                        <div style={{
                            marginTop: '22px',
                            paddingTop: '20px',
                            borderTop: '1px dashed var(--border-color)',
                        }}>
                            <p style={{
                                margin: '0 0 14px',
                                fontSize: '0.78rem',
                                opacity: 0.65,
                                fontStyle: 'italic',
                            }}>
                                ✓ {searchInfo}
                            </p>

                            {/* Mini-ficha informativa */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                marginBottom: '20px',
                                background: 'var(--card-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '14px 16px',
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.55 }}>
                                        Cód. Doação
                                    </span>
                                    <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem' }}>
                                        {donation.codigo_doacao}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.55 }}>
                                        Cód. Doador
                                    </span>
                                    <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem' }}>
                                        {donation.doadores?.codigo_doador || donation.codigo_doador}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.55 }}>
                                        Doador
                                    </span>
                                    <div style={{ fontWeight: 700 }}>
                                        {donation.doadores?.nome || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.55 }}>
                                        Tipo de Doador
                                    </span>
                                    <div style={{ fontWeight: 600 }}>
                                        {donation.doadores?.tipo_doador || '—'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.55 }}>
                                        Itens
                                    </span>
                                    <div style={{ fontWeight: 600 }}>
                                        {donation.itens?.length || 0} item(ns)
                                    </div>
                                </div>
                            </div>

                            <button
                                id="ficha-mat-btn-imprimir"
                                type="button"
                                className="btn-action btn-primary"
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    background: 'linear-gradient(135deg, #059669, #047857)',
                                    fontSize: '0.95rem',
                                    letterSpacing: '0.5px',
                                    boxShadow: '0 4px 14px rgba(5,150,105,0.3)',
                                }}
                                onClick={() => setShowModal(true)}
                            >
                                <Printer size={20} />
                                ABRIR FICHA MATRICIAL
                            </button>
                        </div>
                    )}
                </div>

                {/* Legenda / instruções */}
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
                    <strong>ℹ️ Instruções:</strong><br />
                    • Informe o <em>Código da Doação</em> para busca exata.<br />
                    • Informe o <em>Código do Doador</em> para buscar a última doação registrada.<br />
                    • O botão <strong>IMPRIMIR MATRICIAL</strong> envia direto para a Epson FX-890 via QZ Tray.<br />
                    • O botão <strong>IMPRIMIR HTML</strong> usa o diálogo padrão do navegador (modo Courier).
                </div>
            </div>

            {/* Modal da ficha */}
            {showModal && (
                <DoacaoFichaMatricial
                    donation={donation}
                    userLoggerName={userLoggerName}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ReportDoacaoFichaMatricial;
