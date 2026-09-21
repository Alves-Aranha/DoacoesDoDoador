import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const HistoricoDoacoes = () => {
  const [dataInicioEsq, setDataInicioEsq] = useState('2020-01-01');
  const [dataFimEsq, setDataFimEsq] = useState(new Date().toISOString().split('T')[0]);
  const [codigoDoadorEsq, setCodigoDoadorEsq] = useState('');
  const [codigoFiltradoEsq, setCodigoFiltradoEsq] = useState('');
  const [listagemEsq, setListagemEsq] = useState([]);
  const [carregandoEsq, setCarregandoEsq] = useState(false);


  const formatarCodigoDoador = useCallback((valor) => {
    const codigo = String(valor || '').replace(/\D/g, '').trim();
    return codigo ? codigo.padStart(6, '0') : '';
  }, []);

  const buildCodigoDoadorFilter = useCallback((query, codigo) => {
    if (!codigo) return query;
    const padded = formatarCodigoDoador(codigo);
    const raw = String(codigo).replace(/^0+/, '') || '0';
    if (raw !== padded) {
      return query.or(`codigo_doador.eq.${padded},codigo_doador.eq.${raw}`);
    }
    return query.eq('codigo_doador', padded);
  }, [formatarCodigoDoador]);

  const buscarDadosEsquerda = useCallback(async (filtroCodigo = codigoFiltradoEsq, getIgnore = () => false) => {
    if (!supabase) return;
    setCarregandoEsq(true);
    try {
      let allData = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore && !getIgnore()) {
        let query = supabase
          .from('historico_doacoes')
          .select(`codigo_doacao, codigo_doador, data_doacao`)
          .gte('data_doacao', dataInicioEsq)
          .lte('data_doacao', dataFimEsq);

        if (filtroCodigo) {
          query = buildCodigoDoadorFilter(query, filtroCodigo);
        }

        const { data, error } = await query
          .order('data_doacao', { ascending: false })
          .order('codigo_doacao', { ascending: false })
          .range(from, from + step - 1);

        if (error) {
          console.error('Erro na query:', error);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          if (data.length < step) hasMore = false;
          else from += step;
        } else {
          hasMore = false;
        }
      }

      if (getIgnore()) return;

      if (allData.length > 0) {
        const nomes = await buscarNomesDoadores(allData.map((item) => item.codigo_doador));
        if (getIgnore()) return;
        const resultado = allData.map((item) => ({
          ...item,
          doadores: { nome: nomes[item.codigo_doador] || null }
        }));
        setListagemEsq(resultado);
      } else {
        setListagemEsq([]);
      }
    } catch (err) {
      console.error('Erro na busca da esquerda:', err.message || err);
    } finally {
      if (!getIgnore()) setCarregandoEsq(false);
    }
  }, [codigoFiltradoEsq, dataInicioEsq, dataFimEsq, buildCodigoDoadorFilter]);

  useEffect(() => {
    let ignore = false;
    buscarDadosEsquerda(undefined, () => ignore);
    return () => { ignore = true; };
  }, [buscarDadosEsquerda]);

  const pesquisarEsq = () => {
    const valor = formatarCodigoDoador(codigoDoadorEsq);
    if (valor !== codigoFiltradoEsq) {
      setCodigoFiltradoEsq(valor);
    } else {
      buscarDadosEsquerda(valor);
    }
  };



  const formatarDataBR = (dataString) => {
    if (!dataString) return '';
    const partes = dataString.split('-');
    if (partes.length !== 3) return dataString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const extrairAno = (dataString) => {
    if (!dataString) return '';
    return dataString.split('-')[0];
  };

  const getDoacoesDuplicadas = (listagem) => {
    const contagem = listagem.reduce((acc, item) => {
      const codigo = String(item?.codigo_doador || '').trim();
      if (!codigo) return acc;
      if (!acc[codigo]) {
        acc[codigo] = {
          codigo_doador: item.codigo_doador,
          nome: item.doadores?.nome,
          quantidade: 0
        };
      }
      acc[codigo].quantidade += 1;
      return acc;
    }, {});

    return Object.values(contagem)
      .filter((doador) => doador.quantidade > 1)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  };

  const handleCodigoDoadorChange = (setter) => (event) => {
    const digits = String(event.target.value || '').replace(/\D/g, '').slice(0, 6);
    setter(digits);
  };

  const handleCodigoDoadorBlur = (valor, setter) => {
    setter(formatarCodigoDoador(valor));
  };

  const buscarNomesDoadores = async (codigos) => {
    if (!supabase) return {};
    const codigosUnicos = [...new Set(codigos.filter(Boolean))];
    if (codigosUnicos.length === 0) return {};

    const chunkSize = 200;
    const allNomes = {};

    for (let i = 0; i < codigosUnicos.length; i += chunkSize) {
      const chunk = codigosUnicos.slice(i, i + chunkSize);
      const { data, error } = await supabase
        .from('doadores')
        .select('codigo_doador, nome')
        .in('codigo_doador', chunk);

      if (error) {
        console.error('Erro ao buscar nomes de doadores:', error.message);
        continue;
      }

      if (data) {
        data.forEach((item) => {
          allNomes[item.codigo_doador] = item.nome;
        });
      }
    }

    return allNomes;
  };



  const estilos = {
    pagina: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-color)',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'sans-serif'
    },
    tituloContainer: {
      width: '100%',
      textAlign: 'center',
      marginBottom: '20px'
    },
    titulo: {
      fontSize: '24px',
      fontWeight: '600',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '12px',
      display: 'inline-block',
      paddingLeft: '48px',
      paddingRight: '48px',
      margin: '0'
    },
    corpoDividido: {
      display: 'flex',
      flex: 1,
      gap: '24px',
      height: 'calc(100vh - 120px)',
      overflow: 'hidden',
      width: '100%'
    },
    painel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--card-bg)',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    },
    filtroLinha: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      marginBottom: '16px',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      flexWrap: 'wrap'
    },
    inputDate: {
      backgroundColor: 'var(--input-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '4px',
      padding: '4px 8px',
      color: 'var(--text-color)',
      outline: 'none',
      marginLeft: '6px'
    },
    botaoBuscar: {
      backgroundColor: 'var(--button-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: '6px',
      color: 'var(--button-text)',
      padding: '8px 16px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    campoPesquisa: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'nowrap'
    },
    tabelaContainer: {
      flex: 1,
      overflowY: 'auto'
    },
    tabela: {
      width: '100%',
      textAlign: 'left',
      fontSize: '14px',
      borderCollapse: 'collapse'
    },
    th: {
      color: 'var(--text-muted)',
      borderBottom: '1px solid var(--border-color)',
      padding: '8px 12px',
      position: 'sticky',
      top: 0,
      backgroundColor: 'var(--card-bg)',
      zIndex: 10
    },
    thNome: {
      width: '30%',
      textAlign: 'left',
      padding: '8px 12px'
    },
    td: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-color)',
      color: 'var(--text-color)'
    },
    tdNome: {
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-color)',
      color: 'var(--text-color)',
      width: '30%',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '150px'
    }
  };

  if (!supabase) {
    return (
      <div style={{ ...estilos.pagina, justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#ef4444', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center', maxWidth: '500px' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Erro de Configuração (Vite)</h3>
          <p style={{ margin: 0 }}>
            Não foi possível ler as credenciais do seu arquivo <strong>.env</strong>.<br/><br/>
            Verifique se as variáveis dentro do arquivo na raiz estão nomeadas exatamente como:<br/>
            <strong>VITE_SUPABASE_URL</strong><br/>
            <strong>VITE_SUPABASE_ANON_KEY</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={estilos.pagina}>
      <header style={estilos.tituloContainer}>
        <h1 style={estilos.titulo}>Histórico de Doações</h1>
      </header>

      <div style={estilos.corpoDividido}>
        <div style={estilos.painel}>
          <div style={estilos.filtroLinha}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#60a5fa' }}>
              Doações de 2020 até o presente
            </div>
            <button type="button" style={estilos.botaoBuscar} onClick={pesquisarEsq}>
              Buscar
            </button>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', ...estilos.campoPesquisa }}>
              <label>CÓD.DOADOR:</label>
              <input
                type="text"
                value={codigoDoadorEsq}
                onChange={handleCodigoDoadorChange(setCodigoDoadorEsq)}
                onBlur={() => handleCodigoDoadorBlur(codigoDoadorEsq, setCodigoDoadorEsq)}
                placeholder="000000"
                style={{ ...estilos.inputDate, width: '100px' }}
              />
              <label>Data Início:</label>
              <input
                type="date"
                value={dataInicioEsq}
                onChange={(e) => setDataInicioEsq(e.target.value)}
                style={estilos.inputDate}
              />
              <label style={{ marginLeft: '12px' }}>Data Fim:</label>
              <input
                type="date"
                value={dataFimEsq}
                onChange={(e) => setDataFimEsq(e.target.value)}
                style={estilos.inputDate}
              />
            </div>
          </div>

          <div style={estilos.tabelaContainer}>
            {carregandoEsq ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>A carregar resumo...</div>
            ) : (() => {
              const doacoesDuplicadasEsq = getDoacoesDuplicadas(listagemEsq);
              const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e', '#8b5cf6', '#3b82f6', '#10b981'];

              return doacoesDuplicadasEsq.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  Nenhum doador com mais de uma doação encontrado neste período.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#16a34a', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                    TOP 10 doadores com mais doações no período
                  </div>
                  <table style={{ ...estilos.tabela, tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '55%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={estilos.th}>DOADOR</th>
                        <th style={{ ...estilos.th, textAlign: 'left' }}>NOME</th>
                        <th style={{ ...estilos.th, textAlign: 'center' }}>QTD.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doacoesDuplicadasEsq.map((item, index) => (
                        <tr key={`dup-esq-${index}`}>
                          <td style={{ ...estilos.td, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.codigo_doador}</td>
                          <td style={{ ...estilos.td, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.nome || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Doador Antigo (Excluído)</span>}
                          </td>
                          <td style={{ ...estilos.td, textAlign: 'center', fontWeight: 'bold' }}>{item.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ height: '350px', width: '100%', paddingRight: '10px', flexShrink: 0, paddingBottom: '20px', marginTop: '20px' }}>
                    <h4 style={{ textAlign: 'center', color: 'var(--text-color)', margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600' }}>
                      Gráfico de Doações do Período
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={doacoesDuplicadasEsq}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis 
                          dataKey="nome" 
                          stroke="var(--text-muted)" 
                          tick={{ fontSize: 12 }} 
                          tickFormatter={(val) => (val || 'Antigo').split(' ')[0]} 
                        />
                        <YAxis 
                          stroke="var(--text-muted)" 
                          tick={{ fontSize: 12 }} 
                          allowDecimals={false} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)', borderRadius: '6px' }}
                          itemStyle={{ color: 'var(--text-color)', fontWeight: '600' }}
                          cursor={{ fill: 'var(--border-color)', opacity: 0.4 }}
                        />
                        <Bar dataKey="quantidade" name="Doações" radius={[4, 4, 0, 0]} maxBarSize={60}>
                          {doacoesDuplicadasEsq.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoricoDoacoes;
