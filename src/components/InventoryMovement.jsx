import React, { useState, useEffect } from 'react';
import { Package, ArrowUpCircle, ArrowDownCircle, RefreshCw, Save, History, X, Loader2, CheckCircle, AlertTriangle, Calendar, Search, FileText, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { registerLog } from '../utils/logger';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}><X size={14} /></button>
        </div>
    );
};

const InventoryMovement = () => {
    const { user } = useAuth();
    const [itens, setItens] = useState([]);
    const [movimentacoes, setMovimentacoes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMov, setLoadingMov] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [codigoCompleto, setCodigoCompleto] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [tipo, setTipo] = useState('Entrada');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');

    // Report / filter state
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [movSummary, setMovSummary] = useState([]);
    const [showPdfPreview, setShowPdfPreview] = useState(false);
    const [pdfDataUrl, setPdfDataUrl] = useState('');

    const showToast = (message, type = 'success') => setToast({ message, type });

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        fetchItens();
        fetchMovimentacoes();
    }, []);

    const fetchItens = async () => {
        const { data, error } = await supabase
            .from('itens')
            .select('codigo_completo, nome, qtde')
            .order('nome');
        if (!error && data) setItens(data);
    };

    const fetchMovimentacoes = async (startDate, endDate) => {
        setLoadingMov(true);
        try {
            let query = supabase
                .from('movimentacoes')
                .select(`*, itens ( nome )`);

            if (startDate && endDate) {
                query = query
                    .gte('criado_em', `${startDate}T00:00:00`)
                    .lte('criado_em', `${endDate}T23:59:59`);
            } else {
                query = query.limit(50);
            }

            query = query.order('criado_em', { ascending: false });

            const { data, error } = await query;

            let summaryData;

            if (error) {
                console.error('Erro ao buscar movimentações:', error);
                const { data: simpleData } = await supabase
                    .from('movimentacoes')
                    .select('*')
                    .order('criado_em', { ascending: false })
                    .limit(startDate && endDate ? null : 50);
                setMovimentacoes(simpleData || []);
                summaryData = simpleData;
            } else {
                setMovimentacoes(data || []);
                summaryData = data;
            }

            // Build summary
            if (summaryData && startDate && endDate) {
                const grouped = {};
                summaryData.forEach((m) => {
                    const key = m.codigo_completo;
                    if (!grouped[key]) {
                        grouped[key] = { codigo_completo: key, nome: m.itens?.nome || getItemName(key) || '-', entradas: 0, saidas: 0, ajustes: 0 };
                    }
                    const qtd = Number(m.quantidade) || 0;
                    if (m.tipo === 'Entrada') grouped[key].entradas += qtd;
                    else if (m.tipo === 'Saída') grouped[key].saidas += qtd;
                    else if (m.tipo === 'Ajuste') grouped[key].ajustes += qtd;
                });
                setMovSummary(Object.values(grouped).sort((a, b) => a.codigo_completo.localeCompare(b.codigo_completo)));
            } else {
                setMovSummary([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMov(false);
        }
    };

    const getItemName = (codigo) => {
        const found = itens.find(i => i.codigo_completo === codigo);
        return found?.nome || '-';
    };

    const handleGerarPDF = async () => {
        if (movimentacoes.length === 0) return;
        try {
            const doc = new jsPDF('l', 'mm', 'a4');
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório de Movimentações do Estoque', 148, 20, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Período: ${formatDate(dateStart)} a ${formatDate(dateEnd)}`, 148, 27, { align: 'center' });
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Detalhamento das Movimentações', 15, 38);

            const detailBody = movimentacoes.map((m) => [
                m.criado_em ? new Date(m.criado_em).toLocaleDateString('pt-BR') : '-',
                m.codigo_completo,
                m.itens?.nome || getItemName(m.codigo_completo),
                m.tipo,
                m.quantidade,
                m.motivo || '-',
            ]);

            autoTable(doc, {
                startY: 42,
                head: [['Data Mov.', 'Cód. Item', 'Descrição do Item', 'Tipo Mov.', 'Qtde.', 'Motivo']],
                body: detailBody,
                theme: 'grid',
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
                styles: { fontSize: 8 },
                columnStyles: {
                    0: { cellWidth: 32 }, 1: { cellWidth: 30 }, 2: { cellWidth: 70 },
                    3: { cellWidth: 22 }, 4: { cellWidth: 18, halign: 'right' }, 5: { cellWidth: 'auto' },
                },
            });

            const summaryY = doc.lastAutoTable.finalY + 12;
            const summaryStartY = summaryY > 170 ? (doc.addPage(), 20) : summaryY;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumo por Item', 15, summaryStartY);

            let totalEntradas = 0, totalSaidas = 0, totalAjustes = 0;
            const summaryBody = movSummary.map((s) => {
                totalEntradas += s.entradas; totalSaidas += s.saidas; totalAjustes += s.ajustes;
                return [s.codigo_completo, s.nome, s.entradas, s.saidas, s.ajustes, s.entradas - s.saidas + s.ajustes];
            });
            const saldoFinal = totalEntradas - totalSaidas + totalAjustes;
            summaryBody.push(['TOTAL GERAL', '', totalEntradas, totalSaidas, totalAjustes, saldoFinal]);

            autoTable(doc, {
                startY: summaryStartY + 4,
                head: [['Cód. Item', 'Descrição do Item', 'Entradas', 'Saídas', 'Ajustes', 'Saldo Final']],
                body: summaryBody,
                theme: 'grid',
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 35 }, 1: { cellWidth: 90 },
                    2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' },
                    4: { cellWidth: 30, halign: 'right' }, 5: { cellWidth: 30, halign: 'right' },
                },
                footStyles: { textColor: [0, 0, 0], fontStyle: 'bold' },
            });

            const dataUrl = doc.output('datauristring');
            setPdfDataUrl(dataUrl);
            setShowPdfPreview(true);
        } catch (err) {
            console.error('Erro ao gerar PDF:', err);
            alert('Erro ao gerar PDF. Tente novamente.');
        }
    };

    const handlePrintPDF = () => {
        const printWindow = window.open(pdfDataUrl, '_blank');
        if (printWindow) {
            printWindow.onload = () => {
                setTimeout(() => printWindow.print(), 500);
            };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!codigoCompleto || !tipo || !quantidade) {
            showToast('Preencha o item, tipo e quantidade.', 'error');
            return;
        }

        setSaving(true);
        try {
            const { error: movError } = await supabase
                .from('movimentacoes')
                .insert([{
                    codigo_completo: codigoCompleto,
                    tipo,
                    quantidade: Number(quantidade),
                    motivo: motivo.trim()
                }]);

            if (movError) throw movError;

            const { data: itemData } = await supabase
                .from('itens')
                .select('qtde')
                .eq('codigo_completo', codigoCompleto)
                .single();

            if (itemData) {
                let novoSaldo = parseFloat(itemData.qtde) || 0;
                if (tipo === 'Entrada') novoSaldo += parseFloat(quantidade);
                else if (tipo === 'Saída') novoSaldo -= parseFloat(quantidade);
                else if (tipo === 'Ajuste') novoSaldo = parseFloat(quantidade);

                await supabase
                    .from('itens')
                    .update({ qtde: novoSaldo })
                    .eq('codigo_completo', codigoCompleto);
            }

            showToast('Movimentação registrada com sucesso!');
            await registerLog({ usuario_email: user?.email || '', acao: 'Inclusão', modulo: 'Movimentações Estoque', detalhes: `${tipo} de ${quantidade} un. - Item: ${codigoCompleto}` });
            
            setCodigoCompleto('');
            setSearchTerm('');
            setQuantidade('');
            setMotivo('');
            
            fetchMovimentacoes();
            fetchItens();
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar movimentação: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="main-content-layout mov-page-premium" style={{ position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .mov-page-premium {
                    flex-direction: column;
                    padding: 24px;
                    gap: 24px;
                }
                .mov-premium-card {
                    background: var(--card-bg);
                    border-radius: 0;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
                }

                .mov-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .mov-header-premium .icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .mov-header-premium .icon-wrapper.form-icon {
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                }
                .mov-header-premium .icon-wrapper.history-icon {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                }
                .mov-header-premium h2 {
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                }
                .mov-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }

                .mov-section-title {
                    color: #1e3a8a;
                    font-size: 0.8rem;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin: 20px 0 16px 0;
                }
                .mov-section-title::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #e2e8f0;
                }
                [data-theme='dark'] .mov-section-title {
                    color: #60a5fa;
                }
                [data-theme='dark'] .mov-section-title::after {
                    background: #334155;
                }

                .mov-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 16px;
                }
                .mov-form-grid .full-span {
                    grid-column: 1 / -1;
                }

                .mov-btn-save {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 24px;
                    border-radius: 0;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                    background: #2563eb;
                    color: white;
                    margin-left: auto;
                }
                .mov-btn-save:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .mov-btn-save:disabled { background: #94a3b8; cursor: not-allowed; transform: none; box-shadow: none; }
                .mov-btn-green { background: #10b981; }
                .mov-btn-green:hover { background: #059669; }
                .mov-btn-gray { background: #64748b; }
                .mov-btn-gray:hover { background: #475569; }

                .mov-table-premium {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    margin-top: 12px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border-color);
                }
                .mov-table-premium th {
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
                .mov-table-premium td {
                    padding: 10px 14px;
                    border-bottom: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    color: var(--text-color);
                    transition: background 0.15s;
                }
                .mov-table-premium tbody tr:hover td {
                    background: var(--input-bg);
                }
                .mov-table-premium tbody tr:last-child td {
                    border-bottom: none;
                }

                .mov-tipo-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .mov-tipo-badge.entrada {
                    background: #dcfce7;
                    color: #166534;
                }
                .mov-tipo-badge.saida {
                    background: #fee2e2;
                    color: #991b1b;
                }
                .mov-tipo-badge.ajuste {
                    background: #e0e7ff;
                    color: #3730a3;
                }
                [data-theme='dark'] .mov-tipo-badge.entrada {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                }
                [data-theme='dark'] .mov-tipo-badge.saida {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                }
                [data-theme='dark'] .mov-tipo-badge.ajuste {
                    background: rgba(99, 102, 241, 0.15);
                    color: #a5b4fc;
                }

                .mov-filter-panel {
                    background: var(--input-bg);
                    padding: 20px;
                    border-radius: 0;
                    border: 1px solid var(--border-color);
                }

                .mov-counter-badge {
                    background: var(--input-bg);
                    color: var(--text-color);
                    padding: 4px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border: 1px solid var(--border-color);
                    margin-left: auto;
                }
            `}} />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Card - Nova Movimentação */}
            <div className="mov-premium-card">

                <div className="mov-section-title">📝 Dados da Movimentação</div>

                <form onSubmit={handleSubmit}>
                    <div className="mov-form-grid">
                        <div className="form-group full-span">
                            <label>Item (Código ou Nome)</label>
                            <input 
                                list="lista-itens-mov" 
                                className="input-field"
                                placeholder="Pesquise o item..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    const found = itens.find(it => `${it.codigo_completo} - ${it.nome}` === e.target.value || it.codigo_completo === e.target.value);
                                    if (found) setCodigoCompleto(found.codigo_completo);
                                    else setCodigoCompleto('');
                                }}
                            />
                            <datalist id="lista-itens-mov">
                                {itens.map(it => (
                                    <option key={it.codigo_completo} value={`${it.codigo_completo} - ${it.nome}`} />
                                ))}
                            </datalist>
                        </div>

                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="input-field" value={tipo} onChange={e => setTipo(e.target.value)}>
                                <option value="Entrada">Entrada (+)</option>
                                <option value="Saída">Saída (-)</option>
                                <option value="Ajuste">Ajuste (=)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Quantidade</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                value={quantidade} 
                                onChange={e => setQuantidade(e.target.value)} 
                                placeholder="0.00"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group full-span">
                            <label>Motivo / Observação</label>
                            <input 
                                className="input-field" 
                                value={motivo} 
                                onChange={e => setMotivo(e.target.value)} 
                                placeholder="Opcional..."
                            />
                        </div>

                        <div className="form-group full-span" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button type="submit" className="mov-btn-save" disabled={saving}>
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Salvar Movimentação
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Card - Histórico */}
            <div className="mov-premium-card">
                <div className="mov-header-premium">
                    <div className="icon-wrapper history-icon">
                        <History size={22} />
                    </div>
                    <div>
                        <h2>Histórico de Movimentações</h2>
                        <p className="subtitle">{dateStart ? `Período: ${formatDate(dateStart)} a ${formatDate(dateEnd)}` : 'Últimas 50 movimentações registradas'}</p>
                    </div>
                    <span className="mov-counter-badge">{movimentacoes.length} registro(s)</span>
                </div>

                <div className="mov-section-title" style={{ marginTop: 0 }}>📅 Filtro por Período</div>

                <div className="mov-filter-panel" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
                        <label>Data Início:</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={dateStart} onChange={e => setDateStart(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
                        <label>Data Fim:</label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                        </div>
                    </div>
                    <button
                        className="mov-btn-save"
                        style={{ height: '40px', padding: '8px 16px' }}
                        onClick={() => { if (!dateStart || !dateEnd) { alert('Selecione as datas de início e fim.'); return; } fetchMovimentacoes(dateStart, dateEnd); }}
                        disabled={loadingMov}
                    >
                        <Search size={16} /> {loadingMov ? 'Buscando...' : 'Consultar'}
                    </button>
                    <button
                        className="mov-btn-save mov-btn-green"
                        style={{ height: '40px', padding: '8px 16px' }}
                        onClick={handleGerarPDF}
                        disabled={movimentacoes.length === 0}
                    >
                        <FileText size={16} /> Gerar PDF
                    </button>
                    <button
                        className="mov-btn-save mov-btn-gray"
                        style={{ height: '40px', padding: '8px 16px' }}
                        onClick={() => { setDateStart(''); setDateEnd(''); setMovSummary([]); fetchMovimentacoes(); }}
                    >
                        <RefreshCw size={16} /> Limpar Filtro
                    </button>
                </div>

                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: 0 }}>
                    <table className="mov-table-premium">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Código</th>
                                <th>Nome do Item</th>
                                <th>Tipo</th>
                                <th style={{ textAlign: 'center' }}>Qtd</th>
                                <th>Motivo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingMov ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Carregando...</td></tr>
                            ) : movimentacoes.length > 0 ? (
                                movimentacoes.map((mov) => (
                                    <tr key={mov.id}>
                                        <td>{mov.criado_em ? new Date(mov.criado_em).toLocaleDateString("pt-BR") : "—"}</td>
                                        <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>{mov.codigo_completo}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {mov.itens?.nome || itens.find(it => it.codigo_completo === mov.codigo_completo)?.nome || mov.nome_item_manual || "—"}
                                        </td>
                                        <td>
                                            <span className={`mov-tipo-badge ${mov.tipo === 'Entrada' ? 'entrada' : mov.tipo === 'Saída' ? 'saida' : 'ajuste'}`}>
                                                {mov.tipo === 'Entrada' && <ArrowUpCircle size={14} />}
                                                {mov.tipo === 'Saída' && <ArrowDownCircle size={14} />}
                                                {mov.tipo === 'Ajuste' && <RefreshCw size={14} />}
                                                {mov.tipo}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{mov.quantidade}</td>
                                        <td style={{ opacity: 0.7, fontSize: '0.85rem' }}>{mov.motivo || "—"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', opacity: 0.5 }}>Nenhuma movimentação encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {movSummary.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <div className="mov-section-title">📊 Resumo por Item</div>
                        <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                            <table className="mov-table-premium">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Item</th>
                                        <th style={{ textAlign: 'right' }}>Entradas</th>
                                        <th style={{ textAlign: 'right' }}>Saídas</th>
                                        <th style={{ textAlign: 'right' }}>Ajustes</th>
                                        <th style={{ textAlign: 'right' }}>Saldo Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        let tE = 0, tS = 0, tA = 0;
                                        const rows = movSummary.map(s => {
                                            tE += s.entradas; tS += s.saidas; tA += s.ajustes;
                                            const saldo = s.entradas - s.saidas + s.ajustes;
                                            return (
                                                <tr key={s.codigo_completo}>
                                                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.codigo_completo}</td>
                                                    <td style={{ fontWeight: 600 }}>{s.nome}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{s.entradas}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{s.saidas}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#f59e0b' }}>{s.ajustes}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 800 }}>{saldo}</td>
                                                </tr>
                                            );
                                        });
                                        rows.push(
                                            <tr key="total" style={{ background: 'var(--input-bg)', fontWeight: 800 }}>
                                                <td colSpan="2" style={{ fontWeight: 800, color: 'var(--primary-color)' }}>TOTAL GERAL</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>{tE}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>{tS}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{tA}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 800 }}>{tE - tS + tA}</td>
                                            </tr>
                                        );
                                        return rows;
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {showPdfPreview && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div style={{
                        background: 'white',
                        width: '95%',
                        maxWidth: '1200px',
                        height: '95vh',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            flexShrink: 0,
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                                Relatório de Movimentações do Estoque
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="mov-pdf-btn"
                                    onClick={handlePrintPDF}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 18px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#2563eb',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <Printer size={16} />
                                    Imprimir (PDF)
                                </button>
                                <button
                                    className="mov-pdf-btn"
                                    onClick={() => setShowPdfPreview(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 18px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        color: '#475569',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} />
                                    Fechar
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <iframe
                                src={pdfDataUrl}
                                style={{ width: '100%', height: '100%', border: 'none' }}
                                title="PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryMovement;
