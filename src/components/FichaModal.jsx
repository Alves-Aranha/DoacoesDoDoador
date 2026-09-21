import React from 'react';
import { X, Printer, User, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import printService from '../services/printService';

const FichaModal = ({ isOpen, onClose, doador }) => {
  if (!isOpen || !doador) return null;

  const codigo = doador.codigo ?? doador.codigo_doador ?? '';
  const tipoDoador = doador.tipo ?? doador.tipo_doador ?? 'Mensal';
  const dataCadastro = doador.dataCadastro ?? doador.data_cadastro ?? '';
  const regiao = doador.regiao ?? '';
  const codigoDisplay = String(codigo || 1).padStart(6, '0');

  const handlePrint = async () => {
    const html = buildPrintHTML(doador);
    const result = await printService.printHTMLRawToner(html);
    if (!result.success) {
      alert('Erro ao imprimir: ' + result.error);
    }
  };

  const sectionTitle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--primary-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: 6,
    marginBottom: 12,
  };

  const label = { color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'block', fontSize: '0.62rem' };
  const value = { fontWeight: 600, color: 'var(--text-color)', fontSize: '0.8rem' };

  return (
    <div className="ficha-modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', padding: '16px',
    }}>
      <div className="ficha-modal-card" style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-xl)',
        maxWidth: '768px',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        <div className="ficha-modal-header" style={{
          background: 'var(--input-bg)',
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ padding: '8px', background: 'var(--primary-color)', borderRadius: '8px', color: 'white', display: 'flex' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-color)' }}>Ficha do Doador</h2>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Cód: #{codigoDisplay} - {doador.nome}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePrint}
              className="btn-action btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', height: 'auto', borderRadius: '8px', fontSize: '0.75rem' }}
            >
              <Printer size={16} />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              style={{ padding: '8px', color: 'var(--text-muted)', background: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="ficha-modal-body" style={{ padding: '32px', overflowY: 'auto', background: 'var(--bg-color)' }}>
          <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: 24, background: 'var(--card-bg)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  FICHA TÉCNICA DE DOADOR
                </h1>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Sistema de Gestão de Doadores e Arrecadação
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-color)', lineHeight: 1 }}>
                  #{codigoDisplay}
                </span>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Cadastrado em: {dataCadastro || '-'}</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={sectionTitle}>
                <User size={14} />
                Identificação Principal
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, fontSize: '0.8rem' }}>
                <div>
                  <span style={label}>Nome Completo:</span>
                  <span style={value}>{doador.nome || '-'}</span>
                </div>
                <div>
                  <span style={label}>Pessoa de Contato:</span>
                  <span style={value}>{doador.contato || '-'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={sectionTitle}>
                <Phone size={14} />
                Meios de Contato
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: '0.8rem' }}>
                <div>
                  <span style={label}>Celular:</span>
                  <span style={value}>{doador.celular || '-'}</span>
                </div>
                <div>
                  <span style={label}>Telefone Fixo:</span>
                  <span style={value}>{doador.fixo || '-'}</span>
                </div>
                <div>
                  <span style={label}>WhatsApp:</span>
                  <span style={value}>{doador.whatsapp || '-'}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={label}>E-mail:</span>
                  <span style={value}>{doador.email || '-'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={sectionTitle}>
                <MapPin size={14} />
                Endereço de Coleta &amp; Região
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: '0.8rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={label}>Endereço Completo:</span>
                  <span style={value}>
                    {doador.logradouro ? `${doador.logradouro} ` : ''}
                    {doador.endereco || '-'}
                    {doador.complemento ? `, ${doador.complemento}` : ''}
                  </span>
                </div>
                <div>
                  <span style={label}>CEP:</span>
                  <span style={value}>{doador.cep || '-'}</span>
                </div>
                <div>
                  <span style={label}>Bairro:</span>
                  <span style={value}>{doador.bairro || '-'}</span>
                </div>
                <div>
                  <span style={label}>Cidade / UF:</span>
                  <span style={value}>
                    {doador.cidade || '-'} / {doador.estado || '-'}
                  </span>
                </div>
                <div>
                  <span style={label}>Mapa / Quadrante:</span>
                  <span style={{ ...value, color: 'var(--primary-color)', fontWeight: 700 }}>{doador.mapa || '-'}</span>
                </div>
                <div>
                  <span style={label}>Região:</span>
                  <span style={{ ...value, color: 'var(--primary-color)', fontWeight: 700 }}>{regiao || '-'}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <h3 style={sectionTitle}>
                <Calendar size={14} />
                Dados Operacionais
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, fontSize: '0.8rem' }}>
                <div>
                  <span style={label}>Tipo Doador:</span>
                  <span style={value}>{tipoDoador || '-'}</span>
                </div>
                <div>
                  <span style={label}>Dia da Semana:</span>
                  <span style={value}>{doador.dia_semana || '-'}</span>
                </div>
                <div>
                  <span style={label}>Cód TLMK:</span>
                  <span style={value}>{doador.cod_tlmk || '-'}</span>
                </div>
                <div>
                  <span style={label}>Cód MATCOB:</span>
                  <span style={value}>{doador.cod_matcob || '-'}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', marginBottom: 8 }}>
                Histórico &amp; Observações
              </h3>
              <p style={{ margin: 0, padding: '12px', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-color)', fontStyle: 'italic' }}>
                {doador.historico || 'Nenhum histórico registrado para este doador.'}
              </p>
            </div>
          </div>
        </div>

        <div className="ficha-modal-footer" style={{
          background: 'var(--input-bg)',
          padding: '12px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} className="btn-action btn-secondary" style={{ padding: '8px 16px', height: 'auto', borderRadius: '8px', fontSize: '0.75rem' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const buildPrintHTML = (d) => {
  const codigo = d.codigo ?? d.codigo_doador ?? '';
  const tipoDoador = d.tipo ?? d.tipo_doador ?? 'Mensal';
  const dataCadastro = d.dataCadastro ?? d.data_cadastro ?? '';
  const codigoDisplay = String(codigo || 1).padStart(6, '0');

  const field = (label, value) => `
    <div>
      <span class="lbl">${label}</span>
      <span class="val">${value || '-'}</span>
    </div>
  `;

  const section = (title, body) => `
    <div class="sec">
      <h3>${title}</h3>
      <div class="grid">${body}</div>
    </div>
  `;

  const content = `
    <div class="brand">
      <div>
        <h1>FICHA TÉCNICA DE DOADOR</h1>
        <p>Sistema de Gestão de Doadores e Arrecadação</p>
      </div>
      <div class="code">
        <span>#${codigoDisplay}</span>
        <small>Cadastrado em: ${dataCadastro || '-'}</small>
      </div>
    </div>
    ${section('Identificação Principal', field('Nome Completo', d.nome) + field('Pessoa de Contato', d.contato))}
    ${section('Meios de Contato', field('Celular', d.celular) + field('Telefone Fixo', d.fixo) + field('WhatsApp', d.whatsapp) + `<div class="full">${field('E-mail', d.email)}</div>`)}
    ${section('Endereço de Coleta & Região', `<div class="span2">${field('Endereço Completo', (d.logradouro ? d.logradouro + ' ' : '') + (d.endereco || '') + (d.complemento ? ', ' + d.complemento : ''))}</div>` + field('CEP', d.cep) + field('Bairro', d.bairro) + field('Cidade / UF', (d.cidade || '-') + ' / ' + (d.estado || '-')) + field('Mapa / Quadrante', d.mapa) + field('Região', d.regiao))}
    ${section('Dados Operacionais', field('Tipo Doador', tipoDoador) + field('Dia da Semana', d.dia_semana) + field('Cód TLMK', d.cod_tlmk) + field('Cód MATCOB', d.cod_matcob))}
    <div class="sec">
      <h3>Histórico & Observações</h3>
      <p class="hist">${d.historico || 'Nenhum histórico registrado para este doador.'}</p>
    </div>
    <div class="footer">Documento gerado em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</div>
  `;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ficha do Doador</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; }
    .card { max-width: 740px; margin: 0 auto; padding: 20px; }
    .brand { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 14px; margin-bottom: 18px; }
    .brand h1 { margin: 0; font-size: 17px; text-transform: uppercase; }
    .brand p { margin: 2px 0 0; font-size: 10px; color: #64748b; }
    .code { text-align: right; }
    .code span { display: block; font-size: 24px; font-weight: 800; color: #2563eb; line-height: 1; }
    .code small { font-size: 10px; color: #64748b; }
    .sec { margin-bottom: 16px; }
    .sec h3 { margin: 0 0 8px; font-size: 11px; color: #2563eb; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 16px; font-size: 12px; }
    .span2 { grid-column: span 2; }
    .full { grid-column: 1 / -1; }
    .lbl { display: block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .val { font-weight: 600; }
    .hist { margin: 0; padding: 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; font-style: italic; }
    .footer { margin-top: 24px; border-top: 1px dashed #cbd5e1; padding-top: 8px; font-size: 11px; text-align: center; color: #64748b; }
  </style>
</head>
<body>
  <div class="card">
    ${content}
  </div>
</body>
</html>`;
};

export default FichaModal;
