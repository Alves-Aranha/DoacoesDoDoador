import React, { useState } from 'react';
import { FileText, Printer, Plus, Trash2 } from 'lucide-react';
import FichaAvaliacao from './FichaAvaliacao';

const inputFull = { width: '100%' };

const ReportFichaAvaliacaoForm = () => {
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        endereco: '',
        bairro: '',
        mapa: '',
        observacoes: '',
        obsAvaliador: '',
    });
    const [itens, setItens] = useState(['']);
    const [showModal, setShowModal] = useState(false);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleItemChange = (index) => (event) => {
        const newItens = [...itens];
        newItens[index] = event.target.value;
        setItens(newItens);
    };

    const addItem = () => {
        setItens((prev) => [...prev, '']);
    };

    const removeItem = (index) => {
        if (itens.length <= 1) return;
        setItens((prev) => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = () => {
        const data = {
            ...formData,
            itens: itens.filter((i) => i.trim() !== ''),
        };
        setShowModal(true);
    };

    return (
        <div className="main-content-layout" style={{ padding: '8px' }}>
            <div className="card-premium" style={{ maxWidth: '780px', margin: '0 auto', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0f766e, #134e4a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                    }}>
                        <FileText size={22} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Ficha de Avaliação</h2>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                            Preencha os campos abaixo e gere a impressão
                        </p>
                    </div>
                </div>

                <div style={{ background: 'var(--input-bg)', padding: '20px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
                    {/* Primeira linha: Nome e Telefone */}
                    <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '14px', marginBottom: '14px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'normal' }}>Nome do Doador</label>
                            <input type="text" className="input-field" placeholder="Nome do doador" value={formData.nome} onChange={handleChange('nome')} style={inputFull} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Telefone</label>
                            <input type="text" className="input-field" placeholder="Telefone" value={formData.telefone} onChange={handleChange('telefone')} style={inputFull} />
                        </div>
                    </div>

                    {/* Segunda linha: Endereço, Bairro e Mapa */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Endereço Completo</label>
                            <input type="text" className="input-field" placeholder="Endereço completo" value={formData.endereco} onChange={handleChange('endereco')} style={inputFull} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Bairro</label>
                            <input type="text" className="input-field" placeholder="Bairro" value={formData.bairro} onChange={handleChange('bairro')} style={inputFull} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Mapa</label>
                            <input type="text" className="input-field" placeholder="Mapa" value={formData.mapa} onChange={handleChange('mapa')} style={inputFull} />
                        </div>
                    </div>

                    {/* Terceira linha: Observações */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Observações</label>
                        <input type="text" className="input-field" placeholder="Observações" value={formData.observacoes} onChange={handleChange('observacoes')} style={inputFull} />
                    </div>

                    {/* Mercadorias */}
                    <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mercadorias</label>
                            <button type="button" onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-color)' }}>
                                <Plus size={14} /> Adicionar Item
                            </button>
                        </div>
                        {itens.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={`Item ${idx + 1}`}
                                    value={item}
                                    onChange={handleItemChange(idx)}
                                    style={{ flex: 1 }}
                                />
                                {itens.length > 1 && (
                                    <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Obs. do Avaliador */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600 }}>Obs. do Avaliador</label>
                        <textarea
                            className="input-field"
                            rows="3"
                            placeholder="Digite as observações do avaliador..."
                            value={formData.obsAvaliador}
                            onChange={handleChange('obsAvaliador')}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <button
                        type="button"
                        className="btn-action btn-primary"
                        style={{ width: '100%', height: '45px', background: '#059669' }}
                        onClick={handleGenerate}
                    >
                        <Printer size={18} /> GERAR AVALIAÇÃO
                    </button>
                </div>
            </div>

            {showModal && (
                <FichaAvaliacao
                    data={{
                        ...formData,
                        itens: itens.filter((i) => i.trim() !== ''),
                    }}
                    onClose={() => setShowModal(false)}
                />
            )}
        </div>
    );
};

export default ReportFichaAvaliacaoForm;
