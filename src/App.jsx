import { useState, useEffect, useRef } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import DonorForm from './components/DonorForm';
import DonationForm from './components/DonationForm';
import AlterarDoacoesForm from './components/AlterarDoacoesForm';
import Dashboard from './components/Dashboard';
import InventoryForm from './components/InventoryForm';
import ThemeToggle from './components/ThemeToggle';
import ReportForm from './components/ReportForm';
import DonationStatusForm from './components/DonationStatusForm';
import DonationMap from './components/DonationMap';
import ProjectionsForm from './components/ProjectionsForm';
import HelpManual from './components/HelpManual';
import RelacaoDiversas from './components/RelacaoDiversas';
import ControleRamais from './components/ControleRamais';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import SplashScreen from './components/SplashScreen';
import AuditLogs from './components/AuditLogs';
import AgradecimentoForm from './components/AgradecimentoForm';
import AgradecimentoForm2 from './components/AgradecimentoForm2';
import FormularioAgradecimento from './components/FormularioAgradecimento';
import RelFichaDoacoesForm from './components/RelFichaDoacoesForm';
import RelDoacoesDiversas from './components/RelDoacoesDiversas';
import HistoricoDoacoes from './components/HistoricoDoacoes';
import RelItensCategoria from './components/RelItensCategoria';
import InventoryMovement from './components/InventoryMovement';
import ComparativoRegioes from './components/ComparativoRegioes';
import RelacaoDoacoesDia from './components/RelacaoDoacoesDia';
import RelacaoRetiradasComplemento from './components/RelacaoRetiradasComplemento';
import BaixaLoteForm from './components/BaixaLoteForm';
import DriversForm from './components/DriversForm';
import VehiclesForm from './components/VehiclesForm';
import ReportDonorCodeForm from './components/ReportDonorCodeForm';
import DonationsBarChart from './components/DonationsBarChart';
import RelatorioCanceladas from './components/RelatorioCanceladas.jsx';
import RelatorioComunicacaoInterna from './components/RelatorioComunicacaoInterna';
import ConsultaDoacoes from './components/ConsultaDoacoes';
import ConsultaDoadorNome from './components/ConsultaDoadorNome';
import ComunicacaoInternaModal from './components/ComunicacaoInternaModal';
import Notepad from './components/Notepad';
import ReportDonationTonerForm from './components/ReportDonationTonerForm';
import ReportFichaDoacoesNovaForm from './components/ReportFichaDoacoesNovaForm.jsx';
import ReportFichaAvaliacaoForm from './components/ReportFichaAvaliacaoForm.jsx';
import QuickPrintModal from './components/QuickPrintModal';
import ChangePassword from './components/ChangePassword';
import { useAuth } from './contexts/AuthContext';
import { ArrowLeft, StickyNote, Users, Calendar, Tags, Clock, RefreshCw } from 'lucide-react';
import { formatDateTime } from './utils/date';

function App() {
  const { user, loading, isAdmin, perfil, signOut, canAccessAgradecimento } = useAuth();
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light-silver') return 'navy-blue';
    return saved || 'light';
  });
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');
  const [showNotepad, setShowNotepad] = useState(localStorage.getItem('showNotepad') === 'true');
  const homeAnchor = 'dashboard';
  const [donationFormKey, setDonationFormKey] = useState(0);
  const [showCIModal, setShowCIModal] = useState(false);
  const [projectionsMode, setProjectionsMode] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(false);
  const [perfilLoading, setPerfilLoading] = useState(true);
  const splashShownOnce = useRef(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualiza o relógio a cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Exibe a splash apenas na PRIMEIRA autenticação da sessão (não em token refresh).
  useEffect(() => {
    if (user && !splashShownOnce.current) {
      setShowSplash(true);
      splashShownOnce.current = true;
    } else if (!user) {
      setShowSplash(false);
      splashShownOnce.current = false;
    }
  }, [user]);

  // Acompanha se o perfil já foi carregado (ou falhou)
  useEffect(() => {
    if (!loading) {
      // Dá um tempo para o perfil chegar (pode vir depois do loading=false)
      const timer = setTimeout(() => setPerfilLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Efeito para fechar o sidebar quando a view muda (mobile)
  useEffect(() => {
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      document.querySelector('.sidebar').classList.remove('open');
    }
  }, [currentView]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div >
        <p>Carregando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigateToProjections={(mode) => {
          setProjectionsMode(mode || 'dashboard');
          setCurrentView('projections');
        }} />;

      case 'inventory':
        return <InventoryForm />;
      case 'reports':
        return <ReportForm />;
      case 'status':
        return <DonationStatusForm />;
      case 'map':
        return <DonationMap />;
      case 'projections':
        return <ProjectionsForm initialViewMode={projectionsMode} />;
      case 'bar_chart_retiradas':
        return <DonationsBarChart />;
      case 'help':
        return <HelpManual />;
      case 'relacao_diversas':
        return <RelacaoDiversas />;
      case 'ramais':
        return <ControleRamais />;
      case 'user_management':
        return isAdmin ? <UserManagement /> : <Dashboard />;
      case 'audit_logs':
        return isAdmin ? <AuditLogs /> : <Dashboard />;
      case 'agradecimento':
        return canAccessAgradecimento ? <AgradecimentoForm /> : <Dashboard />;
      case 'agradecimento2':
        return canAccessAgradecimento ? <AgradecimentoForm2 /> : <Dashboard />;
      case 'form_agradecimento':
        return canAccessAgradecimento ? <FormularioAgradecimento /> : <Dashboard />;
      case 'rel_diversas':
        return <RelDoacoesDiversas />;
      case 'historico':
        return <HistoricoDoacoes />;
      case 'reports_regions':
        return <ComparativoRegioes />;
      case 'view_itens_categoria':
        return <RelItensCategoria />;
      case 'movimentacoes':
        return <InventoryMovement />;
      case 'rel_doacoes_dia':
        return <RelacaoDoacoesDia />;
      case 'rel_retiradas_complemento':
        return <RelacaoRetiradasComplemento />;
      case 'baixa_lote':
        return <BaixaLoteForm />;
      case 'drivers':
        return <DriversForm />;
      case 'vehicles':
        return <VehiclesForm />;
      case 'ficha_doador_codigo':
        return <ReportDonorCodeForm />;
      case 'relatorio_canceladas':
        return <RelatorioCanceladas />;
      case 'relatorio_ci':
        return <RelatorioComunicacaoInterna />;
      case 'consulta':
        return <ConsultaDoacoes />;
      case 'consulta_doador_nome':
        return <ConsultaDoadorNome />;
      case 'ficha_doacao_toner':
        return <ReportDonationTonerForm />;
      case 'ficha_doacoes_nova':
        return <ReportFichaDoacoesNovaForm />;
      case 'rel_ficha_doacoes':
        return <RelFichaDoacoesForm />;
      case 'ficha_avaliacao':
        return <ReportFichaAvaliacaoForm />;
      case 'change_password':
        return <ChangePassword />;

      default:
        return <Dashboard />;
    }
  };

  const showSidebar = currentView === 'dashboard';

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Painel Geral de Doações';
      case 'donor_form': return 'Cadastro de Doador';
      case 'donation_form': return 'Cadastro de Doações';
      case 'alterar_doacoes': return 'Alterar Doções do Doador';
      case 'inventory': return 'Controle de Inventário';
      case 'reports': return 'Relatórios de Doações';
      case 'status': return 'Status Individual';
      case 'map': return 'Mapa de Doações';
      case 'projections': return 'Projeções e Estatísticas';
      case 'bar_chart_retiradas': return 'Gráficos Estatísticos';
      case 'help': return 'Manual de Ajuda';
      case 'relacao_diversas': return 'Relação Doações Diversas';
      case 'ramais': return 'Controle de Ramais';
      case 'user_management': return 'Gestão de Usuários';
      case 'audit_logs': return 'Logs de Auditoria';
      case 'agradecimento': return 'Carta de Agradecimento';
      case 'agradecimento2': return 'Carta de Agradecimento 2';
      case 'form_agradecimento': return 'Carta de Agradecimento (Escolha)';
      case 'rel_diversas': return 'Relações Diversas';
      case 'historico': return 'Histórico Individual do Doador';
      case 'reports_regions': return 'Comparativo de Doações por Região';
      case 'view_itens_categoria': return 'Itens por Categoria';
      case 'movimentacoes': return 'Movimentação de Estoque';
      case 'rel_doacoes_dia': return 'Relação Doações do Dia';
      case 'rel_retiradas_complemento': return 'Retiradas Com Complemento';
      case 'baixa_lote': return 'Baixa em Lote';
      case 'drivers': return 'Controle de Motoristas';
      case 'vehicles': return 'Controle de Veículos';
      case 'ficha_doador_codigo': return 'Ficha do Doador por Código';
      case 'relatorio_canceladas': return 'Canceladas e Remarcadas';
      case 'ficha_doacao_toner': return 'Ficha de Doação Toner';
      case 'ficha_doacoes_nova': return 'Ficha de Doações Nova';
      case 'rel_ficha_doacoes': return 'Ficha de Doações';
      case 'ficha_avaliacao': return 'Ficha de Avaliação';
      case 'consulta': return 'Consulta de Doações';
      case 'consulta_doador_nome': return 'Consulta Doador Nome';
      case 'change_password': return 'Alterar Senha';
      default: return 'Doações BM';
    }
  };

  return (
    <div className="app-wrapper">
      {showSidebar && (
        <Sidebar
          currentView={currentView}
          setCurrentView={(view) => {
            if (view === 'donation_form' || view === 'alterar_doacoes') {
              setSelectedDonor(null);
              setDonationFormKey(prev => prev + 1);
            }
            // Sempre reseta o modo de projeção ao navegar via sidebar,
            // garantindo que o modo 'table' só seja ativado pelo botão do Dashboard
            setProjectionsMode('dashboard');
            setCurrentView(view);
          }}
          isAdmin={isAdmin}
          onSignOut={signOut}
          userEmail={user?.email}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onOpenCI={() => setShowCIModal(true)}
        />
      )}

      <div className="main-wrapper">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {showSidebar && (
              <button
                className="mobile-menu-btn"
                onClick={() => {
                  document.querySelector('.sidebar').classList.add('open');
                  document.querySelector('.sidebar-overlay').classList.add('active');
                }}
              >
                <div className="menu-bar"></div >
                <div className="menu-bar"></div >
                <div className="menu-bar"></div >
              </button>
            )}
            {!showSidebar && (
                  <button
                      type="button"
                      className="btn-action btn-secondary"
                      onClick={() => setCurrentView('dashboard')}
                      style={{ padding: '6px 12px' }}
                  >
                      <ArrowLeft size={16} /> Voltar
                  </button>
                )}
            {currentView === 'consulta_doador_nome' && (
              <div style={{ padding: '8px', background: 'var(--primary-pastel-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <Users size={20} />
              </div >
            )}
            {currentView === 'donor_form' && (
              <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div >
            )}
            {currentView === 'donation_form' && (
              <div style={{ padding: '8px', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div >
            )}
            {currentView === 'inventory' && (
              <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tags size={20} />
              </div >
            )}
            {currentView === 'status' && (
              <div style={{ padding: '8px', background: 'var(--warning-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div >
            )}
            {currentView === 'user_management' && (
              <div style={{ padding: '8px', background: 'var(--primary-pastel-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <Users size={20} />
              </div >
            )}
            {currentView === 'movimentacoes' && (
              <div style={{ padding: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={20} />
              </div >
            )}
            <h1>{getTitle()}</h1>
          </div >
          <div className="header-clock" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '1.4rem', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.5px', zIndex: 1 }}>
              {formatDateTime(currentTime)}
          </div>
          <div className="header-actions">
            <div className="user-profile">
              <div className="user-avatar">{user?.email?.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <span className="user-name">{user?.email?.split('@')[0]}</span>
                <span className="user-role">{perfil?.departamento || (isAdmin ? 'Administrador' : 'Usuário')}</span>
              </div >
            </div >
            <button
              className="btn-note-toggle"
              onClick={() => {
                const newState = !showNotepad;
                setShowNotepad(newState);
                localStorage.setItem('showNotepad', newState);
              }}
              style={{
                background: showNotepad ? 'var(--primary-pastel-blue)' : 'transparent',
                border: '1px solid var(--border-color)',
                color: showNotepad ? 'white' : 'var(--text-color)',
                padding: '8px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Bloco de Notas"
            >
              <StickyNote size={20} />
            </button>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            {/* botão de teste removido */}
          </div >
        </header>

        <main className="main-content">
          {/* Telas Persistentes (Mantêm o estado ao alternar) */}
          <div style={{ display: currentView === 'donor_form' ? 'block' : 'none' }}>
            <DonorForm
              onNavigateToDoacoes={(donor) => {
                setSelectedDonor(donor);
                setCurrentView('donation_form');
              }}
              onNavigateToAlterarDoacoes={(donor) => {
                setSelectedDonor(donor);
                setCurrentView('alterar_doacoes');
              }}
              onSave={() => setCurrentView(homeAnchor)}
            />
          </div >

          <div style={{ display: currentView === 'donation_form' ? 'block' : 'none' }}>
            <DonationForm
              key={`donation-form-${donationFormKey}`}
              initialDonor={selectedDonor}
              onBack={() => {
                setSelectedDonor(null);
                setCurrentView('donor_form');
              }}
              onSave={() => setCurrentView(homeAnchor)}
            />
          </div >

          <div style={{ display: currentView === 'alterar_doacoes' ? 'block' : 'none' }}>
            <AlterarDoacoesForm
              key={`alterar-${selectedDonor?.codigo || selectedDonor?.codigo_doador || 'none'}`}
              initialDonor={selectedDonor}
              onBack={() => {
                setSelectedDonor(null);
                setCurrentView('donor_form');
              }}
              onSave={() => setCurrentView(homeAnchor)}
            />
          </div >

          {/* Demais telas (Renderização condicional padrão) */}
          {!(currentView === 'donor_form' || currentView === 'donation_form' || currentView === 'alterar_doacoes') && renderView()}
        </main>
      </div >

      {showNotepad && (
        <Notepad usuarioEmail={user?.email} onClose={() => {
          setShowNotepad(false);
          localStorage.setItem('showNotepad', 'false');
        }} />
      )}

      {/* TestForm removido do sistema */}

      <div
        className="sidebar-overlay"
        onClick={() => {
          document.querySelector('.sidebar').classList.remove('open');
          document.querySelector('.sidebar-overlay').classList.remove('active');
        }}
      ></div >

      {showCIModal && (
        <ComunicacaoInternaModal onClose={() => setShowCIModal(false)} />
      )}

      {showSplash && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <SplashScreen onEnter={() => {
            if (!perfilLoading) {
              setShowSplash(false);
            }
          }} />
        </div >
      )}
    </div >
  );
}

export default App;

