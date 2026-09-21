import React, { useState, useRef } from 'react';
import { Search, Printer, X, FileText, Download, User } from 'lucide-react';
import { api } from '../api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import printService from '../services/printService';

const ReportDonorCodeForm = () => {
    const [searchValues, setSearchValues] = useState({ tlmk: '', matcob: '' });
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchType, setSearchType] = useState(null); // 'tlmk' or 'matcob'
    const reportRef = useRef();

    const handleSearch = async (type) => {
        const rawValue = type === 'tlmk' ? searchValues.tlmk : searchValues.matcob;
        if (!rawValue) return;

        const value = rawValue.trim();
        setLoading(true);
        try {
            const params = type === 'tlmk' ? { tlmk: value } : { matcob: value };
            const { data } = await api.doadores.list(params);

            if (data && data.length > 0) {
                setDonor(data[0]);
                setSearchType(type);
            } else {
                alert('Doador não encontrado com este código.');
                setDonor(null);
                setSearchType(null);
            }
        } catch (err) {
            console.error('Erro na busca:', err);
            alert('Erro ao realizar a busca. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = async () => {
        if (!donor) return;

        const input = reportRef.current;
        const canvas = await html2canvas(input, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Ficha_Doador_${donor.codigo_doador}.pdf`);
    };

    const handlePrintMatricial = async () => {
        if (!donor) return;
        
        // Formata os dados para a matricial (Texto Puro)
        const rawData = `
FICHA DE DOADOR - ${searchType === 'tlmk' ? 'TELEMARKETING' : 'MAT.COBRANCA'}
--------------------------------------------------
CODIGO: ${searchType === 'tlmk' ? donor.cod_tlmk : donor.cod_matcob}
COD.DOADOR: ${donor.codigo_doador}
NOME: ${donor.nome}
DATA CADASTRO: ${formatDate(donor.data_cadastro)}
TIPO: ${donor.tipo_doador}
EMAIL: ${donor.email || 'N/I'}
TEL: ${formatPhone(donor.fixo || donor.celular)}
ENDERECO: ${donor.logradouro || ''} ${donor.endereco || ''}
COMPLEMENTO: ${donor.complemento || ''}
BAIRRO: ${donor.bairro}
CIDADE: ${donor.cidade} - ${donor.estado}
CEP: ${formatCep(donor.cep)}
--------------------------------------------------
ASSOC. ESPIRITA DR. ADOLFO BEZERRA DE MENEZES
--------------------------------------------------
`;
        
        const result = await printService.printRawMatricial(rawData);
        if (result.success) {
            alert('Enviado para a Epson FX890 com sucesso!');
        } else {
            alert('Erro ao imprimir: ' + result.error + '. Verifique se o QZ Tray está aberto.');
        }
    };


    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split(/T| /)[0].split('-');
        return `${day}/${month}/${year}`;
    };

    const formatPhone = (v = '') => {
        if (!v) return '';
        const n = v.replace(/\D/g, '');
        if (n.length <= 10) return n.replace(/(\d{2})(\d)/, '($1)$2').replace(/(\d{4})(\d)/, '$1-$2');
        return n.replace(/(\d{2})(\d)/, '($1)$2').replace(/(\d{5})(\d)/, '$1-$2');
    };

    const formatCep = (v = '') => v ? v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2') : '';

    const getHeaderTitle = () => {
        if (!searchType) return 'Ficha de Doador Telemarketing ou Mat.Cobrança';
        return searchType === 'tlmk' ? 'Ficha de Doador Telemarketing' : 'Ficha de Doador Mat.Cobrança';
    };

    return (
        <div className="main-content-layout ficha-codigo-premium">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .sidebar, .header, .ficha-search-grid, .ficha-actions,
                    .no-print, .mobile-menu-btn, .theme-toggle, .ficha-icon-header {
                        display: none !important;
                    }
                    .main-wrapper { margin-left: 0 !important; padding: 0 !important; }
                    .ficha-codigo-premium { padding: 0 !important; margin: 0 !important; background: white !important; }
                    .ficha-card-premium { box-shadow: none !important; border: none !important; padding: 0 !important; margin: 0 !important; background: white !important; }
                    .ficha-sheet-wrapper { background: white !important; padding: 0 !important; border: none !important; overflow: visible !important; }
                    .ficha-sheet { box-shadow: none !important; border: 1px solid #ccc !important; padding: 15mm !important; margin: 0 auto !important; background: white !important; color: black !important; }
                    .ficha-sheet * { color: black !important; border-color: #ccc !important; }
                    .ficha-main-title { border-color: black !important; background: #eee !important; box-shadow: none !important; }
                    
                    @page { size: A4 portrait; margin: 0; }
                    * { visibility: visible !important; }
                }

                .ficha-codigo-premium {
                    flex-direction: column;
                    padding: 24px;
                }
                .ficha-card-premium {
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
                    background: linear-gradient(135deg, #8b5cf6, #5b21b6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
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

                .ficha-search-grid {
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
                .ficha-search-group {
                    flex: 1;
                    min-width: 250px;
                }
                .ficha-search-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-color);
                    margin-bottom: 8px;
                    opacity: 0.8;
                }
                .search-input-wrapper {
                    position: relative;
                    display: flex;
                }
                .search-input-wrapper .input-field {
                    flex: 1;
                    padding-right: 45px;
                }
                .btn-search-icon {
                    position: absolute;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 45px;
                    background: var(--primary-pastel-blue, #2563eb);
                    color: white;
                    border: none;
                    border-radius: 0 8px 8px 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-search-icon:hover {
                    background: #1d4ed8;
                }
                .search-divider {
                    font-weight: 700;
                    color: var(--text-color);
                    opacity: 0.4;
                    padding-bottom: 12px;
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

                /* Ficha specific */
                .ficha-sheet-wrapper {
                    background: var(--bg-color);
                    padding: 30px;
                    border-radius: 0;
                    display: flex;
                    justify-content: center;
                    overflow-x: auto;
                    border: 1px solid var(--border-color);
                }
                .ficha-sheet {
                    background: var(--card-bg);
                    width: 210mm;
                    min-height: 297mm;
                    padding: 15mm;
                    color: var(--text-color);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                    font-family: 'Segoe UI', Roboto, sans-serif;
                    border: 1px solid var(--border-color);
                }
                .institution-header {
                    text-align: center;
                    border-bottom: 1.5px solid var(--border-color);
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .institution-header h2 {
                    font-size: 1rem;
                    margin: 0 0 8px 0;
                    color: var(--primary-color, #2563eb);
                }
                .institution-header p {
                    font-size: 0.75rem;
                    margin: 1px 0;
                    color: var(--text-color);
                    opacity: 0.7;
                }
                .ficha-title-section {
                    text-align: center;
                    margin-bottom: 25px;
                }
                .ficha-main-title {
                    font-size: 1.25rem;
                    color: var(--text-color);
                    text-transform: uppercase;
                    border: 1.5px solid var(--primary-color, #2563eb);
                    padding: 8px 20px;
                    display: inline-block;
                    font-weight: 700;
                    background: var(--input-bg);
                    border-radius: 6px;
                }
                .ficha-content-grid {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 20px 15px;
                    margin-bottom: 30px;
                }
                .ficha-field-group {
                    border-bottom: 0.5px solid var(--border-color);
                    padding-bottom: 3px;
                }
                .col-span-1 { grid-column: span 1; }
                .col-span-2 { grid-column: span 2; }
                .col-span-3 { grid-column: span 3; }
                .col-span-4 { grid-column: span 4; }

                .ficha-field-group label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: var(--primary-color, #2563eb);
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .ficha-value {
                    font-size: 0.95rem;
                    font-weight: 500;
                    color: var(--text-color);
                    min-height: 1.2rem;
                    word-break: break-word;
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: var(--text-color);
                    opacity: 0.5;
                    text-align: center;
                    background: var(--input-bg);
                    border-radius: 0;
                    border: 1px dashed var(--border-color);
                }
                .empty-icon {
                    margin-bottom: 20px;
                    opacity: 0.3;
                }
            `}} />

            <div className="ficha-card-premium">
                <div className="rel-header-premium ficha-icon-header no-print">
                    <div className="icon-wrapper">
                        <User size={24} />
                    </div>
                    <div>
                        <h2>Ficha por Código</h2>
                        <p className="subtitle">Consulte e exporte a ficha completa do doador por código de telemarketing ou MatCob</p>
                    </div>
                </div>

                <div className="ficha-search-grid no-print">
                    <div className="ficha-search-group">
                        <label>Código de TLMK:</label>
                        <div className="search-input-wrapper">
                            <input 
                                type="text" 
                                className="input-field" 
                                value={searchValues.tlmk}
                                onChange={(e) => setSearchValues({ ...searchValues, tlmk: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch('tlmk')}
                                placeholder="Digite o código..."
                            />
                            <button className="btn-search-icon" onClick={() => handleSearch('tlmk')}>
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="search-divider">ou</div>

                    <div className="ficha-search-group">
                        <label>Código de Mat.Cob.:</label>
                        <div className="search-input-wrapper">
                            <input 
                                type="text" 
                                className="input-field" 
                                value={searchValues.matcob}
                                onChange={(e) => setSearchValues({ ...searchValues, matcob: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch('matcob')}
                                placeholder="Digite o código..."
                            />
                            <button className="btn-search-icon" onClick={() => handleSearch('matcob')}>
                                <Search size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="ficha-actions" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginLeft: 'auto' }}>
                        <button className="rel-btn rel-btn-secondary" onClick={() => { setDonor(null); setSearchType(null); setSearchValues({ tlmk: '', matcob: '' }); }}>
                            <X size={16} /> Limpar
                        </button>
                        {donor && (
                            <>
                                <button className="rel-btn rel-btn-secondary" onClick={handlePrintMatricial} style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
                                    <Printer size={16} /> IMPRIMIR MATRICIAL
                                </button>
                                <button className="rel-btn rel-btn-primary" onClick={handlePrint}>
                                    <Download size={16} /> IMPRIMIR NORMAL
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {donor ? (
                    <div className="ficha-sheet-wrapper">
                        <div className="ficha-sheet" ref={reportRef}>
                            <div className="institution-header">
                                <h2>ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES</h2>
                                <p>RUA DONA VICENTINA ALEGRETTI, 265 - PENHA - SÃO PAULO - SP</p>
                                <p>Cep 03610-030 - Telefone (11)2164-1800 - C.N.P.J. 60.478.245/0001-5</p>
                                <p>E-mail: doacoes@abrigobezerrademenezes.org.br - Site: www.abrigobezerrademenezes.org.br</p>
                            </div>

                            <div className="ficha-title-section">
                                <h3 className="ficha-main-title">{getHeaderTitle()}</h3>
                            </div>

                            <div className="ficha-content-grid">
                                {/* Row 1 */}
                                <div className="ficha-field-group">
                                    <label>Código</label>
                                    <div className="ficha-value">{searchType === 'tlmk' ? donor.cod_tlmk : donor.cod_matcob}</div>
                                </div>
                                <div className="ficha-field-group">
                                    <label>Cód.Doador</label>
                                    <div className="ficha-value">{donor.codigo_doador}</div>
                                </div>
                                <div className="ficha-field-group col-span-3">
                                    <label>Nome Completo</label>
                                    <div className="ficha-value">{donor.nome}</div>
                                </div>
                                <div className="ficha-field-group">
                                    <label>Data do Cadastro</label>
                                    <div className="ficha-value">{formatDate(donor.data_cadastro)}</div>
                                </div>

                                {/* Row 2 */}
                                <div className="ficha-field-group col-span-1">
                                    <label>Tipo de Doador</label>
                                    <div className="ficha-value">{donor.tipo_doador}</div>
                                </div>
                                <div className="ficha-field-group col-span-4">
                                    <label>Email</label>
                                    <div className="ficha-value">{donor.email || 'Não informado'}</div>
                                </div>
                                <div className="ficha-field-group col-span-1">
                                    <label>Telefone</label>
                                    <div className="ficha-value">{formatPhone(donor.fixo) || formatPhone(donor.celular) || 'Não informado'}</div>
                                </div>

                                {/* Row 3 */}
                                <div className="ficha-field-group col-span-1">
                                    <label>Whatsapp</label>
                                    <div className="ficha-value">{formatPhone(donor.whatsapp) || 'Não informado'}</div>
                                </div>
                                <div className="ficha-field-group col-span-1">
                                    <label>Cep</label>
                                    <div className="ficha-value">{formatCep(donor.cep)}</div>
                                </div>
                                <div className="ficha-field-group col-span-3">
                                    <label>Endereço</label>
                                    <div className="ficha-value">{(donor.logradouro || '') + ' ' + (donor.endereco || '')}</div>
                                </div>
                                <div className="ficha-field-group col-span-1">
                                    <label>Complemento</label>
                                    <div className="ficha-value">{donor.complemento || '—'}</div>
                                </div>

                                {/* Row 4 */}
                                <div className="ficha-field-group col-span-2">
                                    <label>Bairro</label>
                                    <div className="ficha-value">{donor.bairro}</div>
                                </div>
                                <div className="ficha-field-group col-span-2">
                                    <label>Cidade</label>
                                    <div className="ficha-value">{donor.cidade}</div>
                                </div>
                                <div className="ficha-field-group col-span-1">
                                    <label>Estado</label>
                                    <div className="ficha-value">{donor.estado}</div>
                                </div>
                                <div className="ficha-field-group col-span-1">
                                    <label>Região</label>
                                    <div className="ficha-value">{donor.regiao}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !loading && (
                    <div className="empty-state no-print">
                        <User size={48} className="empty-icon" />
                        <p>Digite um código de Telemarketing ou Matrícula de Cobrança para visualizar a ficha do doador.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDonorCodeForm;
