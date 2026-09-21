import React, { useState } from 'react';
// Importação dos seus 3 relatórios existentes
import AgradecimentoSra from './AgradecimentoSra';
import AgradecimentoSro from './AgradecimentoSro';
import AgradecimentoGen from './AgradecimentoGen';
import { Mail, FileCheck } from 'lucide-react';

const FormularioAgradecimento = () => {
    // Estado para os campos de digitação comuns
    const [dados, setDados] = useState({
        codigoDoador: '',
        codigoDoacao: '',
        descricaoLivre: ''
    });

    // Estado para definir qual relatório foi escolhido (Padrão: Genérico)
    const [tipoTratamento, setTipoTratamento] = useState('GEN'); 
    const [exibirImpressao, setExibirImpressao] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Se preencher um código, limpa o outro para garantir exclusividade
        setDados(prev => {
            const newDados = { ...prev, [name]: value };
            if (name === 'codigoDoador' && value.trim() !== '') {
                newDados.codigoDoacao = '';
            } else if (name === 'codigoDoacao' && value.trim() !== '') {
                newDados.codigoDoador = '';
            }
            return newDados;
        });
    };

    const handleGerarRelatorio = (e) => {
        e.preventDefault();
        
        if (!dados.codigoDoador.trim() && !dados.codigoDoacao.trim()) {
            alert('Por favor, informe o Código do Doador ou o Código da Doação.');
            return;
        }
        
        setExibirImpressao(true);
    };

    return (
        <div className="page-container" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-color)', margin: 0 }}>
                    <Mail size={24} />
                    Emissão de Carta de Agradecimento
                </h2>
            </div>

            {!exibirImpressao ? (
                <form onSubmit={handleGerarRelatorio} style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 0, border: '1px solid var(--border-color)' }}>
                    {/* Seleção do Tipo de Relatório (Tratamento) */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>
                            Tratamento / Tipo de Relatório:
                        </label>
                        <select 
                            className="form-control"
                            value={tipoTratamento} 
                            onChange={(e) => setTipoTratamento(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', fontSize: '1rem' }}
                        >
                            <option value="SRA">Feminino (Sra.) → Agradecimento Sra</option>
                            <option value="SRO">Masculino (Srs.) → Agradecimento Sro</option>
                            <option value="GEN">Genérico (À) → Agradecimento Genérico</option>
                        </select>
                    </div>

                    {/* Códigos em duas colunas */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>
                                CÓDIGO DO DOADOR:
                            </label>
                            <input 
                                type="text" 
                                className="form-control"
                                name="codigoDoador" 
                                value={dados.codigoDoador} 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', borderRadius: '6px' }} 
                                disabled={dados.codigoDoacao.trim() !== ''}
                                placeholder={dados.codigoDoacao.trim() !== '' ? "Bloqueado (Doação preenchida)" : "Digite o código do doador"}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>
                                CÓDIGO DA DOAÇÃO:
                            </label>
                            <input 
                                type="text" 
                                className="form-control"
                                name="codigoDoacao" 
                                value={dados.codigoDoacao} 
                                onChange={handleChange} 
                                style={{ width: '100%', padding: '10px', borderRadius: '6px' }} 
                                disabled={dados.codigoDoador.trim() !== ''}
                                placeholder={dados.codigoDoador.trim() !== '' ? "Bloqueado (Doador preenchido)" : "Digite o código da doação"}
                            />
                        </div>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', fontStyle: 'italic' }}>
                        * Preencha apenas UM dos códigos acima.
                    </p>

                    {/* Texto Livre */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'var(--text-color)' }}>
                            DESCRIÇÃO DA DOAÇÃO (TEXTO LIVRE):
                        </label>
                        <textarea 
                            className="form-control"
                            name="descricaoLivre" 
                            value={dados.descricaoLivre} 
                            onChange={handleChange} 
                            rows="5" 
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', resize: 'vertical' }} 
                            placeholder="Digite o corpo do texto livre aqui..." 
                        />
                    </div>

                    {/* Botão Único */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '12px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileCheck size={18} />
                            Visualizar e Imprimir Carta
                        </button>
                    </div>
                </form>
            ) : (
                /* RENDERIZAÇÃO DINÂMICA: Escolhe o componente correto baseado no estado */
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 0, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                    {tipoTratamento === 'SRA' && (
                        <AgradecimentoSra data={dados} onClose={() => setExibirImpressao(false)} />
                    )}
                    {tipoTratamento === 'SRO' && (
                        <AgradecimentoSro data={dados} onClose={() => setExibirImpressao(false)} />
                    )}
                    {tipoTratamento === 'GEN' && (
                        <AgradecimentoGen data={dados} onClose={() => setExibirImpressao(false)} />
                    )}
                </div>
            )}
        </div>
    );
};

export default FormularioAgradecimento;

