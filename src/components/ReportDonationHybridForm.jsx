import React, { useState } from 'react';
import { Search, Printer, X, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';
import FichaDoacaoHibridaModal from './FichaDoacaoHibridaModal';

const ReportDonationHybridForm = () => {
    const [donationCode, setDonationCode] = useState('');
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleSearch = async () => {
        if (!donationCode) return;

        setLoading(true);
        setDonation(null);
        try {
            const paddedCode = donationCode.trim().padStart(6, '0');

            const { data, error } = await supabase
                .from('doacoes')
                .select(`
                    *,
                    doadores (*)
                `)
                .eq('codigo_doacao', paddedCode)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const { data: itemData } = await supabase.from('itens_doacao').select('*').eq('id_doacao', data.codigo_doacao);
                data.itens_doacao = itemData || [];
                const mappedData = {
                    ...data,
                    codigo: data.codigo_doacao,
                    itens: data.itens_doacao || []
                };
                setDonation(mappedData);
            } else {
                alert('Doação não encontrada com este código.');
            }
        } catch (err) {
            console.error('Erro na busca:', err);
            alert('Erro ao realizar a busca. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-content-layout" style={{ padding: '24px' }}>
            <div className="card-premium" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ 
                        width: '48px', height: '48px', borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #d97706, #92400e)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' 
                     }}>
                        <Printer size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Impressão Matricial</h2>
                        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Ficha de Doação para Impressora Matricial</p>
                    </div>
                </div>

                <div style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                        Código da Doação:
                    </label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: donation ? '20px' : '0' }}>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ex: 000080" 
                            value={donationCode}
                            onChange={(e) => setDonationCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button 
                            className="btn-action btn-primary" 
                            style={{ background: 'linear-gradient(135deg, #d97706, #92400e)' }}
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            <Search size={18} /> {loading ? 'BUSCANDO...' : 'BUSCAR'}
                        </button>
                    </div>

                    {donation && (
                        <div style={{ 
                            paddingTop: '20px', 
                            borderTop: '1px dashed var(--border-color)',
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', textTransform: 'uppercase' }}>Cod. Doador</span>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                        {donation.doadores?.codigo_doador || 'N/A'}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', textTransform: 'uppercase' }}>Nome do Doador</span>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                        {donation.doadores?.nome || 'N/A'}
                                    </strong>
                                </div>
                            </div>
                            
                            <button 
                                className="btn-action btn-primary" 
                                style={{ width: '100%', background: 'linear-gradient(135deg, #d97706, #92400e)', height: '45px' }}
                                onClick={() => setShowModal(true)}
                            >
                                <Printer size={18} /> IMPRIMIR MATRICIAL
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px', padding: '15px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.85rem' }}>
                    <p style={{ margin: 0 }}>
                        <strong>Dica:</strong> Informe o código da doação e clique em Buscar. Após localizar, clique em "Imprimir Matricial" para gerar a ficha.
                    </p>
                </div>
            </div>

            {showModal && (
                <FichaDoacaoHibridaModal 
                    donation={donation} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </div>
    );
};

export default ReportDonationHybridForm;
