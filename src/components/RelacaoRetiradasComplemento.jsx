import React, { useState } from 'react';
import { Search, Printer, FileText, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { toDatePart } from '../utils/date';

const RelacaoRetiradasComplemento = () => {
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            // Busca doações, detalhando itens e doador
            // Filtro: Apenas Pendente e Remarcada + Filtro de Data de Retirada direto no banco
            const { data: result, error } = await supabase
                .from('doacoes')
                .select(`
                    *,
                    doadores (codigo_doador, nome, logradouro, endereco, regiao, bairro, celular, fixo, mapa, complemento)
                `)
                .neq('status', 'Baixada')
                .neq('status', 'Cancelada')
                .or(`and(data_retirada.gte.${startDate},data_retirada.lte.${endDate}),and(remarcado_para.gte.${startDate},remarcado_para.lte.${endDate})`)
                .order('data_retirada', { ascending: true });

            if (error) throw error;
            
            let validResult = result || [];
            
            // Filtro pela data efetiva: se Remarcada, usa remarcado_para; senão, usa data_retirada
            validResult = validResult.filter(d => {
                const effDate = (d.status === 'Remarcada' && d.remarcado_para)
                    ? toDatePart(d.remarcado_para)
                    : (d.data_retirada ? toDatePart(d.data_retirada) : '');
                return effDate >= startDate && effDate <= endDate;
            });
            
            // Ordenar por Código do Doador
            validResult.sort((a, b) => {
                const codA = a.doadores?.codigo_doador || 0;
                const codB = b.doadores?.codigo_doador || 0;
                return codA - codB;
            });
            
            // Buscar itens para todas as doações
            const donationCodes = validResult.map(d => d.codigo_doacao);
            const { data: allItems, error: itemsError } = await supabase
                .from('itens_doacao')
                .select('*')
                .in('id_doacao', donationCodes);
            if (itemsError) throw itemsError;

            const itemsByCode = {};
            (allItems || []).forEach(item => {
                const code = item.id_doacao;
                if (!itemsByCode[code]) itemsByCode[code] = [];
                itemsByCode[code].push(item);
            });

            // Transformar dados hierárquicos em linhas (1 linha por item de doação)
            const rows = [];
            if (validResult) {
                validResult.forEach(doacao => {
                    const doador = doacao.doadores || {};
                    const itens = itemsByCode[doacao.codigo_doacao] || [];
                    
                    if (itens.length === 0) {
                        rows.push({
                            ...doacao,
                            doador,
                            item: {} // doação sem itens cadastrados
                        });
                    } else {
                        itens.forEach(it => {
                            rows.push({
                                ...doacao,
                                doador,
                                item: it
                            });
                        });
                    }
                });
            }

            setData(rows);
        } catch (err) {
            console.error(err);
            alert('Erro ao buscar dados.');
        } finally {
            setLoading(false);
        }
    };

    const formatSData = (d) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const handlePrint = () => {
        // Técnica de Iframe Isolado para Relatórios de Longos
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        // Captura a área de impressão específica
        const printArea = document.querySelector('.print-area');
        if (!printArea) {
            alert('Erro: Área de impressão não encontrada.');
            return;
        }

        const printContent = printArea.innerHTML;
        const styles = document.querySelector('.rel-comp-premium style').innerHTML;

        const doc = iframe.contentWindow.document;
        doc.write(`
            <html>
                <head>
                    <title> </title>
                    <style>
                                           @media print {
                            @page { size: A4 landscape; margin: 10mm; }
                            body { margin: 0; padding: 0; background: white; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                            
                            /* ESCONDER TUDO O QUE NÃO É ESSENCIAL */
                            .no-print, .rel-comp-filters, .rel-header-premium, .sidebar, .header, 
                            .print-header-comp, p[style*="margin: 5px 0"] { 
                                display: none !important; 
                                height: 0 !important; 
                                overflow: hidden !important; 
                                visibility: hidden !important;
                            }
                            
                            .report-title-print { 
                                display: block !important; 
                                margin: 0 0 15px 0 !important; 
                                font-size: 14pt !important; 
                                text-align: left !important;
                                font-weight: bold !important;
                                border-bottom: 2px solid #000;
                                padding-bottom: 5px;
                            }
                            
                            .matricial-report-table { width: 100%; border-collapse: collapse; font-size: 6pt !important; }
                            .print-area { display: block !important; width: 100% !important; margin-top: 0 !important; }
                            
                            .matricial-report-table th {
                                border-bottom: 1px solid #000 !important;
                                padding: 6px 4px !important;
                                text-transform: none !important;
                                font-size: 9pt !important;
                            }
                            
                            .matricial-report-table td {
                                padding: 5px 4px !important;
                                border-bottom: 0.5px solid #eee !important;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-area">
                        ${printContent}
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
    };

    const getFones = (celular, fixo) => {
        let f = [];
        if (celular) f.push(celular);
        if (fixo) f.push(fixo);
        return f.join(' / ');
    };

    return (
        <div className="main-content-layout rel-comp-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .sidebar, .header, .rel-comp-filters,
                    .no-print, .mobile-menu-btn, .theme-toggle {
                        display: none !important;
                    }
                    .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
                    .rel-comp-premium { background: white !important; color: black !important; visibility: visible !important; padding: 0 !important; }
                    .rel-comp-card { box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
                    .matricial-report-table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 6pt !important; }
                    
                    /* ESTILO SIMILAR AO ACCESS */
                    .matricial-report-table th, .matricial-report-table td {
                        border: none !important; 
                        padding: 5px 4px; 
                        vertical-align: top;
                    }
                    .matricial-report-table th { 
                        background: transparent !important; 
                        text-align: left; 
                        font-weight: bold; 
                        border-bottom: 1px solid black !important;
                    }
                    .matricial-report-table td {
                        border-bottom: 0.5px solid #eee !important;
                    }
                    
                    @page { size: A4 landscape; margin: 10mm; }
                    * { visibility: visible !important; color: black !important; }
                }
                .print-header-comp { display: none; }
                .report-title-print { display: none; }

                .rel-comp-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .rel-comp-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
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
                    background: linear-gradient(135deg, #ec4899, #be185d);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
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

                .rel-comp-filters {
                    background: var(--input-bg);
                    padding: 20px;
                    border-radius: 12px;
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

                .rel-table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 12px;
                    overflow: auto;
                    border: 1px solid var(--border-color);
                }
                .rel-table-premium th {
                    background: var(--input-bg);
                    padding: 12px 14px;
                    text-align: left;
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                    white-space: nowrap;
                }
                .rel-table-premium td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.8rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .rel-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .rel-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }
                /* Hide identical consecutive rows styling */
                .duplicate-cell { opacity: 0; pointer-events: none; }
                
                .div-rel-title {
                    text-align: center;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 20px;
                }
                .div-rel-title h3 { margin: 0 0 4px 0; color: var(--text-color); text-transform: uppercase; font-size: 1.15rem; }
                .div-rel-title p { margin: 0; font-size: 0.85rem; color: var(--text-muted); opacity: 0.8; }
            `}} />

            <div className="rel-comp-card">
                {/* Header Premium */}
                <div className="rel-header-premium no-print">
                    <div className="icon-wrapper">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2>Retiradas com Complemento</h2>
                        <p className="subtitle">Relatório detalhado de doações com itens, endereços e complementos</p>
                    </div>
                </div>

                {/* Filtros */}
                <form className="rel-comp-filters no-print" onSubmit={handleSearch}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Data Início:</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="date"
                                className="input-field"
                                style={{ paddingLeft: '36px' }}
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Data Fim:</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="date"
                                className="input-field"
                                style={{ paddingLeft: '36px' }}
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <button type="submit" className="rel-btn rel-btn-primary" disabled={loading}>
                            <Search size={18} /> {loading ? 'Buscando...' : 'Pesquisar'}
                        </button>
                        {data.length > 0 && (
                            <button type="button" className="rel-btn rel-btn-secondary" onClick={handlePrint}>
                                <Printer size={18} /> Imprimir na Normal
                            </button>
                        )}
                    </div>
                </form>

                {searched && (
                    <div className="print-area">
                        {/* Print Only Header Removed as requested */}
                        <h3 className="report-title-print">Retiradas com Complemento: De: {formatSData(startDate)} - Até: {formatSData(endDate)}</h3>

                        <div className="div-rel-title no-print">
                            <h3>Retiradas com Complemento</h3>
                            <p>De: {formatSData(startDate)} até {formatSData(endDate)}</p>
                        </div>

                        <div style={{ overflowX: 'auto', borderRadius: 0, paddingBottom: '2px' }}>
                            <table className="rel-table-premium matricial-report-table">
                                <colgroup>
                                    <col style={{width: '60px'}} />   {/* Doador. Usando px para precisão nos códigos */}
                                    <col style={{width: '80px'}} />   {/* Doação */}
                                    <col style={{width: '40px'}} />   {/* Qtde */}
                                    <col style={{width: '50px'}} />   {/* Tipo */}
                                    <col style={{width: '120px'}} />  {/* Descr. Doação */}
                                    <col style={{width: '150px'}} />  {/* Nome do Doador */}
                                    <col style={{width: 'auto'}} />   {/* Endereço (Flexível) */}
                                    <col style={{width: '70px'}} />   {/* Região */}
                                    <col style={{width: '90px'}} />   {/* Bairro */}
                                    <col style={{width: '100px'}} />  {/* Fones */}
                                    <col style={{width: '60px'}} />   {/* Mapa */}
                                    <col style={{width: '150px'}} />  {/* Observações */}
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th style={{textAlign: 'right'}}>Doador</th>
                                        <th style={{textAlign: 'left'}}>Doação</th>
                                        <th style={{textAlign: 'right'}}>Qtde</th>
                                        <th style={{textAlign: 'left'}}>Tipo</th>
                                        <th>Descr. Doação</th>
                                        <th style={{fontWeight: 'normal'}}>Nome do Doador</th>
                                        <th>Endereço</th>
                                        <th>Região</th>
                                        <th>Bairro</th>
                                        <th>Fones</th>
                                        <th>Mapa</th>
                                        <th>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => {
                                        const isSame = idx > 0 && data[idx - 1].codigo_doacao === row.codigo_doacao;
                                        return (
                                        <tr key={idx}>
                                            <td className={isSame ? 'duplicate-cell' : ''} style={{textAlign: 'right', fontWeight: 700, color: 'var(--primary-color)'}}>
                                                {isSame ? '' : String(row.doador?.codigo_doador || '').padStart(6, '0')}
                                            </td>
                                            <td className={isSame ? 'duplicate-cell' : ''} style={{textAlign: 'left'}}>
                                                {isSame ? '' : row.codigo_doacao}
                                            </td>
                                            <td style={{textAlign: 'right', fontWeight: 'bold'}}>{row.item?.qtde || ''}</td>
                                            <td style={{textAlign: 'left'}}>{row.item?.unidade || ''}</td>
                                            <td style={{fontWeight: 600}}>{row.item?.item || ''}</td>
                                            <td className={isSame ? 'duplicate-cell' : ''} style={{wordBreak: 'break-word', fontWeight: 600}}>
                                                {isSame ? '' : row.doador?.nome}
                                            </td>
                                            <td className={isSame ? 'duplicate-cell' : ''} style={{wordBreak: 'break-word'}}>
                                                {isSame ? '' : `${row.doador?.logradouro || ''} ${row.doador?.endereco || ''} ${row.doador?.complemento ? 'Cpl: ' + row.doador.complemento : ''}`.trim()}
                                            </td>
                                            <td className={isSame ? 'duplicate-cell' : ''}>{isSame ? '' : row.doador?.regiao}</td>
                                            <td className={isSame ? 'duplicate-cell' : ''}>{isSame ? '' : row.doador?.bairro}</td>
                                            <td className={isSame ? 'duplicate-cell' : ''}>{isSame ? '' : getFones(row.doador?.celular, row.doador?.fixo)}</td>
                                            <td className={isSame ? 'duplicate-cell' : ''}>{isSame ? '' : (row.doador?.mapa || '')}</td>
                                            <td className={isSame ? 'duplicate-cell' : ''} style={{wordBreak: 'break-word'}}>{isSame ? '' : row.observacoes}</td>
                                        </tr>
                                        );
                                    })}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="12" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                                Nenhuma doação encontrada no período.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelacaoRetiradasComplemento;
