import React, { useState } from 'react';
import {
    Users, Heart, FileText,
    Map, BookOpen, Truck, Printer, Info, List, Layout,
    CheckCircle, HelpCircle, BarChart2, ShieldCheck, 
    TrendingUp, Package, Move, Layers, UserPlus, Phone, Lightbulb, ChevronRight, Menu, X
} from 'lucide-react';

const HelpManual = () => {
    const [activeSection, setActiveSection] = useState('Sobre o Sistema');

    const sections = [
{ id: 'Sobre o Sistema', icon: <BookOpen size={18} />, title: 'Sobre o Sistema' },
        { id: 'LOGIN', icon: <ShieldCheck size={18} />, title: 'LOGIN' },
        { id: 'Menu Principal', icon: <Menu size={18} />, title: 'Menu Principal' },

        { id: 'Painel Geral', icon: <Layout size={18} />, title: 'Painel Geral' },
        { id: 'Cadastro de Doadores', icon: <Users size={18} />, title: 'Cadastro de Doadores' },
        { id: 'Cadastro de Doações', icon: <Heart size={18} />, title: 'Cadastro de Doações' },
        { id: 'Estoque', icon: <Package size={18} />, title: 'Estoque', subItems: ['Categorias e Itens', 'Movimentações'] },
        { id: 'Status das Doações', icon: <CheckCircle size={18} />, title: 'Status das Doações' },
        { id: 'Baixa em Lote', icon: <Layers size={18} />, title: 'Baixa em Lote' },
        { id: 'Relatórios', icon: <FileText size={18} />, title: 'Relatórios', 
          subItems: ['Por Status', 'Doações Diversas', 'Doações do Dia', 'Com complemento', 'Histórico do Doador', 'Ficha por Código', 'Itens por Categoria', 'Carta de Agradecimento'] 
        },
        { id: 'Mapa', icon: <Map size={18} />, title: 'Mapa' },
        { id: 'Projeções', icon: <TrendingUp size={18} />, title: 'Projeções' },
        { id: 'Gráficos Estatísticos', icon: <BarChart2 size={18} />, title: 'Gráficos Estatísticos' },
        { id: 'Usuários', icon: <ShieldCheck size={18} />, title: 'Usuários' },
        { id: 'Motoristas', icon: <Truck size={18} />, title: 'Motoristas' },
        { id: 'Veículos', icon: <Truck size={18} />, title: 'Veículos' },
        { id: 'Diversos', icon: <UserPlus size={18} />, title: 'Diversos' },
        { id: 'Ramais', icon: <Phone size={18} />, title: 'Ramais' },
        { id: 'Dicas e atalhos', icon: <Lightbulb size={18} />, title: 'Dicas e atalhos' },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'LOGIN':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">LOGIN</h2>
                        <div className="premium-divider" />
                        <p className="description-text">
                            A tela de Login é a primeira tela do sistema. Para acessar é necessário ter um usuário cadastrado por um Administrador.
                        </p>
                        <div className="feature-box">
                            <h4>CAMPOS:</h4>
                            <ul className="description-text" style={{listStyle: 'disc inside'}}>
                                <li><strong>• E-mail:</strong> Digite o seu endereço de e-mail cadastrado no sistema.</li>
                                <li><strong>• Senha:</strong> Digite a sua senha. Clique no ícone de olho para mostrar ou ocultar a senha.</li>
                            </ul>
                        </div>
                        <div className="feature-box">
                            <h4>BOTÃO ENTRAR:</h4>
                            <p className="description-text">Clique para confirmar o login. Se o e-mail ou senha estiverem incorretos, o sistema exibirá uma mensagem de erro.</p>
                        </div>
                        <div className="info-card-premium">
                            <HelpCircle className="icon-blue" />
                            <div>
                                <strong>DICAS:</strong>
                                <ul style={{margin: '10px 0 0 0', listStyle: 'disc inside'}}>
                                    <li>Mantenha sua senha em local seguro.</li>
                                    <li>Em caso de esquecimento de senha, solicite ao Administrador que redefina sua senha pelo módulo de Usuários.</li>
                                    <li>Somente usuários cadastrados pelo Administrador podem acessar o sistema.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'Sobre o Sistema':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">SOBRE O SISTEMA</h2>
                        <div className="premium-divider" />
                        <p className="description-text">
                            O Sistema Doações foi projetado para centralizar e otimizar todo o fluxo de gestão de donativos, desde o cadastro inicial do doador até a logística de coleta e relatórios gerenciais.
                        </p>
                        <ul className="help-feature-list">
                            <li><strong>Cadastrar e gerenciar doadores com todos os seus dados de contato e endereço.</strong></li>
                            <li><strong>Registrar doações com os itens doados, datas de retirada e responsáveis.</strong></li>
                            <li><strong>Controlar o status de cada doação (Pendente, Retirada, Baixada, Remarcada ou Cancelada).</strong></li>
                            <li><strong>Gerenciar motoristas e veículos utilizados nas retiradas.</strong></li>
                            <li><strong>Cadastrar categorias e itens para padronizar o inventário de doações.</strong></li>
                            <li><strong>Gerar relatórios detalhados por período.</strong></li>
                            <li><strong>Visualizar um Mapa de Doações por semana para facilitar o planejamento.</strong></li>
                        </ul>
                        
                        <h3 className="sub-section-title">COMO NAVEGAR NESTE MANUAL</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <p className="description-text">
                            Use o painel à esquerda para selecionar o módulo desejado. Clique em qualquer item do índice para ver as instruções detalhadas.
                        </p>
                    </div>
                );

            case 'Menu Principal':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">MENU PRINCIPAL</h2>
                        <div className="premium-divider" />
                        <p className="description-text">
                            Após o login, o Menu Principal é exibido com todos os módulos disponíveis.
                        </p>
                        
                        <div className="feature-box">
                            <h4>BOTÕES DISPONÍVEIS:</h4>
                            <ul className="description-text" style={{listStyle: 'disc inside'}}>
                                <li><strong>Painel Geral</strong></li>
                                <li><strong>Cadastro de Doadores</strong> → Gerencia os doadores cadastrados.</li>
                                <li><strong>Cadastro de Doações</strong> → Registra e gerencia as doações recebidas.</li>
                                <li><strong>Estoque</strong> → Categorias e Itens</li>
                                <li><strong>Estoque</strong> → Movimentação do Estoque</li>
                                <li><strong>Baixa em Lote</strong> → Dar Baixa em várias Doações ao mesmo tempo.</li>
                                <li><strong>Relatórios</strong> → Diversos.</li>
                                <li><strong>Mapa</strong> → Mapa Interativo. Visualize em uma planilha de dias úteis todas as coletas programadas por região.</li>
                                <li><strong>Projeções</strong> →</li>
                                <li><strong>Gráficos Estatísticos</strong> →</li>
                                <li><strong>Usuários</strong> → Cadastramento dos Usuários do Sistema.</li>
                                <li><strong>Motoristas</strong> → Cadastra e gerencia os motoristas.</li>
                                <li><strong>Veículos</strong> → Cadastra e gerencia os veículos.</li>
                                <li><strong>Diversos</strong> → Gestão mestre de funcionários, voluntários e colaboradores externos.</li>
                                <li><strong>Ramais</strong> → Esta lista contém os ramais oficiais do Abrigo Bezerra de Menezes. Para chamadas externas, utilize o prefixo (11) 2164-1800 seguido do ramal.</li>
                            </ul>
                        </div>

                        <h3 className="sub-section-title">TEMAS</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <p className="description-text">
                            Na barra superior há três botões de tema:<br/>
                            <strong>• ☀ Claro</strong> → Interface com fundo branco.<br/>
                            <strong>• 🌙 Escuro</strong> → Interface com fundo escuro.<br/>
                            <strong>• 💻 Sistema</strong> → Segue a configuração do Windows.
                        </p>
                        <p className="description-text">
                            <strong>NAVEGAÇÃO:</strong> Ao clicar em qualquer botão, o Menu Principal é minimizado automaticamente. Para voltar ao Menu Principal, clique no botão "← Menu" em qualquer formulário.<br/>
                            <strong>SAIR:</strong> Clique no botão "Sair" no canto superior direito para encerrar a sessão.
                        </p>
                    </div>
                );

            case 'Painel Geral':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">PAINEL GERAL</h2>
                        <div className="premium-divider" />
                        <p className="description-text">
                            O Painel Geral (Dashboard) oferece uma visão panorâmica e em tempo real das operações do sistema. 
                            Nele, você encontra indicadores cruciais como o volume de doações pendentes, total de coletas realizadas no mês, 
                            e um resumo do status atual do estoque.
                        </p>
                        <div className="info-card-premium" style={{borderLeft: '4px solid var(--success-color)'}}>
                            <TrendingUp className="text-green" />
                            <div>
                                <strong>Foco Gerencial:</strong> É o ponto de partida ideal para coordenadores que precisam de uma atualização rápida sobre o andamento das metas sem gerar relatórios individuais.
                            </div>
                        </div>
                    </div>
                );

            case 'Cadastro de Doadores':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">CADASTRO DE DOADORES</h2>
                        <div className="premium-divider" />
                        
                        <p className="description-text">
                            Este módulo permite cadastrar, consultar e alterar doadores.
                        </p>

                        <div className="feature-box">
                            <h4>PESQUISA:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0}}>
                                <li><strong>• CEP:</strong> Digite o CEP do doador e clique em "Buscar" para localizar registros.</li>
                                <li><strong>• Nome:</strong> Digite parte do nome e clique em "Buscar" para localizar registros.</li>
                            </ul>
                        </div>

                        <h3 className="sub-section-title">CAMPOS — DADOS DO DOADOR:</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <li><strong>• Código:</strong> Gerado automaticamente pelo sistema. Não é editável.</li>
                            <li><strong>• Nome:</strong> Nome completo do doador. Campo obrigatório.</li>
                            <li><strong>• Contato:</strong> Nome da pessoa de contato (caso seja pessoa jurídica ou terceiro).</li>
                            <li><strong>• E-mail:</strong> Endereço de e-mail do doador.</li>
                            <li><strong>• WhatsApp:</strong> Número de WhatsApp com DDD. Ex: (11) 99999-9999.</li>
                            <li><strong>• Celular:</strong> Número de celular com DDD.</li>
                            <li><strong>• Fixo:</strong> Número de telefone fixo com DDD.</li>
                            <li><strong>• Tipo Doador:</strong> Classifica o doador (Pessoa Física, Jurídica, etc.).</li>
                            <li><strong>• Dia Semana:</strong> Dia preferencial de retirada.</li>
                            <li><strong>• Região:</strong> Região geográfica do doador (usado no Mapa e Relatórios).</li>
                            <li><strong>• Cód. TLMK:</strong> Código de telemarketing para referência interna.</li>
                            <li><strong>• Cód. MatCob:</strong> Código de mapa/cobrança usado nos relatórios de rota.</li>
                        </ul>

                        <h3 className="sub-section-title">CAMPOS — ENDEREÇO:</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <li><strong>• CEP:</strong> Código postal. Ao digitar e clicar em "Buscar CEP" ou pressionar Tab, o sistema preenche automaticamente o endereço via ViaCEP.</li>
                            <li><strong>• Logradouro:</strong> Tipo e nome da rua (preenchido automaticamente pelo CEP).</li>
                            <li><strong>• Endereço:</strong> Número e complemento do imóvel. Ex: "578" ou "578, Apto 32".</li>
                            <li><strong>• Complemento:</strong> Informação adicional. Ex: "Bloco 17, Apto 32".</li>
                            <li><strong>• Bairro:</strong> Bairro do doador (preenchido automaticamente pelo CEP).</li>
                            <li><strong>• Cidade:</strong> Cidade (preenchida automaticamente pelo CEP).</li>
                            <li><strong>• Estado:</strong> UF do estado (preenchido automaticamente pelo CEP).</li>
                        </ul>

                        <div className="feature-box">
                            <h4>BOTÕES DE AÇÃO:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Nova:</strong> Limpa o formulário para cadastrar um novo doador.</li>
                                <li><strong>• Salvar:</strong> Salva o registro novo ou as alterações feitas.</li>
                                <li><strong>• Alterar:</strong> Habilita a edição do registro exibido.</li>
                                <li><strong>• Ficha:</strong> Gera a Ficha do Doador para impressão.</li>
                                <li><strong>• Limpar:</strong> Limpa todos os campos sem salvar.</li>
                            </ul>
                        </div>

                        <div className="info-card-premium" style={{borderLeft: '4px solid var(--primary-color)'}}>
                            <Menu className="icon-blue" />
                            <div>
                                <strong>NAVEGAÇÃO:</strong>
                                <p className="description-text" style={{margin: '10px 0 0 0', opacity: 1}}>
                                    Use os botões &lt;&lt; &lt; &gt; &gt;&gt; para navegar entre os registros cadastrados.<br/>
                                    O contador "X / Y" mostra a posição atual e o total de registros.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'Cadastro de Doações':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">CADASTRO DE DOAÇÕES</h2>
                        <div className="premium-divider" />
                        
                        <p className="description-text">
                            Este módulo registra e gerencia todas as doações recebidas.
                        </p>

                        <div className="feature-box">
                            <h4>PESQUISA:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Código da Doação:</strong> Busca uma doação específica pelo número.</li>
                                <li><strong>• Nome do Doador:</strong> Busca todas as doações de um doador pelo nome.</li>
                            </ul>
                        </div>

                        <h3 className="sub-section-title">CAMPOS — IDENTIFICAÇÃO:</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <li><strong>• Código da Doação:</strong> Gerado automaticamente com zeros à esquerda. Ex: 000002.</li>
                            <li><strong>• Código do Doador:</strong> Código do doador vinculado à doação.</li>
                            <li><strong>• Data da Doação:</strong> Data em que a doação foi registrada (preenchida automaticamente).</li>
                        </ul>

                        <h3 className="sub-section-title">CAMPOS — DATAS E STATUS:</h3>
                        <div className="premium-divider" style={{width: '30px', height: '2px', margin: '20px 0'}} />
                        <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <li><strong>• Data de Retirada:</strong> Data agendada para buscar a doação no doador.</li>
                            <li><strong>• Remarcado para:</strong> Habilitado apenas quando o status for "Remarcada". Indica a nova data de retirada após remarcação.</li>
                            <li><strong>• Status:</strong> Situação atual da doação:
                                <ul style={{margin: '10px 0 10px 20px', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                                    <li><strong>- Pendente</strong> → Doação registrada, aguardando retirada.</li>
                                    <li><strong>- Retirada</strong> → Doação já foi buscada no doador.</li>
                                    <li><strong>- Baixada</strong> → Doação concluída e baixada no sistema.</li>
                                    <li><strong>- Remarcada</strong> → Data de retirada foi alterada pelo doador.</li>
                                    <li><strong>- Cancelada</strong> → Doação cancelada (campo Observações obrigatório).</li>
                                </ul>
                            </li>
                            <li><strong>• Responsável:</strong> Nome do responsável pelo atendimento da doação.</li>
                            <li><strong>• Motorista:</strong> Motorista designado para a retirada (lista de motoristas ativos).</li>
                            <li><strong>• Veículo:</strong> Veículo utilizado na retirada (lista de veículos ativos).</li>
                        </ul>

                        <div className="info-card-premium" style={{borderLeft: '4px solid var(--warning-color)'}}>
                            <HelpCircle className="icon-blue" />
                            <div>
                                <strong>CAMPO — OBSERVAÇÕES:</strong>
                                <p className="description-text" style={{margin: '10px 0 0 0', opacity: 1}}>
                                    Campo de texto livre para anotações. Obrigatório quando o status for "Cancelada" — neste caso a borda fica vermelha como alerta.
                                </p>
                            </div>
                        </div>

                        <div className="feature-box">
                            <h4>ITENS DA DOAÇÃO:</h4>
                            <p className="description-text">Registra os itens que serão doados.</p>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Categoria:</strong> Selecione a categoria do item (ex: Eletrônicos).</li>
                                <li><strong>• Item:</strong> Descreva o item a ser doado.</li>
                                <li><strong>• Unid.:</strong> Unidade de medida (Un, Kg, Cx, etc.).</li>
                                <li><strong>• Qtde.:</strong> Quantidade do item.</li>
                                <li><strong>• + Adicionar:</strong> Clique para adicionar o item à lista.</li>
                                <li><strong>• ✕ Remover Item:</strong> Selecione um item na lista e clique para removê-lo.</li>
                            </ul>
                        </div>

                        <div className="feature-box">
                            <h4>BOTÕES DE AÇÃO:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Nova:</strong> Limpa o formulário para registrar uma nova doação.</li>
                                <li><strong>• Salvar:</strong> Salva o registro.</li>
                                <li><strong>• Alterar:</strong> Habilita a edição do registro exibido.</li>
                                <li><strong>• Excluir:</strong> Remove a doação (pede confirmação).</li>
                                <li><strong>• Ficha:</strong> Gera a Ficha da Doação para impressão.</li>
                                <li><strong>• Limpar:</strong> Limpa os campos sem salvar.</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'Categorias e Itens':
            case 'Estoque':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">CATEGORIAS E ITENS</h2>
                        <div className="premium-divider" />
                        
                        <p className="description-text">
                            Este módulo gerencia as categorias e os itens do inventário de doações.
                            É dividido em duas abas: <strong>Categorias</strong> e <strong>Itens</strong>.
                        </p>

                        <div className="feature-box">
                            <h4>ABA CATEGORIAS:</h4>
                            <div className="premium-divider" style={{width: '30px', height: '2px', margin: '15px 0'}} />
                            
                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)', margin: '20px 0 10px 0'}}>CAMPOS:</h5>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Código Base:</strong> Gerado automaticamente em múltiplos de 100. Ex: 100, 200, 300.</li>
                                <li><strong>• Nome:</strong> Nome da categoria. Ex: "Eletrônicos e Áudio/Vídeo".</li>
                                <li><strong>• Descrição:</strong> Descrição completa da categoria.</li>
                                <li><strong>• Status:</strong> "Ativo" ou "Inativo". Categorias inativas não aparecem nas listas.</li>
                            </ul>

                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)', margin: '25px 0 10px 0'}}>GRADE:</h5>
                            <p className="description-text" style={{margin: '5px 0 15px 0'}}>
                                Exibe todas as categorias cadastradas. Duplo clique na coluna "Ações" para Ativar ou Desativar uma categoria.
                            </p>

                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary-color)', margin: '25px 0 10px 0'}}>BOTÕES:</h5>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• + Novo:</strong> Limpa o formulário para nova categoria.</li>
                                <li><strong>• Alterar:</strong> Habilita a edição da categoria selecionada.</li>
                                <li><strong>• Excluir:</strong> Remove a categoria (avisa se houver itens vinculados).</li>
                                <li><strong>• ✓ Salvar Categoria:</strong> Salva a categoria.</li>
                            </ul>
                        </div>

                        <div className="feature-box" style={{borderLeftColor: 'var(--success-color)'}}>
                            <h4 style={{color: 'var(--success-color)'}}>ABA ITENS:</h4>
                            <div className="premium-divider" style={{width: '30px', height: '2px', margin: '15px 0', background: 'var(--success-color)'}} />
                            
                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)', margin: '20px 0 10px 0'}}>CAMPOS:</h5>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Código Completo:</strong> Gerado automaticamente com base na categoria. Ex: categoria 100 → itens 100100, 100101, 100102...</li>
                                <li><strong>• Categoria Base:</strong> Selecione a categoria à qual o item pertence. Ao selecionar, o código completo é gerado automaticamente.</li>
                                <li><strong>• Nome (Descrição):</strong> Nome do item. Ex: "Aparelho de CD".</li>
                                <li><strong>• Qtde:</strong> Quantidade em estoque.</li>
                                <li><strong>• Unidade:</strong> Unidade de medida (Un, Kg, L, Cx, etc.).</li>
                            </ul>

                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)', margin: '25px 0 10px 0'}}>FILTRO:</h5>
                            <p className="description-text" style={{margin: '5px 0 15px 0'}}>
                                Use o filtro no topo da aba para exibir somente os itens de uma categoria.
                            </p>

                            <h5 style={{fontSize: '1.1rem', fontWeight: 800, color: 'var(--success-color)', margin: '25px 0 10px 0'}}>BOTÕES:</h5>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• + Novo:</strong> Limpa para cadastrar novo item.</li>
                                <li><strong>• Alterar:</strong> Habilita edição do item selecionado.</li>
                                <li><strong>• Excluir:</strong> Remove o item selecionado.</li>
                                <li><strong>• ✓ Salvar Item:</strong> Salva o item.</li>
                            </ul>
                        </div>
                    </div>
                );

            case 'Movimentações':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">MOVIMENTAÇÕES</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Controle de entradas, saídas e ajustes manuais do estoque.</p>
                    </div>
                );

            case 'Status das Doações':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">STATUS DAS DOAÇÕES</h2>
                        <div className="premium-divider" />
                        
                        <p className="description-text">
                            Este módulo permite alterar o status de uma doação de forma rápida, sem precisar abrir o Cadastro de Doações.
                        </p>

                        <div className="feature-box">
                            <h4>PESQUISA:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Cód. Doação:</strong> Busca pelo número da doação. Ex: digite "2" para encontrar "000002".</li>
                                <li><strong>• Nome do Doador:</strong> Busca todas as doações de um doador.</li>
                                <li><strong>• Filtro Status:</strong> Filtra a lista por um status específico.</li>
                                <li><strong>• Limpar Pesquisa:</strong> Limpa os campos e recarrega todas as doações.</li>
                            </ul>
                        </div>

                        <div className="info-card-premium">
                            <List className="icon-blue" />
                            <div>
                                <strong>GRADE DE DOAÇÕES:</strong>
                                <p className="description-text" style={{margin: '10px 0 0 0', opacity: 1}}>
                                    Lista todas as doações encontradas. Clique em uma linha para carregar os dados no formulário abaixo.
                                </p>
                            </div>
                        </div>

                        <div className="feature-box">
                            <h4>FORMULÁRIO DE ALTERAÇÃO:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                <li><strong>• Cód. Doação:</strong> Código da doação selecionada (somente leitura).</li>
                                <li><strong>• Doador:</strong> Nome do doador (somente leitura).</li>
                                <li><strong>• Status atual:</strong> Status vigente da doação.</li>
                                <li><strong>• Novo status:</strong> Selecione o novo status desejado.</li>
                            </ul>
                        </div>

                        <div className="info-card-premium" style={{borderLeft: '4px solid var(--primary-color)'}}>
                            <HelpCircle className="icon-blue" />
                            <div>
                                <strong>REGRAS IMPORTANTES:</strong>
                                <ul className="description-text" style={{listStyle: 'none', padding: 0, margin: '15px 0 0 0', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 1}}>
                                    <li><strong>• Remarcada:</strong> O campo "Remarcado para" é habilitado automaticamente. Informe a nova data de retirada.</li>
                                    <li><strong>• Cancelada:</strong> O campo Observações fica com borda vermelha e é OBRIGATÓRIO. O sistema pede confirmação antes de salvar o cancelamento.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="feature-box" style={{borderLeftColor: 'var(--success-color)'}}>
                            <h4 style={{color: 'var(--success-color)'}}>BOTÃO SALVAR STATUS:</h4>
                            <p className="description-text" style={{margin: '10px 0 10px 0'}}>
                                Confirma a alteração do status. Visível apenas para <strong>Admin</strong> e <strong>Operador</strong>. Visualizadores só podem consultar.
                            </p>
                        </div>
                    </div>
                );

            case 'Baixa em Lote':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">BAIXA EM LOTE</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Funcionalidade desenvolvida para dar vazão ao volume diário de coletas, permitindo baixar várias doações de uma vez.</p>
                    </div>
                );

            case 'Relatórios':
            case 'Por Status':
            case 'Doações Diversas':
            case 'Doações do Dia':
            case 'Com complemento':
            case 'Histórico do Doador':
            case 'Ficha por Código':
            case 'Itens por Categoria':
            case 'Carta de Agradecimento':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">RELATÓRIOS</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Módulo para geração de listagens e documentos para conferência e logística.</p>
                        <div className="printer-box-premium">
                            <Printer size={32} />
                            <div>
                                <strong>Impressão:</strong> Otimizado para papel contínuo na Epson FX890. Use Courier New 10pt para melhor compatibilidade.
                            </div>
                        </div>
                    </div>
                );

            case 'Mapa':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">MAPA DE DOAÇÕES</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Visualização estratégica da semana de coletas. Clique nos dias para ver o detalhamento por motorista.</p>
                    </div>
                );

            case 'Projeções':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">PROJEÇÕES</h2>
                        <div className="premium-divider" />
                        <p className="description-text">
                            O módulo de Projeções utiliza algoritmos de análise histórica para estimar o volume futuro de doações, 
                            permitindo o planejamento de espaço em estoque e logística de transporte.
                        </p>
                    </div>
                );

            case 'Gráficos Estatísticos':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">GRÁFICOS ESTATÍSTICOS</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Acompanhamento visual da evolução das doações mês a mês.</p>
                    </div>
                );

            case 'Usuários':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">USUÁRIOS</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Gestão de acessos e permissões para Admin e Operadores.</p>
                    </div>
                );

            case 'Motoristas':
            case 'Veículos':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">LOGÍSTICA</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Cadastro de motoristas e veículos que realizam as coletas externas.</p>
                    </div>
                );

            case 'Diversos':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">DIVERSOS</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Gestão de colaboradores vinculados à operação.</p>
                    </div>
                );

            case 'Ramais':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">RAMAIS</h2>
                        <div className="premium-divider" />
                        <p className="description-text">Lista de ramais internos das Instituições Adolfo Bezerra de Menezes.</p>
                    </div>
                );

            case 'Dicas e atalhos':
                return (
                    <div className="help-content-animate">
                        <h2 className="content-title">DICAS E ATALHOS</h2>
                        <div className="premium-divider" />
                        
                        <div className="feature-box">
                            <h4>PREENCHIMENTO DE ENDEREÇO:</h4>
                            <p className="description-text">
                                • Digite o CEP no campo correspondente e clique em "Buscar CEP" ou
                                pressione Tab — o sistema preenche logradouro, bairro, cidade e estado
                                automaticamente via internet (ViaCEP).
                            </p>
                        </div>

                        <div className="feature-box">
                            <h4>MÁSCARAS AUTOMÁTICAS:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0}}>
                                <li><strong>• CPF:</strong> Formatado automaticamente enquanto digita: 000.000.000-00</li>
                                <li><strong>• Telefone:</strong> Formatado automaticamente: (00) 00000-0000</li>
                                <li><strong>• Placa:</strong> Formatada automaticamente: ABC-1D23</li>
                            </ul>
                        </div>

                        <div className="feature-box">
                            <h4>CÓDIGO DA DOAÇÃO:</h4>
                            <p className="description-text">
                                • O código é gerado com zeros à esquerda: 000001, 000002, etc.<br/>
                                • Na pesquisa, você pode digitar apenas o número: "2" encontra "000002".
                            </p>
                        </div>

                        <div className="feature-box" style={{borderLeftColor: 'var(--danger-color)'}}>
                            <h4>STATUS CANCELADA:</h4>
                            <ul className="description-text" style={{listStyle: 'none', padding: 0}}>
                                <li>• Ao selecionar "Cancelada", o campo Observações fica com borda vermelha.</li>
                                <li>• É obrigatório informar o motivo do cancelamento antes de salvar.</li>
                                <li>• O sistema pede confirmação antes de registrar o cancelamento.</li>
                            </ul>
                        </div>

                        <div className="feature-box">
                            <h4>TEMAS:</h4>
                            <p className="description-text">
                                • Mude o tema pelo Menu Principal → botões ☀ Claro / 🌙 Escuro / 💻 Sistema.<br/>
                                • O tema muda instantaneamente em todos os formulários abertos.
                            </p>
                        </div>

                        <div className="feature-box">
                            <h4>IMPRESSÃO MATRICIAL:</h4>
                            <p className="description-text">
                                • O sistema usa a impressora configurada como padrão no Windows.<br/>
                                • Certifique-se de que a Epson FX890 está configurada como impressora padrão.<br/>
                                • Use papel contínuo 80 colunas para melhor resultado.
                            </p>
                        </div>

                        <div className="feature-box" style={{background: 'var(--bg-color)', border: '1px solid var(--border-color)'}}>
                            <h4>BACKUP:</h4>
                            <p className="description-text">
                                • Todos os dados ficam armazenados na nuvem (Supabase).<br/>
                                • Não é necessário fazer backup manual — os dados estão seguros online.<br/>
                                • Em caso de troca de computador, basta acessar o Link do Sistema:<br/>
                                <a href="https://doacoes-bm.netlify.app/" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>https://doacoes-bm.netlify.app/</a>
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="help-manual-page">
            <aside className="help-sidebar-premium">
                <div className="help-sidebar-header">
                    <div className="premium-icon-box">
                        <BookOpen size={20} />
                    </div>
                    <h3>Manual de Ajuda</h3>
                </div>
                <div className="help-sidebar-menu">
                    {sections.map(section => (
                        <div key={section.id} className="help-menu-group">
                            <div 
                                className={`help-nav-item ${activeSection === section.id || (section.subItems && section.subItems.includes(activeSection)) ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                {section.icon}
                                <span>{section.title}</span>
                                {section.subItems && <ChevronRight size={14} className={`chevron-icon ${(activeSection === section.id || section.subItems.includes(activeSection)) ? 'rotated' : ''}`} />}
                            </div>
                            
                            {section.subItems && (activeSection === section.id || section.subItems.includes(activeSection)) && (
                                <div className="help-nav-submenu">
                                    {section.subItems.map(sub => (
                                        <div 
                                            key={sub}
                                            className={`help-nav-subitem ${activeSection === sub ? 'active' : ''}`}
                                            onClick={() => setActiveSection(sub)}
                                        >
                                            {sub}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            <main className="help-content-viewer">
                <div className="help-content-container">
                    {renderContent()}
                </div>
            </main>

            <style dangerouslySetInnerHTML={{ __html: `
                .help-manual-page {
                    display: flex;
                    flex: 1;
                    height: calc(100vh - 120px);
                    background: var(--card-bg);
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    box-shadow: var(--shadow-lg);
                    overflow: hidden;
                    animation: helpFadeIn 0.3s ease;
                }

                @keyframes helpFadeIn { from { opacity: 0; } to { opacity: 1; } }

                .help-sidebar-premium {
                    width: 280px;
                    background: var(--bg-color);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .help-sidebar-header {
                    padding: 24px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .premium-icon-box {
                    width: 36px;
                    height: 36px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 12px var(--primary-soft);
                }

                .help-sidebar-header h3 {
                    font-size: 1rem;
                    font-weight: 800;
                    margin: 0;
                    color: var(--text-color);
                }

                .help-sidebar-menu {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px 12px;
                }

                .help-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    font-weight: 600;
                    position: relative;
                }

                .help-nav-item:hover { background: var(--card-bg); color: var(--primary-color); }
                .help-nav-item.active { background: var(--card-bg); color: var(--primary-color); box-shadow: var(--shadow-sm); }
                .help-nav-item.active::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 25%;
                    height: 50%;
                    width: 4px;
                    background: var(--primary-color);
                    border-radius: 0 4px 4px 0;
                }

                .chevron-icon { opacity: 0.5; margin-left: auto; transition: transform 0.2s; }
                .chevron-icon.rotated { transform: rotate(90deg); }

                .help-nav-submenu {
                    margin-left: 20px;
                    padding-left: 12px;
                    border-left: 1px dashed var(--border-color);
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    margin-bottom: 12px;
                }

                .help-nav-subitem {
                    padding: 8px 12px;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .help-nav-subitem:hover { color: var(--primary-color); background: var(--primary-soft); }
                .help-nav-subitem.active { color: var(--primary-color); font-weight: 700; background: var(--primary-soft); }

                .help-content-viewer {
                    flex: 1;
                    height: 100%;
                    overflow-y: auto;
                    padding: 40px;
                }

                .help-content-container { max-width: 800px; margin: 0 auto; }

                .content-title { font-size: 2rem; font-weight: 900; margin-bottom: 10px; color: var(--text-color); }
                .premium-divider { height: 4px; width: 40px; background: var(--primary-color); margin-bottom: 30px; border-radius: 2px; }
                .description-text { font-size: 1.1rem; line-height: 1.8; color: var(--text-color); margin-bottom: 24px; opacity: 0.8; }

                .info-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 40px; }
                .info-card-premium { background: var(--bg-color); padding: 24px; border-radius: 16px; border: 1px solid var(--border-color); display: flex; gap: 15px; }
                .icon-blue { color: var(--primary-color); flex-shrink: 0; }

                .feature-box { background: var(--primary-soft); padding: 24px; border-radius: 16px; border-left: 5px solid var(--primary-color); margin: 30px 0; }
                .feature-box h4 { margin: 0 0 10px 0; color: var(--primary-color); font-weight: 800; }

                .status-timeline { display: flex; flex-direction: column; gap: 10px; margin: 20px 0; }
                .timeline-item { padding: 12px 20px; background: var(--bg-color); border-radius: 12px; border-left: 4px solid var(--border-color); }

                .printer-box-premium { display: flex; gap: 20px; align-items: center; padding: 24px; background: #1e293b; color: white; border-radius: 16px; font-size: 0.9rem; }
                .tips-list { 
                    background: var(--bg-color); 
                    padding: 24px; 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 12px; 
                }
                .tip-item { 
                    font-size: 1rem; 
                    color: var(--text-color); 
                }

                .fields-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin: 20px 0;
                }
                .field-badge {
                    background: var(--card-bg);
                    padding: 8px 16px;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-muted);
                }
                .field-badge.highlight {
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                    background: var(--primary-soft);
                }


                .help-content-animate { animation: helpFadeUp 0.4s ease-out; }
                @keyframes helpFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* Mobile */
                @media (max-width: 900px) {
                    .help-manual-page { flex-direction: column; height: auto; }
                    .help-sidebar-premium { width: 100%; border-right: none; border-bottom: 1px solid var(--border-color); }
                }
            `}} />
        </div>
    );
};

export default HelpManual;
