import React from 'react';
import { Phone, MapPin, Printer, ShieldCheck, Heart, User, Building, Info, ExternalLink } from 'lucide-react';

const RelacaoDiversas = () => {
    const handlePrint = () => { window.print(); };

    const telefonesUnidades = [
        { nome: 'Abrigo José Bacelar - Itaquá', responsavel: '', telefone: '(11) 4648-2404', icone: <Building size={18} /> },
        { nome: 'Unidade Meimei', responsavel: 'Simone', telefone: '(11) 2035-3113', icone: <Heart size={18} /> },
        { nome: 'Portaria', responsavel: '', telefone: '(11) 2035-3503', icone: <ShieldCheck size={18} /> },
    ];

    const telefonesParceiros = [
        { nome: 'Casas André Luís', telefone: '(11) 2459-7000' },
        { nome: 'Exército da Salvação', telefone: '(11) 4003-2299' },
        { nome: 'Unibes (Bom Retiro)', telefone: '(11) 3311-7266' },
    ];

    return (
        <div className="main-content-layout" style={{ flexDirection: 'column', gap: '30px' }}>
            {/* Header Premium - Escondido na Impressão */}
            <div className="donor-card no-print" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div className="icon-box" style={{ background: 'var(--primary-color)', color: 'white' }}>
                            <Phone size={28} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem' }}>Telefones Úteis</h2>
                            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.9rem' }}>Contatos rápidos de unidades internas e instituições parceiras</p>
                        </div>
                    </div>
                    <div className="nav-controls">
                        <button className="btn-action btn-primary" onClick={handlePrint}>
                            <Printer size={16} /> Imprimir Contatos
                        </button>
                    </div>
                </div>
            </div>

            <div className="premium-wrapper" style={{ gap: '24px' }}>
                {/* Coluna Unidades */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '30px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.03, transform: 'rotate(-15deg)' }}>
                            <Phone size={200} />
                        </div>
                        
                        <div className="section-title-premium" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                            <Building size={20} style={{ color: 'var(--primary-color)' }} />
                            Nossas Unidades
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '25px' }}>
                            {telefonesUnidades.map((unidade, idx) => (
                                <div key={idx} className="phone-item-premium" style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    padding: '20px',
                                    background: 'var(--input-bg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ 
                                            width: '45px', 
                                            height: '45px', 
                                            borderRadius: '10px', 
                                            background: 'var(--bg-color)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: 'var(--primary-color)',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            {unidade.icone}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-color)' }}>{unidade.nome}</div>
                                            {unidade.responsavel && (
                                                <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <User size={12} /> {unidade.responsavel}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ 
                                            fontWeight: 900, 
                                            fontSize: '1.2rem', 
                                            color: 'var(--primary-color)',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px'
                                        }}>
                                            {unidade.telefone}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.4, letterSpacing: '1px' }}>
                                            Contato Direto
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Coluna Parceiros */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '30px' }}>
                        <div className="section-title-premium" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
                            <ExternalLink size={20} style={{ color: 'var(--accent-color)' }} />
                            Instituições Parceiras
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '25px' }}>
                            {telefonesParceiros.map((parceiro, idx) => (
                                <div key={idx} style={{ 
                                    padding: '15px 20px',
                                    borderRadius: '10px',
                                    borderLeft: '4px solid var(--accent-color)',
                                    background: 'var(--bg-color)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{parceiro.nome}</div>
                                    <div style={{ fontWeight: 800, color: 'var(--text-color)', opacity: 0.8 }}>{parceiro.telefone}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ 
                            marginTop: '30px', 
                            padding: '20px', 
                            background: 'var(--primary-soft)', 
                            borderRadius: '12px',
                            border: '1px dashed var(--primary-color)',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'flex-start'
                        }}>
                            <Info size={20} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, lineHeight: '1.5' }}>
                                Estes números são de utilidade pública para coordenação de retiradas e doações de grande porte entre as instituições.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estilos Adicionais Inline para manter o Clean Premium */}
            <style dangerouslySetInnerHTML={{ __html: `
                .phone-item-premium:hover {
                    transform: translateX(5px);
                    border-color: var(--primary-color) !important;
                    box-shadow: var(--shadow-md);
                }
                @media print {
                    .main-content-layout { gap: 10px !important; }
                    .premium-wrapper { display: block !important; }
                    .glass-card { border: 1px solid #ddd !important; box-shadow: none !important; margin-bottom: 20px !important; }
                    .phone-item-premium { border: 1px solid #eee !important; background: white !important; }
                    .no-print { display: none !important; }
                }
            `}} />
        </div>
    );
};

export default RelacaoDiversas;
