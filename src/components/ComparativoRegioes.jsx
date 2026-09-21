import React, { useState } from 'react';
import { Search, Printer, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = [
  'hsl(210, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(120, 60%, 45%)',
  'hsl(45, 80%, 50%)',
  'hsl(270, 60%, 55%)',
  'hsl(180, 60%, 45%)',
  'hsl(30, 70%, 50%)',
  'hsl(0, 65%, 50%)',
  'hsl(0, 0%, 50%)',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const ComparativoRegioes = () => {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);

  const handleConsultar = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Por favor, selecione as datas de início e fim.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doacoes')
        .select('codigo_doacao, doadores(regiao)')
        .gte('data_doacao', dateRange.start)
        .lte('data_doacao', dateRange.end);

      if (error) throw error;

      const counts = {
        'Zona Sul': 0,
        'Zona Oeste': 0,
        'Zona Leste': 0,
        'Zona Norte': 0,
        'Penha': 0,
        'Tatuapé': 0,
        'Itaquera': 0,
        'Guarulhos': 0,
        'Outras': 0,
      };

      data.forEach((d) => {
        const reg = d.doadores?.regiao || 'Outras';
        if (Object.prototype.hasOwnProperty.call(counts, reg)) {
          counts[reg]++;
        } else {
          counts['Outras']++;
        }
      });

      const formatted = Object.keys(counts)
        .map((key) => ({ name: key, value: counts[key] }))
        .filter((item) => item.value > 0);

      setChartData(formatted);
      setTotalDonations(data.length);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar dados do comparativo.');
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => window.print();

  return (
    <div className="main-content-layout comp-regioes-premium">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .sidebar, .header, .comp-filters-premium,
          .no-print, .mobile-menu-btn, .theme-toggle {
            display: none !important;
          }
          .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
          .comp-regioes-premium { background: white !important; color: black !important; padding: 0 !important; }
          .comp-card-premium { box-shadow: none !important; border: none !important; padding: 0 !important; background: white !important; }
          .print-only-header { display: block !important; margin-bottom: 20px; text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; font-size: 11pt; }
          .report-title-print { border-bottom: 1px dotted #000 !important; padding-bottom: 5px; text-align: center; }
          .flex-container { display: flex !important; flex-direction: row !important; align-items: flex-start !important; gap: 20px !important; }
          .table-container { flex: 1; }
          .chart-container-premium { flex: 1; width: 350px !important; height: 350px !important; }
          * { visibility: visible !important; color: black !important; }
        }
        .print-only-header { display: none; }

        .comp-regioes-premium {
          flex-direction: column;
          padding: 24px;
        }
        .comp-card-premium {
          background: var(--card-bg);
          border-radius: 0;
          padding: 30px;
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          width: 100%;
          min-height: 400px;
          display: flex;
          flex-direction: column;
        }
        .comp-header-premium {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .comp-header-premium .icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #14b8a6, #0f766e);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }
        .comp-header-premium h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-color);
          margin: 0;
        }
        .comp-header-premium .subtitle {
          font-size: 0.8rem;
          color: var(--text-muted, #94a3b8);
          margin: 2px 0 0 0;
        }

        .comp-filters-premium {
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

        .comp-btn {
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
        .comp-btn-primary { background: #2563eb; color: white; }
        .comp-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .comp-btn-secondary { background: var(--bg-color); color: var(--text-color); border: 1px solid var(--border-color); }
        .comp-btn-secondary:hover { background: var(--border-color); }
        .comp-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .flex-container {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          gap: 40px;
          align-items: flex-start;
          width: 100%;
        }
        
        @media (max-width: 900px) {
          .flex-container { flex-direction: column; align-items: center; gap: 30px; }
          .table-container, .chart-container-premium { width: 100%; }
        }

        .table-container {
          flex: 1;
          min-width: 300px;
        }
        .chart-container-premium {
          flex: 1.2;
          min-width: 300px;
          height: 450px;
        }

        .table-premium {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .table-premium th {
          background: var(--input-bg);
          padding: 14px 16px;
          text-align: left;
          font-size: 0.75rem;
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
        .table-premium tbody tr.total-row td {
          border-bottom: none;
          background: var(--input-bg);
          font-weight: 800;
          border-top: 2px solid var(--border-color);
        }
        .color-indicator {
          display: inline-block;
          width: 14px;
          height: 14px;
          border-radius: 4px;
          margin-right: 12px;
          vertical-align: middle;
        }

        .div-report-title {
          text-align: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 20px;
        }
        .div-report-title h3 { margin: 0 0 4px 0; color: var(--text-color); text-transform: uppercase; font-size: 1.15rem; }
        .div-report-title p { margin: 0; font-size: 0.85rem; color: var(--text-muted); opacity: 0.8; }
      `}} />

      <div className="comp-card-premium">
        {/* Header Premium */}
        <div className="comp-header-premium no-print">
          <div className="icon-wrapper">
            <MapPin size={24} />
          </div>
          <div>
            <h2>Comparativo de Regiões</h2>
            <p className="subtitle">Análise de doações por zona geográfica com gráficos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="comp-filters-premium no-print">
          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label>Data Início:</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} />
            </div>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label>Data Fim:</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              <input type="date" className="input-field" style={{ paddingLeft: '36px' }} value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <button className="comp-btn comp-btn-primary" onClick={handleConsultar} disabled={loading}>
              <Search size={18} /> {loading ? 'Carregando...' : 'Consultar'}
            </button>
            <button className="comp-btn comp-btn-secondary" onClick={handleImprimir} disabled={chartData.length === 0}>
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

        {chartData.length > 0 ? (
          <>
            {/* Título do Relatório */}
            <div className="div-report-title">
              <h3>Comparativo de Doações por Região</h3>
              <p>Período: {formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
            </div>

            <div className="flex-container">
              {/* Tabela */}
              <div className="table-container">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Região</th>
                      <th style={{ textAlign: 'right', width: '100px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Zona Sul', 'Zona Oeste', 'Zona Leste', 'Zona Norte', 'Penha', 'Tatuapé', 'Itaquera', 'Guarulhos', 'Outras'].map((reg, idx) => {
                      const val = chartData.find((d) => d.name === reg)?.value || 0;
                      return (
                        <tr key={reg}>
                          <td style={{ fontWeight: 600 }}>
                            <span className="color-indicator" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            {reg}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{val}</td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                      <td style={{ color: 'var(--primary-color)' }}>TOTAL GERAL</td>
                      <td style={{ textAlign: 'right', fontSize: '1.05rem', color: 'var(--primary-color)' }}>{totalDonations}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/* Gráfico */}
              <div className="chart-container-premium">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      innerRadius="45%"
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.map((entry, index) => {
                        const regions = ['Zona Sul', 'Zona Oeste', 'Zona Leste', 'Zona Norte', 'Penha', 'Tatuapé', 'Itaquera', 'Guarulhos', 'Outras'];
                        const colorIndex = regions.indexOf(entry.name);
                        return <Cell key={`cell-${entry.name}`} fill={COLORS[colorIndex % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }} />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4, minHeight: '300px' }}>
            <MapPin size={48} style={{ marginBottom: '16px' }} />
            <p>Selecione um período e clique em "Consultar" para carregar os gráficos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparativoRegioes;
