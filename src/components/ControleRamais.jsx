import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Phone, Users, Search, Printer, Building, User, PhoneCall, Info, LayoutGrid, List, CheckCircle2 } from 'lucide-react';

const ControleRamais = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    const ramaisOficiais = [
        { id: 802, ramal: '802', nome: 'Glória / Juliana', setor: 'Enfermagem' },
        { id: 803, ramal: '803', nome: 'Rose', setor: 'Serviço Social' },
        { id: 804, ramal: '804', nome: 'Beth', setor: 'Deptº Pessoal' },
        { id: 805, ramal: '805', nome: 'Isabel / Tatyane', setor: 'Recepção' },
        { id: 806, ramal: '806', nome: 'Simone / Andréa', setor: 'Deptº Pessoal' },
        { id: 807, ramal: '807', nome: 'Antônio', setor: 'Administração' },
        { id: 808, ramal: '808', nome: 'Regiane', setor: 'Cobrança' },
        { id: 809, ramal: '809', nome: 'Rosilene / Rosana', setor: 'Cobrança' },
        { id: 810, ramal: '810', nome: 'Fax', setor: 'Fax' },
        { id: 811, ramal: '811', nome: 'Porteiros', setor: 'Portaria' },
        { id: 812, ramal: '812', nome: 'Cidinha', setor: 'Secretária Diretoria' },
        { id: 813, ramal: '813', nome: 'Simone / Marli', setor: 'Farmácia' },
        { id: 814, ramal: '814', nome: 'Cristiane', setor: 'Administração' },
        { id: 815, ramal: '815', nome: 'Vago', setor: '-' },
        { id: 816, ramal: '816', nome: 'Cássia', setor: 'Financeiro' },
        { id: 817, ramal: '817', nome: 'Elisângela', setor: 'Doação' },
        { id: 818, ramal: '818', nome: 'Geraldo', setor: 'Almoxarifado' },
        { id: 819, ramal: '819', nome: 'Luís', setor: 'Informática' },
        { id: 820, ramal: '820', nome: 'Maria Xavier', setor: 'Presidente' },
        { id: 821, ramal: '821', nome: 'Luciana / Rubenita', setor: 'Jurídico' },
        { id: 822, ramal: '822', nome: 'Salete', setor: 'Psicóloga' },
        { id: 823, ramal: '823', nome: 'Vago', setor: '-' },
        { id: 824, ramal: '824', nome: 'Maria Xavier', setor: 'Presidente' },
        { id: 825, ramal: '825', nome: 'Kátia', setor: 'Nutrição' },
        { id: 826, ramal: '826', nome: 'Voluntárias', setor: 'Lanchonete' },
        { id: 827, ramal: '827', nome: 'Isabel / Tatyane', setor: 'Recepção' },
        { id: 828, ramal: '828', nome: 'Shirley', setor: 'Doação' },
        { id: 830, ramal: '830', nome: 'Auro / José Luíz', setor: 'Transporte' },
        { id: 832, ramal: '832', nome: 'Deptº Médico', setor: 'Médico' },
        { id: 833, ramal: '833', nome: 'Neide', setor: 'Bazar Vicentina' },
        { id: 834, ramal: '834', nome: 'Nancy / José', setor: 'Fisioterapia' },
        { id: 836, ramal: '836', nome: 'Vago', setor: '-' },
        { id: 837, ramal: '837', nome: 'Mônica', setor: 'Triagem' },
        { id: 838, ramal: '838', nome: 'Vago', setor: '-' },
        { id: 839, ramal: '839', nome: 'Voluntárias', setor: 'Livraria' },
        { id: 840, ramal: '840', nome: 'Toninho', setor: 'Transporte' },
        { id: 841, ramal: '841', nome: 'Telemarketing', setor: 'Telemarketing' },
        { id: 843, ramal: '843', nome: 'Marina', setor: 'Jurídico' },
        { id: 844, ramal: '844', nome: 'Glaúcio', setor: 'Diretor' },
    ];

    const filteredEquipe = ramaisOficiais.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ramal.includes(searchTerm)
    );

    const handlePrint = () => window.print();

    // Estilos Inline robustos para garantir que o conteúdo PREENCHA a largura
    const containerStyle = {
        width: '100%',
        maxWidth: '100%',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box'
    };

    const headerStyle = {
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        color: 'white',
        padding: '40px',
        borderRadius: '0',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 15px 35px rgba(37, 99, 235, 0.2)'
    };

    const topGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
        width: '100%',
        boxSizing: 'border-box'
    };

    const extensionGridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        width: '100%',
        boxSizing: 'border-box'
    };

    return (
        <div style={containerStyle}>
            {/* Cabeçalho */}
            <div className="no-print" style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '15px' }}>
                        <PhoneCall size={35} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Lista de Ramais</h2>
                        <span style={{ opacity: 0.8, fontWeight: 500 }}>CONTATOS INTERNOS - ABRIGO BEZERRA DE MENEZES</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="theme-toggle" style={{ background: 'rgba(255,255,255,0.1)', border: 'none' }}>
                        <button className={`btn-theme ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={20} /></button>
                        <button className={`btn-theme ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={20} /></button>
                    </div>
                    <button className="btn-action btn-secondary" onClick={handlePrint} style={{ padding: '0 25px', height: '50px', fontWeight: 700 }}>
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            {/* Guia e Atalhos Rápidos */}
            <div className="no-print" style={topGridStyle}>
                <div className="premium-content-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', borderLeft: '5px solid #10b981' }}>
                    <div style={{ backgroundColor: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
                        <Users size={28} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#065f46' }}>{ramaisOficiais.filter(r => r.nome !== 'Vago').length}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Ramais em Operação</div>
                    </div>
                </div>
                
                <div className="premium-content-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '25px', borderLeft: '5px solid #2563eb' }}>
                    <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '12px', borderRadius: '12px' }}>
                        <Info size={28} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1rem' }}>DISCAGEM EXTERNA</div>
                        <div style={{ fontWeight: 600, opacity: 0.7 }}>(11) 2164-18XX</div>
                    </div>
                </div>

                <div className="premium-content-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 25px', borderLeft: '5px solid #f59e0b' }}>
                    <style dangerouslySetInnerHTML={{ __html: `
                        .ramais-search-input::placeholder { color: var(--text-color); opacity: 0.5; }
                        .ramais-search-input { color: var(--text-color) !important; }
                    `}} />
                    <Search size={22} color="var(--text-color)" style={{ opacity: 0.6 }} />
                    <input 
                        className="ramais-search-input"
                        style={{ border: 'none', background: 'transparent', width: '100%', padding: '10px 0', fontSize: '1.2rem', fontWeight: 800, outline: 'none', textTransform: 'uppercase' }}
                        placeholder="PESQUISE AQUI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Listagem Principal */}
            <div className="glass-card" style={{ width: '100%', padding: '30px', boxSizing: 'border-box' }}>
                {viewMode === 'grid' ? (
                    <div style={extensionGridStyle}>
                        {filteredEquipe.map((item) => (
                            <div key={item.id} className="glass-card" style={{ 
                                padding: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                opacity: item.nome === 'Vago' ? 0.4 : 1,
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ 
                                    background: item.nome === 'Vago' ? '#94a3b8' : '#2563eb',
                                    color: 'white',
                                    width: '60px',
                                    height: '60px',
                                    minWidth: '60px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.4rem',
                                    fontWeight: 900,
                                    fontFamily: 'JetBrains Mono'
                                }}>
                                    {item.ramal}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nome}</div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.5, letterSpacing: '0.5px' }}>{item.setor.toUpperCase()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="table-container" style={{ width: '100%', boxSizing: 'border-box' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center', padding: '15px', width: '100px' }}>RAMAL</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>IDENTIFICAÇÃO</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>SETOR</th>
                                    <th style={{ textAlign: 'center', padding: '15px' }}>LIGAR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEquipe.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: item.nome === 'Vago' ? 0.4 : 1 }}>
                                        <td style={{ textAlign: 'center', padding: '20px', fontWeight: 900, fontSize: '1.3rem', color: '#2563eb' }}>{item.ramal}</td>
                                        <td style={{ padding: '20px', fontWeight: 700, fontSize: '1.1rem' }}>{item.nome}</td>
                                        <td style={{ padding: '20px', fontWeight: 600, opacity: 0.7 }}>{item.setor}</td>
                                        <td style={{ textAlign: 'center', padding: '20px' }}>
                                            <button className="btn-icon" style={{ color: '#10b981' }} disabled={item.nome === 'Vago'}>
                                                <PhoneCall size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontWeight: 700, fontSize: '0.8rem' }}>
                ABRIGO BEZERRA DE MENEZES - SISTEMA DE COMUNICAÇÃO INTERNA
            </div>
        </div>
    );
};

export default ControleRamais;
