import React, { useState, useEffect } from 'react';
import { BarChart2, Users, Heart, Package, FileText, ClipboardCheck, Map, TrendingUp, HelpCircle, Phone, BookOpen, UserCog, LogOut, History, Mail, ChevronDown, X, RefreshCw, CheckSquare, ChevronLeft, Menu, Truck, Send, Beaker, Lock, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ currentView, setCurrentView, isAdmin, onSignOut, userEmail, collapsed, setCollapsed, onOpenCI }) => {
    const { isTransportes, isDiretoria, isDoacoes, isSuporte, canAccessAgradecimento, perfil } = useAuth();
    const [showReports, setShowReports] = useState(false);

    const reportViews = ['reports', 'agradecimento', 'agradecimento2', 'form_agradecimento', 'rel_diversas', 'historico', 'view_itens_categoria', 'rel_doacoes_dia', 'rel_retiradas_complemento', 'ficha_doador_codigo', 'relatorio_canceladas', 'relatorio_ci', 'ficha_doacao_toner', 'ficha_doacoes_nova', 'rel_ficha_doacoes', 'ficha_avaliacao'];

    // Fecha o submenu ao navegar para fora dos relatórios
    useEffect(() => {
        if (!reportViews.includes(currentView)) {
            setShowReports(false);
        }
    }, [currentView]);

    const toggleReports = () => {
        setShowReports(prev => !prev);
    };

    const isReportsActive = showReports;

    return (
        <>
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        {!collapsed && <img src="/logo-instituicao.png" alt="Logo" style={{ maxHeight: '40px', marginRight: '10px' }} onError={(e) => e.target.style.display = 'none'} />}
                        {!collapsed && <h3>Doações BM</h3>}
                        {collapsed && <Heart size={24} color="var(--primary-pastel-blue)" />}
                    </div>
                    <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expandir" : "Recolher"}>
                        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="user-info-brief" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="user-email">{userEmail}</span>
                        <span className="user-dept" style={{ fontSize: '0.7rem', opacity: 0.6, color: 'var(--primary-pastel-blue)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {perfil?.departamento || (isAdmin ? 'Administrador' : 'Usuário')}
                        </span>
                    </div>

{(isAdmin || isDoacoes || isSuporte || isDiretoria || isTransportes) && (
                        <button
                            className={`sidebar-link ${currentView === 'dashboard' ? 'active' : ''}`}
                            onClick={() => setCurrentView('dashboard')}
                        >
                            <BarChart2 size={18} />
                            <span>Painel Geral</span>
                        </button>
                    )}

                    {(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                        <>
                            <button
                                className={`sidebar-link ${currentView === 'donor_form' ? 'active' : ''}`}
                                onClick={() => setCurrentView('donor_form')}
                            >
                                <Users size={18} />
                                <span>Doadores</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'donation_form' ? 'active' : ''}`}
                                onClick={() => setCurrentView('donation_form')}
                            >
                                <Heart size={18} />
                                <span>Doações</span>
                            </button>
                        </>
                    )}

                    {(isAdmin || isDoacoes || isSuporte) && (
                        <>
                            <button
                                className={`sidebar-link ${currentView === 'inventory' ? 'active' : ''}`}
                                onClick={() => setCurrentView('inventory')}
                            >
                                <Package size={18} />
                                <span>Estoque</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'status' ? 'active' : ''}`}
                                onClick={() => setCurrentView('status')}
                            >
                                <ClipboardCheck size={18} />
                                <span>Status Individual</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'baixa_lote' ? 'active' : ''}`}
                                onClick={() => setCurrentView('baixa_lote')}
                            >
                                <CheckSquare size={18} />
                                <span>Baixa em Lote</span>
                            </button>
                        </>
                    )}

                    {(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                        <button
                            className={`sidebar-link ${currentView === 'movimentacoes' ? 'active' : ''}`}
                            onClick={() => setCurrentView('movimentacoes')}
                        >
                            <RefreshCw size={18} />
                            <span>Movimentações</span>
                        </button>
                    )}

                    {(isAdmin || isDoacoes || isSuporte) && (
                        <button
                            className={`sidebar-link ${currentView === 'consulta' ? 'active' : ''}`}
                            onClick={() => setCurrentView('consulta')}
                        >
                            <Search size={18} />
                            <span>Consulta</span>
                        </button>
                    )}

                    {(isAdmin || isDoacoes || isSuporte) && (
                        <button
                            className={`sidebar-link ${currentView === 'consulta_doador_nome' ? 'active' : ''}`}
                            onClick={() => setCurrentView('consulta_doador_nome')}
                        >
                            <Users size={18} />
                            <span>Consulta Doador Nome</span>
                        </button>
                    )}

                    {/* Grupo de RelatÃ³rios */}
{(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                        <div className={`sidebar-group ${isReportsActive ? 'expanded' : ''}`}>
                            <button
                                className={`sidebar-link ${reportViews.includes(currentView) ? 'active' : ''}`}
                                onClick={toggleReports}
                            >
                                <FileText size={18} />
                                <span>Relatórios</span>
                                <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.5, transform: isReportsActive ? 'rotate(180deg)' : 'none' }} />
                            </button>

                            {showReports && (
                            <div className="sidebar-submenu">
                                {(isAdmin || isDoacoes || isSuporte) && (
                                    <>
                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'reports' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('reports')}
                                        >
                                            <FileText size={14} />
                                            <span>Por Status (Pendências...)</span>
                                        </button>
                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'rel_diversas' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('rel_diversas')}
                                        >
                                            <FileText size={14} />
                                            <span>Doações Diversas</span>
                                        </button>
                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'rel_doacoes_dia' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('rel_doacoes_dia')}
                                        >
                                            <FileText size={14} />
                                            <span>Doações do Dia</span>
                                        </button>
                                    </>
                                )}
                                
                                {(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                                    <button
                                        className={`sidebar-link sub-link ${currentView === 'rel_retiradas_complemento' ? 'active' : ''}`}
                                        onClick={() => setCurrentView('rel_retiradas_complemento')}
                                    >
                                        <FileText size={14} />
                                        <span>Com Complemento</span>
                                    </button>
                                )}
                                
                                {(isAdmin || isDoacoes || isSuporte) && (
                                    <>
                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'ficha_doador_codigo' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('ficha_doador_codigo')}
                                        >
                                            <FileText size={14} />
                                            <span>Ficha por Código</span>
                                        </button>

                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'ficha_avaliacao' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('ficha_avaliacao')}
                                        >
                                            <FileText size={14} />
                                            <span>Avaliação</span>
                                        </button>

                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'relatorio_canceladas' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('relatorio_canceladas')}
                                        >
                                            <FileText size={14} />
                                            <span>Canceladas e Remarcadas</span>
                                        </button>
                                        <button
                                            className={`sidebar-link sub-link ${currentView === 'relatorio_ci' ? 'active' : ''}`}
                                            onClick={() => setCurrentView('relatorio_ci')}
                                        >
                                            <FileText size={14} />
                                            <span>Comunicação Interna</span>
                                        </button>
                                        <button
                                            className="sidebar-link sub-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onOpenCI?.();
                                            }}
                                        >
                                            <Send size={14} />
                                            <span>CI - Diretoria</span>
                                        </button>

                                    </>
                                )}

                                {(isAdmin || isDoacoes || isSuporte) && (
                                    <>
                                    <button
                                        className={`sidebar-link sub-link ${currentView === 'view_itens_categoria' ? 'active' : ''}`}
                                        onClick={() => setCurrentView('view_itens_categoria')}
                                    >
                                        <Package size={14} />
                                        <span>Itens por Categoria</span>
                                    </button>
                                    </>
                                )}

                                {canAccessAgradecimento && (
                                    <button
                                        className={`sidebar-link sub-link ${currentView === 'agradecimento' ? 'active' : ''}`}
                                        onClick={() => setCurrentView('agradecimento')}
                                    >
                                        <Mail size={14} />
                                        <span>Agradecimento</span>
                                    </button>
                                )}
                                {canAccessAgradecimento && (
                                    <button
                                        className={`sidebar-link sub-link ${currentView === 'form_agradecimento' ? 'active' : ''}`}
                                        onClick={() => setCurrentView('form_agradecimento')}
                                    >
                                        <Mail size={14} />
                                        <span>Agradecimento Escolha</span>
                                    </button>
                                )}
                            </div>
                            )}
                        </div>
                    )}

                    {(isAdmin || isDoacoes || isSuporte) && (
                        <button
                            className={`sidebar-link ${currentView === 'map' ? 'active' : ''}`}
                            onClick={() => setCurrentView('map')}
                        >
                            <Map size={18} />
                            <span>Mapa</span>
                        </button>
                    )}

                    {(isAdmin || isDoacoes || isSuporte || isDiretoria) && (
                        <>
                            <button
                                className={`sidebar-link ${currentView === 'projections' ? 'active' : ''}`}
                                onClick={() => setCurrentView('projections')}
                            >
                                <TrendingUp size={18} />
                                <span>Projeções</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'reports_regions' ? 'active' : ''}`}
                                onClick={() => setCurrentView('reports_regions')}
                            >
                                <BarChart2 size={18} />
                                <span>Comparativo Regiões</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'bar_chart_retiradas' ? 'active' : ''}`}
                                onClick={() => setCurrentView('bar_chart_retiradas')}
                            >
                                <BarChart2 size={18} />
                                <span>Gráficos Estatísticos</span>
                            </button>
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <div className="sidebar-divider"></div>
                            <button
                                className={`sidebar-link ${currentView === 'user_management' ? 'active' : ''}`}
                                onClick={() => setCurrentView('user_management')}
                            >
                                <UserCog size={18} />
                                <span>Usuários</span>
                            </button>
                            <button
                                className={`sidebar-link ${currentView === 'audit_logs' ? 'active' : ''}`}
                                onClick={() => setCurrentView('audit_logs')}
                            >
                                <History size={18} />
                                <span>Log do Sistema</span>
                            </button>
                        </>
                    )}

                    <div className="sidebar-divider"></div>

                    {(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                        <>
                            <button
                                className={`sidebar-link ${currentView === 'drivers' ? 'active' : ''}`}
                                onClick={() => setCurrentView('drivers')}
                            >
                                <Users size={18} />
                                <span>Motoristas</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'vehicles' ? 'active' : ''}`}
                                onClick={() => setCurrentView('vehicles')}
                            >
                                <Truck size={18} />
                                <span>Veículos</span>
                            </button>
                        </>
                    )}

{(isAdmin || isDoacoes || isSuporte || isTransportes) && (
                        <>
                            <button
                                className={`sidebar-link ${currentView === 'relacao_diversas' ? 'active' : ''}`}
                                onClick={() => setCurrentView('relacao_diversas')}
                            >
                                <BookOpen size={18} />
                                <span>Diversos</span>
                            </button>

                            <button
                                className={`sidebar-link ${currentView === 'ramais' ? 'active' : ''}`}
                                onClick={() => setCurrentView('ramais')}
                            >
                                <Phone size={18} />
                                <span>Ramais</span>
                            </button>
                        </>
                    )}

                    <button
                        className={`sidebar-link ${currentView === 'change_password' ? 'active' : ''}`}
                        onClick={() => setCurrentView('change_password')}
                    >
                        <Lock size={18} />
                        <span>Alterar Senha</span>
                    </button>

                    <button
                        className={`sidebar-link ${currentView === 'help' ? 'active' : ''}`}
                        onClick={() => setCurrentView('help')}
                    >
                        <HelpCircle size={18} />
                        <span>Ajuda</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link logout-btn" onClick={() => {
                        console.log('Botão Sair clicado');
                        onSignOut();
                    }}>
                        <LogOut size={16} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

