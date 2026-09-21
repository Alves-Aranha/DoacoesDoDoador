import React, { useState, useEffect } from 'react';
import { Package, Search, Printer, FileText } from 'lucide-react';
import { supabase } from '../supabaseClient';

const RelItensCategoria = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Carregar todas as categorias para o filtro
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from('categoria')
                .select('codigo_base, nome')
                .order('nome');
            if (!error && data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const handleSearch = async () => {
        if (!selectedCategory && !searchTerm) {
            alert('Por favor, selecione uma categoria ou digite um código.');
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            let query = supabase.from('itens').select('*').order('nome');

            if (selectedCategory) {
                query = query.eq('codigo_base', selectedCategory);
            } else if (searchTerm) {
                query = query.or(`codigo_base.ilike.%${searchTerm}%,nome.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            setItems(data || []);
            
            if (!data || data.length === 0) {
                alert('Nenhum item encontrado para esta categoria.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar itens.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getCategoryName = (code) => {
        const cat = categories.find(c => c.codigo_base === code);
        return cat ? cat.nome : code;
    };

    return (
        <div className="main-content-layout rel-itens-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .sidebar, .header, .rel-itens-filters,
                    .no-print, .mobile-menu-btn, .theme-toggle {
                        display: none !important;
                    }
                    .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
                    .rel-itens-premium { background: white !important; color: black !important; padding: 0 !important; }
                    .rel-itens-card { box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
                    .print-only-header { display: block !important; margin-bottom: 20px; text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; font-size: 11pt; }
                    .report-table { width: 100%; border-collapse: collapse; }
                    .report-table th, .report-table td { border: none !important; border-bottom: 1px dashed #000 !important; padding: 6px !important; color: black !important; text-align: left; }
                    
                    @page { size: A4 portrait; margin: 15mm; }
                    * { visibility: visible !important; color: black !important; }
                }

                .print-only-header { display: none; }

                .rel-itens-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .rel-itens-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
                    min-height: 400px;
                }
                .rel-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .rel-header-premium .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                .rel-header-premium h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                }
                .rel-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }

                .rel-itens-filters {
                    background: var(--input-bg);
                    padding: 20px;
                    border-radius: 0;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                }

                .rel-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                }
                .rel-btn-primary { background: #2563eb; color: white; }
                .rel-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
                .rel-btn-secondary { background: var(--bg-color); color: var(--text-color); border: 1px solid var(--border-color); }
                .rel-btn-secondary:hover { background: var(--border-color); }
                .rel-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

                .div-report-title {
                    text-align: center;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 20px;
                }
                .div-report-title h3 { margin: 0 0 4px 0; color: var(--text-color); text-transform: uppercase; font-size: 1.15rem; }
                .div-report-title p { margin: 0; font-size: 0.85rem; color: var(--text-muted); opacity: 0.8; font-weight: 600; }

                .table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 0;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .table-premium th {
                    background: var(--input-bg);
                    padding: 14px 16px;
                    text-align: left;
                    font-size: 0.8rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                }
                .table-premium td {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.9rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
            `}} />

            <div className="rel-itens-card">
                {/* Header Premium */}
                <div className="rel-header-premium no-print">
                    <div className="icon-wrapper">
                        <Package size={24} />
                    </div>
                    <div>
                        <h2>Itens por Categoria</h2>
                        <p className="subtitle">Consulte o saldo atual e os detalhes de todos os itens cadastrados no estoque</p>
                    </div>
                </div>

                <div className="rel-itens-filters no-print">
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '450px', flex: 1, flexShrink: 0 }}>
                        <label>Categoria (Código ou Nome):</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input 
                                list="lista-categorias-rel" 
                                className="input-field"
                                style={{ paddingLeft: '36px', width: '100%' }}
                                placeholder="Pesquise por nome ou código..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    const found = categories.find(c => `${c.codigo_base} - ${c.nome}` === e.target.value || c.codigo_base === e.target.value);
                                    if (found) setSelectedCategory(found.codigo_base);
                                    else setSelectedCategory('');
                                }}
                            />
                        </div>
                        <datalist id="lista-categorias-rel">
                            {categories.map(c => (
                                <option key={c.codigo_base} value={`${c.codigo_base} - ${c.nome}`} />
                            ))}
                        </datalist>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <button className="rel-btn rel-btn-primary" onClick={handleSearch} disabled={loading}>
                            <Search size={18} /> {loading ? 'Carregando...' : 'Consultar'}
                        </button>
                        <button className="rel-btn rel-btn-secondary" onClick={handlePrint} disabled={items.length === 0}>
                            <Printer size={18} /> Imprimir
                        </button>
                    </div>
                </div>

                {searched && (
                    <div className="print-area">
                        {/* Print Only Header */}
                        <div className="print-only-header">
                            <strong>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</strong><br />
                            RUA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP<br />
                            CEP 03610-030 - Telefone (11) 2164-1800 - CNPJ 60.478.245/0001-5<br />
                            E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br
                        </div>

                        {/* Title (Screen & Print mapped classes) */}
                        <div className="div-report-title">
                            <h3>Relação de Itens por Categoria</h3>
                            {selectedCategory || searchTerm ? (
                                <p>Categoria: {selectedCategory ? `${selectedCategory} - ${getCategoryName(selectedCategory)}` : searchTerm}</p>
                            ) : null}
                        </div>

                        <div style={{ overflowX: 'auto', borderRadius: 0, paddingBottom: '2px' }}>
                            <table className="table-premium report-table">
                                <colgroup>
                                    <col style={{width: '20%'}} />
                                    <col style={{width: '50%'}} />
                                    <col style={{width: '15%'}} />
                                    <col style={{width: '15%'}} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Cód. Completo</th>
                                        <th>Descrição do Item</th>
                                        <th>Unidade</th>
                                        <th style={{ textAlign: 'right' }}>Saldo Atual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length > 0 ? (
                                        items.map((item) => (
                                            <tr key={item.codigo_completo}>
                                                <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{item.codigo_completo}</td>
                                                <td>{item.nome}</td>
                                                <td>{item.unidade || '-'}</td>
                                                <td style={{ fontWeight: '800', textAlign: 'right' }}>{item.qtde}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                                Nenhum item encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!searched && !loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, padding: '60px 20px', textAlign: 'center' }}>
                        <Package size={64} style={{ marginBottom: '16px' }} />
                        <p style={{ fontSize: '1.1rem' }}>Pesquise uma categoria para visualizar seus itens.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelItensCategoria;
