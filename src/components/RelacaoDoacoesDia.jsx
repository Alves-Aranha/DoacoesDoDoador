import React, { useState } from 'react';
import { Search, Printer, FileText, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';

const RelacaoDoacoesDia = () => {
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
            const { data: result, error } = await supabase
                .from('doacoes')
                .select('data_retirada, remarcado_para, data_doacao, codigo_doacao, codigo_doador, doadores(nome, logradouro, endereco, bairro, regiao, cep)')
                .or(`and(data_retirada.gte.${startDate},data_retirada.lte.${endDate}),and(remarcado_para.gte.${startDate},remarcado_para.lte.${endDate})`)
                .neq('status', 'Baixada')
                .neq('status', 'Cancelada');

            if (error) throw error;
            
            // Filtro de segurança adicional no frontend (normalizado)
            const filteredResult = (result || []).filter(d => {
                if (!d.status) return true; // Trata nulos como válidos (Pendentes)
                const s = d.status.toString().toLowerCase().trim();
                return s !== 'baixada' && s !== 'cancelada';
            });
            // Ordenar alfabeticamente pelo nome do doador
            const sortedResult = filteredResult.sort((a, b) => {
                const nameA = a.doadores?.nome || '';
                const nameB = b.doadores?.nome || '';
                return nameA.localeCompare(nameB);
            });

            setData(sortedResult);
        } catch (err) {
            console.error(err);
            alert('Erro ao buscar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        // Técnica de Iframe Isolado para Padronização
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printArea = document.querySelector('.print-area');
        if (!printArea) return;

        const printContent = printArea.innerHTML;
        const styles = document.querySelector('.rel-dia-premium style').innerHTML;

        const doc = iframe.contentWindow.document;
        doc.write(`
            <html>
                <head>
                    <title>Doações do Dia</title>
                    <style>
                        ${styles}
                        @media print {
                            @page { size: A4 landscape; margin: 10mm; }
                            body { margin: 0; padding: 0; background: white; width: 100%; }
                            .no-print, .rel-dia-filters, .rel-header-premium, .sidebar, .header { display: none !important; }
                            .print-header, .report-title-print, .report-subtitle-print { display: block !important; margin-bottom: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-area">${printContent}</div>
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

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split(/T| /)[0].split('-');
        return `${day}/${month}/${year}`;
    };

    const formatSData = (d) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    return (
        <div className="main-content-layout rel-dia-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .sidebar, .header, .rel-dia-filters,
                    .no-print, .mobile-menu-btn, .theme-toggle {
                        display: none !important;
                    }
                    .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
                    .rel-dia-premium { background: white !important; color: black !important; visibility: visible !important; padding: 0 !important; }
                    .rel-dia-card { box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
                    .matricial-report-table { width: 100%; border-collapse: collapse; font-family: 'Inter', sans-serif; font-size: 11px; }
                    .matricial-report-table th, .matricial-report-table td {
                        border: 1px solid #ddd !important; padding: 8px; vertical-align: top;
                    }
                    .matricial-report-table th { background: #f8fafc !important; text-align: left; font-weight: bold; }
                    
                    @page { size: A4 landscape; margin: 10mm; }
                    * { visibility: visible !important; color: black !important; }
                }
                .print-header { display: none; }
                .report-title-print { display: none; }
                .report-subtitle-print { display: none; }

                .rel-dia-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .rel-dia-card {
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
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
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

                .rel-dia-filters {
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
                    table-layout: auto;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .rel-table-premium th {
                    background: var(--input-bg);
                    padding: 14px 4px;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                }
                .rel-table-premium td {
                    padding: 12px 4px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                    word-break: normal;
                }
                .rel-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .rel-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }

                .div-rel-title {
                    text-align: center;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 20px;
                }
                .div-rel-title h3 { margin: 0 0 4px 0; color: var(--text-color); text-transform: uppercase; font-size: 1.15rem; }
                .div-rel-title p { margin: 0; font-size: 0.85rem; color: var(--text-muted); opacity: 0.8; }
            `}} />

            <div className="rel-dia-card">
                {/* Header Premium */}
                <div className="rel-header-premium no-print">
                    <div className="icon-wrapper">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2>Relação das Doações do Dia</h2>
                        <p className="subtitle">Listagem de doações no período filtradas por Data de Retirada ou Remarcação</p>
                    </div>
                </div>

                {/* Filtros */}
                <form className="rel-dia-filters no-print" onSubmit={handleSearch}>
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
                        {/* Print Only Header */}
                        <div className="print-header">
                            <strong>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</strong><br />
                            RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP<br />
                            CEP 03610-030 - Telefone (11)2164-1800 - C.N.P.J. 60.478.245/0001-5<br />
                            E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br
                        </div>

                        {/* Title (Screen & Print mapped classes) */}
                        <h3 className="report-title-print">Relação das Doações do Dia de Hoje:</h3>
                        <p className="report-subtitle-print">Data Inicio: {formatSData(startDate)} - Data Fim: {formatSData(endDate)}</p>

                        <div className="div-rel-title no-print">
                            <h3>Relação das Doações do Dia de Hoje</h3>
                            <p>Data Inicio: {formatSData(startDate)} - Data Fim: {formatSData(endDate)}</p>
                        </div>

                        <div style={{ overflowX: 'auto', borderRadius: 0, paddingBottom: '2px' }}>
                            <table className="rel-table-premium matricial-report-table">
                                <colgroup>
                                    <col style={{width: 'auto'}} />   {/* Retirada / Remarcada */}
                                    <col style={{width: 'auto'}} />   {/* Doação */}
                                    <col style={{width: 'auto'}} />   {/* Doador */}
                                    <col style={{width: '25%'}} />    {/* Nome do Doador */}
                                    <col style={{width: '25%'}} />    {/* Endereço */}
                                    <col style={{width: '15%'}} />    {/* Bairro */}
                                    <col style={{width: '10%'}} />    {/* Região */}
                                    <col style={{width: '10%'}} />    {/* Cep */}
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>RETIRADA<br/>REMARCADA</th>
                                        <th>Doação</th>
                                        <th>Doador</th>
                                        <th style={{fontWeight: 'normal'}}>Nome do Doador</th>
                                        <th>Endereço</th>
                                        <th>Bairro</th>
                                        <th>Região</th>
                                        <th>Cep</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDate(row.remarcado_para || row.data_retirada || row.data_doacao)}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>{row.codigo_doacao}</td>
                                            <td style={{ opacity: 0.8, whiteSpace: 'nowrap' }}>{String(row.codigo_doador).padStart(6, '0')}</td>
                                            <td style={{ fontWeight: 600 }}>{row.doadores?.nome}</td>
                                            <td>{`${row.doadores?.logradouro || ''} ${row.doadores?.endereco || ''}`.trim()}</td>
                                            <td>{row.doadores?.bairro}</td>
                                            <td>{row.doadores?.regiao}</td>
                                            <td>{row.doadores?.cep}</td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
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

export default RelacaoDoacoesDia;
