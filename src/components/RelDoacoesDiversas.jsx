import React, { useState } from 'react';
import { Printer, Search, FileText, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import FichaDoacoesNovaModal from './FichaDoacoesNovaModal';

const RelDoacoesDiversas = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [datePart] = String(dateStr).split(/T| /);
        const parts = datePart.split('-');
        if (parts.length !== 3) return dateStr;
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    };

    const getRelevantDate = (donation) => {
        const s = donation.status;
        if (s === 'Remarcada') return formatDate(donation.remarcado_para);
        if (s === 'Baixada') return formatDate(donation.data_retirada || donation.data_doacao);
        if (s === 'Cancelada') return formatDate(donation.data_cancelamento || donation.data_doacao);
        return formatDate(donation.data_retirada || donation.data_doacao);
    };

    const getStatusLabel = (status) => {
        if (status === 'Pendente') return 'pendência';
        return status;
    };

    const handleConsultar = async () => {
        if (!dateRange.start || !dateRange.end) {
            alert('Por favor, selecione as datas de início e fim.');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('doacoes')
                .select('*, doadores(nome, regiao, cep, endereco, logradouro, complemento, bairro, cidade, estado, mapa, contato, fixo, celular, whatsapp)')
                .gte('data_doacao', dateRange.start)
                .lte('data_doacao', dateRange.end)
                .neq('status', 'Baixada')
                .neq('status', 'Cancelada')
                .order('codigo_doador', { ascending: true });

            if (error) throw error;
            const filteredData = (data || []).filter(d => {
                if (!d.status) return true;
                const s = d.status.toString().toLowerCase().trim();
                return s !== 'baixada' && s !== 'cancelada';
            });
            setReportData(filteredData);
            if (!data || data.length === 0)
                alert('Nenhum registro encontrado para este período.');
        } catch (err) {
            console.error(err);
            alert('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleImprimir = () => {
        // Técnica de Iframe Isolado para Padronização Blindada
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printArea = document.querySelector('.rel-diversas-premium');
        if (!printArea) return;

        const printContent = printArea.innerHTML;
        const styles = document.querySelector('.rel-diversas-premium style').innerHTML;

        const doc = iframe.contentWindow.document;
        doc.write(`
            <html>
                <head>
                    <title>Relatórios Diversos</title>
                    <style>
                        ${styles}
                        @media print {
                            @page { size: A4 landscape; margin: 10mm; }
                            body { margin: 0; padding: 0; background: white; width: 100%; transition: none !important; }
                            .no-print, .sidebar, .header, .rel-diversas-filters, .rel-header-premium { display: none !important; }
                            .rel-diversas-premium { width: 100% !important; padding: 0 !important; visibility: visible !important; }
                            .rel-table-premium { width: 100% !important; border-collapse: collapse !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="rel-diversas-premium">${printContent}</div>
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

    const handleFichaClick = async (d) => {
        const doadoresFull = d.doadores || {};
        doadoresFull.fone = doadoresFull.fixo || doadoresFull.celular || doadoresFull.whatsapp || '';
        const { data: itemData } = await supabase
            .from('itens_doacao')
            .select('*')
            .eq('id_doacao', d.codigo_doacao);
        setSelectedDonation({
            ...d,
            codigo: d.codigo_doacao,
            codigoDoador: d.codigo_doador,
            nomeDoador: d.doadores?.nome,
            dataDoacao: d.data_doacao,
            itens: itemData || [],
            doadores: doadoresFull
        });
    };

    return (
        <div className="main-content-layout rel-diversas-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .sidebar, .header, .rel-diversas-filters, .rel-header-premium,
                    .no-print, .mobile-menu-btn, .theme-toggle {
                        display: none !important;
                    }
                    .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
                    .rel-diversas-premium { background: white !important; color: black !important; visibility: visible !important; padding: 0 !important; }
                    .rel-diversas-card { box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
                    .print-only-header { display: block !important; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 11pt; }
                    .div-rel-title { border-bottom: 2px dashed #000 !important; margin-bottom: 16px; padding-bottom: 8px; text-align: center; }
                    .rel-table-premium { width: 100%; border-collapse: collapse; font-size: 9pt; }
                    .rel-table-premium th, .rel-table-premium td {
                        border: none !important; border-bottom: 1px dotted #ccc !important; padding: 6px !important; color: black !important;
                    }
                    .rel-table-premium th { border-bottom: 2px solid #000 !important; background: transparent !important; color: #000 !important; font-weight: bold; }
                    * { visibility: visible !important; color: black !important; }
                }
                .print-only-header { display: none; }

                .rel-diversas-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .rel-diversas-card {
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
                    background: linear-gradient(135deg, #0ea5e9, #0284c7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
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

                .rel-diversas-filters {
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
                    table-layout: fixed;
                    border-collapse: separate;
                    border-spacing: 0;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                    margin-top: 16px;
                }
                .rel-table-premium th {
                    background: var(--input-bg);
                    padding: 12px 14px;
                    text-align: left;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--text-color);
                    border-bottom: 2px solid var(--border-color);
                }
                .rel-table-premium td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                    vertical-align: middle;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .rel-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .rel-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .col-data    { width: 12%; }
                .col-cod-d   { width: 12%; }
                .col-cod-doa { width: 12%; font-weight: 700; color: var(--primary-color); }
                .col-nome    { width: 34%; font-weight: 600; }
                .col-status  { width: 13%; }
                .col-acao    { width: 17%; text-align: center; }

                .btn-ficha-modern {
                    padding: 6px 14px;
                    background: var(--input-bg);
                    color: var(--text-color);
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-ficha-modern:hover {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .div-rel-title {
                    text-align: center;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color);
                    margin-bottom: 20px;
                }
                .div-rel-title h3 { margin: 0 0 4px 0; color: var(--text-color); text-transform: uppercase; font-size: 1.1rem; }
                .div-rel-title p { margin: 0; font-size: 0.85rem; color: var(--text-muted); opacity: 0.8; }
            `}} />

            <div className="rel-diversas-card">
                {/* Header Premium */}
                <div className="rel-header-premium">
                    <div className="icon-wrapper">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2>Relações Diversas</h2>
                        <p className="subtitle">Relatório abrangente de histórico de doações</p>
                    </div>
                </div>

                {/* Filtros Premium */}
                <div className="rel-diversas-filters">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Data Início:</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="date"
                                className="input-field"
                                style={{ paddingLeft: '36px' }}
                                value={dateRange.start}
                                onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
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
                                value={dateRange.end}
                                onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                            />
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto', flexWrap: 'wrap' }}>
                        <button className="rel-btn rel-btn-primary" onClick={handleConsultar} disabled={loading}>
                            <Search size={18} /> {loading ? 'Buscando...' : 'Consultar'}
                        </button>
                        <button className="rel-btn rel-btn-secondary" onClick={handleImprimir} disabled={reportData.length === 0}>
                            <Printer size={18} /> Imprimir
                        </button>
                    </div>
                </div>

                {/* Print Only Header */}
                <div className="print-only-header">
                    <strong>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</strong><br />
                    RUA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP<br />
                    CEP 03610-030 - Telefone (11) 2164-1800 - CNPJ 60.478.245/0001-5<br />
                    E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br
                </div>

                {/* Resultados */}
                <div className="div-rel-title">
                    <h3>Relatório de Doações Diversas</h3>
                    {dateRange.start && dateRange.end && (
                        <p>Período: {formatDate(dateRange.start)} até {formatDate(dateRange.end)}</p>
                    )}
                </div>

                <div style={{ overflowX: 'auto', borderRadius: '12px', paddingBottom: '2px' }}>
                    <table className="rel-table-premium">
                        <colgroup>
                            <col className="col-data" />
                            <col className="col-cod-d" />
                            <col className="col-cod-doa" />
                            <col className="col-nome" />
                            <col className="col-status" />
                            <col className="col-acao no-print" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>RETIRADA</th>
                                <th>Cod. Doação</th>
                                <th>Cód. Doador</th>
                                <th>Nome Doador</th>
                                <th>Status</th>
                                <th className="no-print" style={{ textAlign: 'center' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ? (
                                reportData.map((d, idx) => (
                                    <tr key={idx}>
                                        <td className="col-data">{getRelevantDate(d)}</td>
                                        <td className="col-cod-d">{d.codigo_doacao}</td>
                                        <td className="col-cod-doa">{d.codigo_doador}</td>
                                        <td className="col-nome" title={d.doadores?.nome}>{d.doadores?.nome || '—'}</td>
                                        <td className="col-status">
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: d.status === 'Cancelada' ? '#fee2e2' : d.status === 'Baixada' ? '#dcfce7' : d.status === 'Remarcada' ? '#dbeafe' : 'var(--input-bg)',
                                                color: d.status === 'Cancelada' ? '#991b1b' : d.status === 'Baixada' ? '#166534' : d.status === 'Remarcada' ? '#1e40af' : 'var(--text-color)'
                                            }}>
                                                {getStatusLabel(d.status)}
                                            </span>
                                        </td>
                                        <td className="col-acao no-print">
                                            <button
                                                className="btn-ficha-modern"
                                                onClick={() => handleFichaClick(d)}
                                            >
                                                <Printer size={14} /> Ficha
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>
                                        Clique em "Consultar" para exibir as doações do período selecionado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDonation && (
                <FichaDoacoesNovaModal
                    donation={selectedDonation}
                    onClose={() => setSelectedDonation(null)}
                />
            )}
        </div>
    );
};

export default RelDoacoesDiversas;
