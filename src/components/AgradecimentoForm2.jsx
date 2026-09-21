import React, { useState } from 'react';
import { Search, Download, ArrowLeft, FileCheck, Mail, X, Printer } from 'lucide-react';
import { supabase } from '../supabaseClient';
import jsPDF from 'jspdf';
import { getLogoDataUrl } from '../utils/logo';

const AgradecimentoForm2 = ({ onBack }) => {
    const [donorCode, setDonorCode] = useState('');
    const [donationCode, setDonationCode] = useState('');
    const [donorData, setDonorData] = useState({
        codigo: '',
        nome: '',
        telefone: '',
        email: '',
        whatsapp: ''
    });

    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSearchDonor = async () => {
        if (!donorCode && !donationCode) return;
        setLoading(true);
        try {
            if (donationCode) {
                const { data: donation, error: doErr } = await supabase
                    .from('doacoes')
                    .select('*, doadores(*)')
                    .eq('codigo_doacao', donationCode.padStart(6, '0'))
                    .maybeSingle();

                if (doErr) throw doErr;
                if (donation) {
                    const { data: itemData } = await supabase
                        .from('itens_doacao')
                        .select('*')
                        .eq('id_doacao', donation.codigo_doacao);
                    donation.itens_doacao = itemData || [];
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

    const handleGeneratePDF = async () => {
        if (!donorData.nome) {
            alert('Providencie os dados do doador primeiro.');
            return;
        }

        const logoData = await getLogoDataUrl();

        const doc = new jsPDF();

        // --- CABEÇALHO OFICIAL ---
        doc.addImage(logoData, 'PNG', 8, 10, 22, 22);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('ASSOCIAÇÃO ESPÍRITA BENEFICENTE DR. ADOLFO BEZERRA DE MENEZES', 122.5, 10, { align: 'center' });
        doc.setFontSize(10);
        doc.text('ABRIGO DA VELHICE DESAMPARADA – CNPJ: 60.478.245/0001-50', 122.5, 15, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        const headerInfo = "Reconhecida de utilidade pública federal pelo Decreto 92.343, de 28-01-1986; de utilidade pública estadual pela Lei Estadual 5.799 de 04-08-1960; de utilidade pública municipal pela Lei 10.802 de 21-12-1973 - São Paulo / SP e Lei 1.317 de 13-03-1992 de Itaquaquecetuba / SP. - Inscrita na Secretaria de Assistência e Desenvolvimento Social do Estado de São Paulo sob nº 567/49. Registrada no Ministério do Desenvolvimento Social e Combate à Fome - MDS - Certificado de Entidade Beneficente de Assistência Social (CEBAS). Certificado de Matrícula Secretaria de Assistência Social do Município de São Paulo, nº 18.432. Certificado de Inscrição no Conselho Estadual de Assistência Social - CONSEAS - SP sob nº 0453/SP/2001 - Conselho no Municipal de Assistência Social sob nº 046/2011. Certificada pela Corregedoria Geral da Administração - CRCE nº 0277/2014.";
        const splitHeader = doc.splitTextToSize(headerInfo, 145);
        doc.text(splitHeader, 50, 19, { maxWidth: 145, align: 'justify' });

        let currentY = 19 + (splitHeader.length * 3);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        const volunteerText = '(Os diretores, conselheiros e colaboradores voluntários desta Associação não recebem salários, ajudas de custo, vantagens ou privilégios materiais de qualquer natureza)';
        const splitVolunteer = doc.splitTextToSize(volunteerText, 145);
        doc.text(splitVolunteer, 122.5, currentY, { align: 'center' });

        currentY = Math.max(currentY + (splitVolunteer.length * 3) + 3, 39);

        // --- BLOCO DE ENDEREÇOS ---
        const addrWidth = 180;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);

        const addr1 = 'MATRIZ: Rua Dona Vicentina Alegretti, 265 - CEP 03610-030 - Fone: (11) 2164-1800 - Penha - São Paulo - SP';
        const splitAddr1 = doc.splitTextToSize(addr1, addrWidth);
        doc.text(splitAddr1, 15, currentY, { maxWidth: addrWidth, align: 'justify' });
        currentY += splitAddr1.length * 3.8;

        const addr2 = 'UNIDADE II: Rua Georgina Diniz Braghiroli, 128 - CEP 08031-560 - Fone: (11) 2035-3113 - V. N. Curuçá - S. M. Pta. - SP';
        const splitAddr2 = doc.splitTextToSize(addr2, addrWidth);
        doc.text(splitAddr2, 15, currentY, { maxWidth: addrWidth, align: 'justify' });
        currentY += splitAddr2.length * 3.8;

        const addr3 = 'UNIDADE III: R. Frei Caneca, 280 - CEP 08579-640 - Fone: (11) 4648-2404 - Bairro Pequeno Coração - Itaquaquecetuba - SP';
        const splitAddr3 = doc.splitTextToSize(addr3, addrWidth);
        doc.text(splitAddr3, 15, currentY, { maxWidth: addrWidth, align: 'justify' });
        currentY += splitAddr3.length * 3.8;

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        const siteParts = [
            { text: 'Site: ', color: [0, 0, 0] },
            { text: 'www.abrigobezerrademenezes.org.br', color: [0, 0, 255] },
            { text: ' / E-mail: ', color: [0, 0, 0] },
            { text: 'abrigo@abrigobezerrademenezes.org.br', color: [0, 0, 255] },
            { text: ' / Facebook.com/abrigobezerrademenezes', color: [0, 0, 0] },
        ];
        const siteFullText = siteParts.map(p => p.text).join('');
        const splitSite = doc.splitTextToSize(siteFullText, addrWidth);
        let xPos = 15;
        siteParts.forEach(({ text, color }) => {
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(text, xPos, currentY);
            xPos += doc.getTextWidth(text);
        });
        doc.setTextColor(0, 0, 0);
        currentY += splitSite.length * 3.8;

        // --- CORPO DA CARTA ---
        currentY += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        currentY += 6;
        doc.text(dateStr, 20, currentY);

        currentY += 12;
        doc.text('Ao', 20, currentY);
        currentY += 6;
        doc.setFont('helvetica', 'bold');
        doc.text(donorData.nome.toUpperCase(), 20, currentY);

        // Paragraphs with indentation — Carta_2 style
        currentY += 10;
        doc.setFont('helvetica', 'normal');
        const para1 = `Com nossos sinceros cumprimentos, agradecemos pela doação que nos fez de ${description ? description.toLowerCase().replace(/\s+/g, ' ').trim() : '________________________________________________'} como gesto de amor ao próximo.`;
        const splitPara1 = doc.splitTextToSize('     ' + para1, 165);
        doc.text(splitPara1, 20, currentY, { maxWidth: 165, align: 'justify' });

        currentY += (splitPara1.length * 5.5) + 4;
        const bodyFooter = "A solidariedade é o amor em movimento; que os prezados Amigos continuem a fazer parte de nossa história, e nos permitam fazer parte da sua.";
        const splitFooter = doc.splitTextToSize('     ' + bodyFooter, 165);
        doc.text(splitFooter, 20, currentY, { maxWidth: 165, align: 'justify' });

        currentY += (splitFooter.length * 5.5) + 4;

        doc.text('     Que Deus os cubra de bênçãos, de amor, saúde e paz!', 20, currentY);

        currentY += 40;
        doc.text('Fraternalmente,', 105, currentY, { align: 'center' });

        currentY += 25;
        doc.setFont('helvetica', 'normal');
        doc.text('Maria Ferreira Xavier', 105, currentY, { align: 'center' });
        currentY += 5;
        doc.text('Presidente', 105, currentY, { align: 'center' });

        doc.save(`${new Date().toISOString().split('T')[0]}_Carta_Agradecimento_2_${donorData.codigo}.pdf`);
        setShowConfirm(false);
    };


    return (
        <div className="main-content-layout carta-agrad-premium" style={{ flexDirection: 'column' }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .carta-agrad-premium {
                    padding: 24px;
                }
                .carta-card-premium {
                    background: var(--card-bg);
                    border-radius: 0;
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
                    border-radius: 0;
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
                .carta-donor-info { padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; margin-bottom: 20px; border-radius: 4px; }
                .carta-content { text-align: justify; margin-bottom: 30px; margin-top: 20px; }
                
                .carta-signature { text-align: center; margin-top: 40px; border-top: 1px solid #000; padding-top: 10px; width: 60%; margin-left: auto; margin-right: auto; }

                .carta-table-mock { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .carta-table-mock th { border-bottom: 2px solid #000; padding: 6px; text-align: left; }
                .carta-table-mock td { border-bottom: 1px solid #ccc; padding: 6px; }

                .ch-top-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 6px;
                }
                .ch-logo {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
                    flex-shrink: 0;
                }
                .ch-inst-block {
                    flex: 1;
                    text-align: center;
                }
                .ch-inst-name {
                    font-size: 1.05rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    color: #000;
                    margin: 0 0 2px 0;
                    line-height: 1.3;
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
                .ch-site-line {
                    font-style: italic;
                    margin: 1px 0 0 0 !important;
                    text-align: justify;
                    text-justify: inter-word;
                }

                .ch-divider {
                    border: none;
                    border-top: 1px solid #000;
                    margin: 6px 0 16px 0;
                }

                @media print {
                    .no-print { display: none !important; }
                }

                .confirm-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                }
                .confirm-box {
                    background: var(--card-bg);
                    border-radius: 16px;
                    padding: 30px;
                    max-width: 420px;
                    width: 90%;
                    box-shadow: var(--shadow-lg);
                    text-align: center;
                }
                .confirm-box h3 {
                    margin: 0 0 12px 0;
                    font-size: 1.2rem;
                }
                .confirm-box p {
                    margin: 0 0 20px 0;
                    color: var(--text-muted, #94a3b8);
                }
                .confirm-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
            `}} />

            <div className="carta-card-premium no-print">
                <div className="carta-header-premium">
                    <div className="icon-wrapper">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h2>Carta de Agradecimento 2</h2>
                        <p className="subtitle">Gerador automático de carta de agradecimento e anexo com detalhes da doação em PDF</p>
                    </div>
                </div>

                <div className="carta-search-box">
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
                            <button className="carta-btn carta-btn-secondary" onClick={onBack}>
                                <ArrowLeft size={18} /> Voltar
                            </button>
                        )}
                    </div>
                </div>

                {donorData.nome ? (
                    <>
                        <div className="carta-preview-container">
                            <div className="carta-sheet">

                                <div style={{ marginBottom: '0' }}>

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
                                    CORPO DA CARTA — Carta_2 style
                                    ============================================================ */}
                                <div className="carta-content" style={{ marginTop: '8px' }}>
                                    <p style={{ margin: '0 0 4px 0' }}>{dateStr}</p>
                                    <p style={{ margin: '16px 0 0 0' }}>Ao</p>
                                    <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>{donorData.nome.toUpperCase()}</p>

                                    <p style={{ textAlign: 'justify', margin: '0 0 10px 0', textIndent: '30px' }}>
                                        Com nossos sinceros cumprimentos, agradecemos pela doação que nos fez de {description ? description.toLowerCase() : '________________________________________________'} como gesto de amor ao próximo.
                                    </p>
                                    <p style={{ textAlign: 'justify', margin: '0 0 15px 0', textIndent: '30px' }}>
                                        A solidariedade é o amor em movimento; que os prezados Amigos continuem a fazer parte de nossa história,
                                        e nos permitam fazer parte da sua.
                                    </p>
                                    <p style={{ textAlign: 'justify', margin: '5px 0 20px 0', textIndent: '30px' }}>Que Deus os cubra de bênçãos, de amor, saúde e paz!</p>

                                    <p style={{ textAlign: 'center', margin: '60px 0 0 0' }}>Fraternalmente,</p>

                                    <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <p style={{ margin: '0' }}>Maria Ferreira Xavier</p>
                                        <p style={{ margin: '0' }}>Presidente</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                            <button className="carta-btn carta-btn-primary" onClick={() => setShowConfirm(true)} style={{ padding: '12px 30px', margin: '0 auto', fontSize: '1rem', background: '#e11d48' }}>
                                <Printer size={18} /> Imprimir
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

            {showConfirm && (
                <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="confirm-box" onClick={e => e.stopPropagation()}>
                        <h3>Confirmar Impressão</h3>
                        <p>Deseja gerar o PDF da Carta de Agradecimento 2 para <strong>{donorData.nome}</strong>?</p>
                        <div className="confirm-actions">
                            <button className="carta-btn carta-btn-secondary" onClick={() => setShowConfirm(false)}>
                                <X size={18} /> Cancelar
                            </button>
                            <button className="carta-btn carta-btn-primary" onClick={handleGeneratePDF} style={{ background: '#e11d48' }}>
                                <FileCheck size={18} /> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgradecimentoForm2;
