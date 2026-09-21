import React, { useState, useMemo } from 'react';
import { Search, Download, ArrowLeft, FileCheck, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';

const AgradecimentoSra = ({ onBack, data, onClose }) => {
    const [donorCode, setDonorCode] = useState(data?.codigoDoador || '');
    const [donationCode, setDonationCode] = useState(data?.codigoDoacao || '');
    const [donorData, setDonorData] = useState({
        codigo: '',
        nome: '',
        telefone: '',
        email: '',
        whatsapp: ''
    });

    const [description, setDescription] = useState(data?.descricaoLivre || '');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (data && (data.codigoDoador || data.codigoDoacao)) {
            handleSearchDonor();
        }
    }, []);

        const handleBack = () => {
        if (onClose) onClose();
        else if (onBack) onBack();
    };

    const handleSearchDonor = async () => {
        if (!donorCode && !donationCode) return;
        setLoading(true);
        try {
            if (donationCode) {
                const { data: donation, error: doErr } = await supabase
                    .from('doacoes')
                    .select('*, doadores(*), itens_doacao(*)')
                    .eq('codigo_doacao', donationCode.padStart(6, '0'))
                    .maybeSingle();

                if (doErr) throw doErr;
                if (donation) {
                    const donor = donation.doadores || {};
                    setDonorData({
                        codigo: donor.codigo_doador || '',
                        nome: donor.nome || '',
                        telefone: donor.celular || '',
                        email: donor.email || '',
                        whatsapp: donor.whatsapp || ''
                    });
                    const items = donation.itens_doacao || [];
                    if (items.length > 0) {
                        const descLines = items.map((item) => {
                            const q = item.qtde || '';
                            const u = item.unidade || '';
                            const i = item.item || item.descricao || item.nome || '';
                            return `- ${q} ${u} ${i}`.replace(/\s+/g, ' ').trim();
                        });
                        setDescription(descLines.join('\n'));
                    } else {
                        setDescription('');
                    }
                } else {
                    alert('Doação não encontrada.');
                }
            } else if (donorCode) {
                const { data: donor, error: dErr } = await supabase
                    .from('doadores')
                    .select('codigo_doador, nome, celular, email, whatsapp')
                    .eq('codigo_doador', donorCode.padStart(6, '0'))
                    .maybeSingle();

                if (dErr) throw dErr;
                if (donor) {
                    setDonorData({
                        codigo: donor.codigo_doador,
                        nome: donor.nome,
                        telefone: donor.celular || '',
                        email: donor.email || '',
                        whatsapp: donor.whatsapp || ''
                    });
                } else {
                    alert('Doador não encontrado.');
                }
            }
        } catch (err) {
            console.error(err);
            alert('Erro na busca.');
        } finally {
            setLoading(false);
        }
    };

    const today = new Date();
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const formattedDate = `${today.getDate()} de ${meses[today.getMonth()]} de ${today.getFullYear()}`;
    const dateStr = `São Paulo, ${formattedDate}.`;

    const printId = useMemo(() => `print-agrad-sra-${Math.random().toString(36).substr(2, 9)}`, []);

    const handlePrint = () => {
        if (!donorData.nome) {
            alert('Providencie os dados do doador primeiro.');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printContent = document.querySelector(`.${printId} .carta-sheet`).innerHTML;
        const styles = document.querySelector(`.${printId} style`).innerHTML;

        const doc = iframe.contentWindow.document;
        doc.write(`
            <html>
                <head>
                    <title>Impressão - Carta de Agradecimento</title>
                    <style>
                        ${styles}
                        @media print {
                            @page { size: A4 portrait; margin: 0; }
                            body { margin: 0; padding: 0; background: white; width: 100%; height: auto; }
                            .carta-sheet { width: 100% !important; display: block !important; padding: 10mm 15mm !important; max-width: none !important; box-shadow: none !important; border: none !important; box-sizing: border-box !important; }
                        }
                    </style>
                </head>
                <body>
                    <div class="carta-sheet">${printContent}</div>
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

    return (
        <div className={`main-content-layout carta-agrad-premium ${printId}`} style={{ flexDirection: 'column' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .carta-agrad-premium {
                    padding: 24px;
                }
                .carta-card-premium {
                    background: var(--card-bg);
                    border-radius: 16px;
                    padding: 30px;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-color);
                    width: 100%;
                    min-height: 400px;
                }
                .carta-header-premium {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 24px;
                }
                .carta-header-premium .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #f43f5e, #e11d48);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
                }
                .carta-header-premium h2 {
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: var(--text-color);
                    margin: 0;
                }
                .carta-header-premium .subtitle {
                    font-size: 0.8rem;
                    color: var(--text-muted, #94a3b8);
                    margin: 2px 0 0 0;
                }

                .carta-search-box {
                    background: var(--input-bg);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 24px;
                    border: 1px solid var(--border-color);
                    display: flex;
                    gap: 16px;
                    align-items: flex-end;
                    justify-content: center;
                    flex-wrap: wrap;
                }

                .carta-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    cursor: pointer;
                    border: none;
                }
                .carta-btn-primary { background: #2563eb; color: white; }
                .carta-btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
                .carta-btn-secondary { background: var(--bg-color); color: var(--text-color); border: 1px solid var(--border-color); }
                .carta-btn-secondary:hover { background: var(--border-color); }
                .carta-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

                .carta-preview-container {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                }

                .carta-sheet {
                    background: #ffffff;
                    color: #000000;
                    padding: 40px;
                    border-radius: 4px;
                    border: 1px solid #d1d5db;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
                    font-family: Arial, sans-serif;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    position: relative;
                    width: 100%;
                    max-width: 800px;
                    min-height: 800px;
                }

                .carta-section-title { font-weight: bold; font-size: 0.95rem; margin-bottom: 8px; }
                .carta-content { text-align: justify; margin-bottom: 30px; margin-top: 20px; }
                .carta-signature { text-align: center; margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; width: 60%; margin-left: auto; margin-right: auto; }
                .carta-table-mock { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .carta-table-mock th { border-bottom: 2px solid #000; padding: 6px; text-align: left; }
                .carta-table-mock td { border-bottom: 1px solid #ccc; padding: 6px; }

                /* ============================================================
                   CABEÇALHO DA FOLHA — bloco institucional + endereços
                   ============================================================ */

                .ch-top-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 6px;
                }
                .ch-logo {
                    width: 90px;
                    height: 90px;
                    object-fit: contain;
                    flex-shrink: 0;
                }
                .ch-inst-block {
                    flex: 1;
                    text-align: center;
                }
                .ch-inst-name {
                    font-size: 0.70rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #000;
                    margin: 0 0 2px 0;
                    line-height: 1.2;
                }
                .ch-inst-subtitle {
                    font-size: 0.95rem;
                    font-weight: bold;
                    color: #000;
                    margin: 0 0 4px 0;
                }
                .ch-inst-legal {
                    font-size: 0.60rem;
                    line-height: 1.35;
                    color: #000;
                    text-align: justify;
                    text-justify: inter-word;
                    margin: 0 0 3px 0;
                }
                .ch-inst-volunteer {
                    font-size: 0.62rem;
                    font-style: italic;
                    color: #000;
                    margin: 0;
                    text-align: center;
                }

                /* Bloco de endereços — justificado, bloco à direita */
                .ch-addresses {
                    font-size: 0.65rem;
                    color: #000;
                    line-height: 1.55;
                    text-align: justify;
                    text-justify: inter-word;
                    margin: 4px 0 0 auto;
                    width: fit-content;
                }
                .ch-addresses p {
                    margin: 0;
                    text-align: justify;
                    text-justify: inter-word;
                }
                /* Linha do site/email/facebook — itálico, justificado */
                .ch-site-line {
                    font-style: italic;
                    margin: 1px 0 0 0 !important;
                    text-align: justify;
                    text-justify: inter-word;
                }

                /* Linha separadora */
                .ch-divider {
                    border: none;
                    border-top: 1px solid #000;
                    margin: 6px 0 16px 0;
                }

                @media print {
                    .no-print { display: none !important; }
                }
            `}} />

            <div className="carta-card-premium no-print">
                <div className="carta-header-premium">
                    <div className="icon-wrapper">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h2>Carta de Agradecimento Sra</h2>
                        <p className="subtitle">Gerador automático de carta de agradecimento (versão 2) em PDF</p>
                    </div>
                </div>

                {!data && (<div className="carta-search-box">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '600px' }}>
                        <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)', opacity: 0.8, marginBottom: '6px', display: 'block' }}>Código do Doador:</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ paddingLeft: '36px' }}
                                        value={donorCode}
                                        onChange={(e) => setDonorCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchDonor()}
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)', opacity: 0.8, marginBottom: '6px', display: 'block' }}>Código da Doação:</label>
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{ paddingLeft: '36px' }}
                                        value={donationCode}
                                        onChange={(e) => setDonationCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchDonor()}
                                        placeholder="000000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-color)', opacity: 0.8, marginBottom: '6px', display: 'block' }}>Descrição da Doação (Texto Livre):</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '80px', paddingTop: '10px' }}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ex: 02 sacos de arroz, 01 caixa de leite..."
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                        <button className="carta-btn carta-btn-primary" onClick={handleSearchDonor} disabled={loading}>
                            {loading ? 'Buscando...' : 'Buscar'}
                        </button>
                        {onBack && (
                            <button className="carta-btn carta-btn-secondary" onClick={handleBack}>
                                <ArrowLeft size={18} /> Voltar
                            </button>
                        )}
                    </div>
                </div>
                )}

                {donorData.nome ? (
                    <>
                        <div className="carta-preview-container">
                            <div className="carta-sheet">

                                {/* ============================================================
                                    CABEÇALHO — fiel à imagem de referência
                                    Linha 1: logo (esq) + bloco institucional centralizado
                                    Linha 2: bloco de endereços JUSTIFICADO
                                    Linha 3: hr separador
                                    ============================================================ */}
                                <div style={{ marginBottom: '0' }}>

                                    {/* --- Linha superior: logo + nome/CNPJ/textos legais --- */}
                                    <div className="ch-top-row">
                                        <img
                                            src="/logo-instituicao.png"
                                            alt="Logo"
                                            className="ch-logo"
                                        />
                                        <div className="ch-inst-block">
                                            <p className="ch-inst-name">
                                                ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES
                                            </p>
                                            <p className="ch-inst-subtitle">
                                                ABRIGO DA VELHICE DESAMPARADA – CNPJ: 60.478.245/0001-50
                                            </p>
                                            <p className="ch-inst-legal">
                                                Reconhecida de utilidade pública federal pelo Decreto 92.343, de 28-01-1986; de utilidade pública estadual pela Lei
                                                Estadual 5.799 de 04-08-1960; de utilidade pública municipal pela Lei 10.802 de 21-12-1973 – São Paulo / SP e Lei
                                                1.317 de 13-03-1992 de Itaquaquecetuba / SP. - Inscrita na Secretaria de Assistência e Desenvolvimento Social do
                                                Estado de São Paulo sob nº 567/49. Registrada no Ministério do Desenvolvimento Social e Combate à Fome – MDS
                                                – Certificado de Entidade Beneficente de Assistência Social (CEBAS). Certificado de Matrícula Secretaria de
                                                Assistência Social do Município de São Paulo, nº 18.432. Certificado de Inscrição no Conselho Estadual de
                                                Assistência Social – CONSEAS – SP sob nº 0453/SP/2001 – Conselho no Municipal de Assistência Social sob nº
                                                046/2011. Certificada pela Corregedoria Geral da Administração – CRCE nº 0277/2014.
                                            </p>
                                            <p className="ch-inst-volunteer">
                                                (Os diretores, conselheiros e colaboradores voluntários desta Associação não recebem salários, ajudas de custo, vantagens ou privilégios materiais de qualquer natureza)
                                            </p>
                                        </div>
                                    </div>

                                    {/* --- Bloco de endereços --- */}
                                    <div className="ch-addresses">
                                        <p>MATRIZ: Rua Dona Vicentina Alegretti, 265 - CEP 03610-030 - Fone: (11) 2164-1800 - Penha - São Paulo - SP</p>
                                        <p>UNIDADE II: Rua Georgina Diniz Braghiroli, 128 - CEP 08031-560 - Fone: (11) 2035-3113 - V. N. Curuçá - S. M. Pta. - SP</p>
                                        <p>UNIDADE III: R. Frei Caneca, 280 - CEP 08579-640 - Fone: (11) 4648-2404 - Bairro Pequeno Coração - Itaquaquecetuba - SP</p>
                                        <p className="ch-site-line">
                                            <em>Site: <span style={{color: '#0066cc'}}>www.abrigobezerrademenezes.org.br</span> / E-mail: <span style={{color: '#0066cc'}}>abrigo@abrigobezerrademenezes.org.br</span> / Facebook.com/abrigobezerrademenezes</em>
                                        </p>
                                    </div>

                                </div>
                                
                                <div style={{ height: '22px' }}></div>

                                {/* ============================================================
                                    CORPO DA CARTA
                                    ============================================================ */}
                                <div className="carta-content" style={{ marginTop: '8px' }}>
                                    <p style={{ margin: '0 0 4px 0' }}>{dateStr}</p>
                                    <p style={{ margin: '16px 0 0 0' }}>À Sra.</p>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{donorData.nome.toUpperCase()}</p>
                                    <p style={{ margin: '0 0 24px 0' }}>&nbsp;</p>

                                    <p style={{ textAlign: 'justify', margin: '0 0 10px 0', textIndent: '30px' }}>
                                        A Associação Espírita Beneficente Dr. Adolfo Bezerra de Menezes é uma entidade filantrópica sem fins
                                        lucrativos, que acolhe, gratuitamente, aproximadamente 110 idosos de ambos os sexos. Assim, sua
                                        manutenção depende essencialmente do senso de solidariedade humana e caridade cristã de quem se
                                        propõe a nos ajudar.
                                    </p>
                                    <p style={{ textAlign: 'justify', margin: '0 0 10px 0', textIndent: '30px' }}>
                                        Entre os generosos corações dos que o fazem incluem-se a prezada Amiga, ao qual agradecemos pela
                                        doação que nos fez de <strong>{description ? description.toLowerCase() : '________________________________________________'}</strong>.
                                    </p>
                                    <p style={{ textAlign: 'justify', margin: '0 0 15px 0', textIndent: '30px' }}>
                                        Certo de que sempre poderemos contar com a sua efetiva colaboração, firmamo-nos, rogando a Deus o
                                        cubra de bênçãos e lhe propicie reiteradas oportunidades de progresso material e elevação espiritual.
                                    </p>

                                    <p style={{ textAlign: 'center', margin: '60px 0 0 0' }}>Fraternalmente,</p>

                                    <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <p style={{ fontWeight: 'bold', margin: '0' }}>Maria Ferreira Xavier</p>
                                        <p style={{ margin: '0' }}>Presidente</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                            <button className="carta-btn carta-btn-primary" onClick={handlePrint} style={{ padding: '12px 30px', margin: '0 auto', fontSize: '1rem', background: '#e11d48' }}>
                                Imprimir
                            </button>
                        </div>
                    </>
                ) : !loading && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, padding: '60px 20px', textAlign: 'center' }}>
                        <Mail size={64} style={{ marginBottom: '16px' }} />
                        <p style={{ fontSize: '1.1rem' }}>Digite o código do doador ou da doação e clique em Buscar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgradecimentoSra;




