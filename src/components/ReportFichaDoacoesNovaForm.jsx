import React, { useState } from 'react';
import { FileText, Printer, Search } from 'lucide-react';
import { supabase } from '../supabaseClient';
import FichaDoacoesNovaModal from './FichaDoacoesNovaModal';

const ReportFichaDoacoesNovaForm = () => {
    const [donationCode, setDonationCode] = useState('');
    const [donorCode, setDonorCode] = useState('');
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchInfo, setSearchInfo] = useState('');

    const normalizeCode = (value) => value.trim().padStart(6, '0');

    const mapDonation = (data) => ({
        ...data,
        codigo: data.codigo_doacao,
        itens: data.itens_doacao || [],
    });

    const handleSearch = async () => {
        const codeDonation = donationCode.trim();
        const codeDonor = donorCode.trim();

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
                query = query.eq('codigo_doacao', normalizeCode(codeDonation)).maybeSingle();
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
            setSearchInfo(codeDonation ? 'Busca por Código da Doação' : 'Busca por Código do Doador: última doação localizada');
        } catch (error) {
            console.error('Erro ao buscar ficha nova:', error);
            alert('Erro ao realizar a busca. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content-layout" style={{ padding: '24px' }}>
            <div className="card-premium" style={{ maxWidth: '680px', margin: '0 auto', padding: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 0,
                        background: 'linear-gradient(135deg, #0f766e, #134e4a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ficha de Doações Nova</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                            Impressão matricial Epson FX-890 em papel contínuo 21cm x 28cm
                        </p>
                    </div>
                </div>

                <div style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                Código da Doação
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: 000080"
                                value={donationCode}
                                onChange={(event) => setDonationCode(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                                Código do Doador
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ex: 000123"
                                value={donorCode}
                                onChange={(event) => setDonorCode(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-action btn-primary"
                        style={{ width: '100%', height: '42px', background: 'linear-gradient(135deg, #0f766e, #134e4a)' }}
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        <Search size={18} /> {loading ? 'BUSCANDO...' : 'BUSCAR FICHA'}
                    </button>

                    {donation && (
                        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px dashed var(--border-color)' }}>
                            <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', opacity: 0.7 }}>{searchInfo}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.65, display: 'block', textTransform: 'uppercase' }}>Cód. Doação</span>
                                    <strong>{donation.codigo_doacao}</strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.65, display: 'block', textTransform: 'uppercase' }}>Cód. Doador</span>
                                    <strong>{donation.doadores?.codigo_doador || donation.codigo_doador}</strong>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.65, display: 'block', textTransform: 'uppercase' }}>Doador</span>
                                    <strong>{donation.doadores?.nome || 'N/A'}</strong>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn-action btn-primary"
                                style={{ width: '100%', height: '45px', background: '#059669' }}
                                onClick={() => setShowModal(true)}
                            >
                                <Printer size={18} /> GERAR IMPRESSÃO
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <FichaDoacoesNovaModal
                    donation={donation}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ReportFichaDoacoesNovaForm;
