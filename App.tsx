
import React, { useState, useEffect } from 'react';
import { ViewState, LogEntry, LogType, Member } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegistrationForm } from './components/RegistrationForm';
import { ServerSetup } from './components/ServerSetup';
import { ApiGenerator } from './components/ApiGenerator';
import { ConsoleLogger } from './components/ConsoleLogger';
import { SecurityModal } from './components/SecurityModal';
import { LoginModal } from './components/LoginModal';
import { AgentDashboard } from './components/AgentDashboard';
import { ReportsView } from './components/ReportsView';
import { EldersModule } from './components/EldersModule';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.WELCOME);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  // Estado global para a URL do servidor, permitindo edição
  const [serverUrl, setServerUrl] = useState<string>('http://192.168.16.169:3000');
  
  // Controle de segurança para navegação
  const [showSecurityNav, setShowSecurityNav] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);

  // Login Modal State
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // State for Editing
  const [agentToEdit, setAgentToEdit] = useState<Member | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('pastoral_server_url');
    if (savedUrl) {
      setServerUrl(savedUrl);
    }
  }, []);

  const handleUpdateServerUrl = (newUrl: string) => {
    setServerUrl(newUrl);
    localStorage.setItem('pastoral_server_url', newUrl);
  };

  const addLog = (type: LogType, message: string, details?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => setLogs([]);

  // Lógica de navegação protegida
  const handleNavigation = (view: ViewState) => {
    if (view === ViewState.SERVER_SETUP) {
      setPendingView(view);
      setShowSecurityNav(true);
    } else {
      // Se navegar para REGISTER pelo fluxo normal, limpa o edit
      if (view === ViewState.REGISTER) {
        setAgentToEdit(null);
      }
      setCurrentView(view);
    }
  };

  const handleSecuritySuccess = () => {
    if (pendingView) {
      setCurrentView(pendingView);
      setPendingView(null);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setShowLogin(false);
    setCurrentView(ViewState.DASHBOARD);
    addLog('success', 'Login Efetuado', `Usuário: ${user.nome_completo}`);
  };

  const handleEditAgent = (agent: Member) => {
    setAgentToEdit(agent);
    setCurrentView(ViewState.REGISTER);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.WELCOME:
        return (
            <WelcomeScreen 
                onNavigate={handleNavigation} 
                onLoginClick={() => setShowLogin(true)} 
            />
        );
      case ViewState.REGISTER:
        return (
          <RegistrationForm 
            onBack={() => {
                // If we were editing, go back to dashboard
                if (agentToEdit || currentUser) {
                    setCurrentView(ViewState.DASHBOARD);
                } else {
                    setCurrentView(ViewState.WELCOME);
                }
                setAgentToEdit(null);
            }} 
            addLog={addLog} 
            serverUrl={serverUrl} 
            initialData={agentToEdit}
          />
        );
      case ViewState.SERVER_SETUP:
        return (
          <ServerSetup 
            onBack={() => setCurrentView(ViewState.WELCOME)} 
            onNavigateToAI={() => setCurrentView(ViewState.AI_GENERATOR)} 
            addLog={addLog}
            serverUrl={serverUrl}
            onUpdateServerUrl={handleUpdateServerUrl}
          />
        );
      case ViewState.AI_GENERATOR:
        return <div className="h-full p-4"><ApiGenerator onBack={() => setCurrentView(ViewState.SERVER_SETUP)} /></div>;
      
      case ViewState.DASHBOARD:
        return (
            <div className="h-full">
                <AgentDashboard 
                    currentUser={currentUser} 
                    serverUrl={serverUrl} 
                    onLogout={() => { setCurrentUser(null); setCurrentView(ViewState.WELCOME); }}
                    onNavigate={handleNavigation}
                    addLog={addLog}
                    onEdit={handleEditAgent}
                />
            </div>
        );
      
      case ViewState.REPORTS:
        return (
          <div className="h-full">
            <ReportsView 
              currentUser={currentUser}
              serverUrl={serverUrl}
              onBack={() => setCurrentView(ViewState.DASHBOARD)}
              addLog={addLog}
            />
          </div>
        );
        
      case ViewState.ELDERS_MODULE:
        return (
           <div className="h-full">
               <EldersModule
                 currentUser={currentUser}
                 serverUrl={serverUrl}
                 onBack={() => setCurrentView(ViewState.DASHBOARD)}
                 addLog={addLog}
               />
           </div>
        );
      
      default:
        return <WelcomeScreen onNavigate={handleNavigation} onLoginClick={() => setShowLogin(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-6 bg-[#0f172a] overflow-hidden font-sans">
       {/* Global Background Elements with requested #5566D0 color */}
       <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[70%] bg-[#5566D0]/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px]" />
       </div>

      {/* Main App Container */}
      <div className={`
        w-full h-screen md:h-[90vh] relative z-10 flex flex-col transition-all duration-500
        ${currentView === ViewState.WELCOME ? 'md:max-w-md' : 'md:max-w-7xl'}
      `}>
         {/* Glassmorphism Container */}
        <div className={`flex-1 bg-white/10 md:backdrop-blur-xl md:border md:border-white/20 md:rounded-[30px] shadow-2xl overflow-hidden flex flex-col relative ${[ViewState.DASHBOARD, ViewState.REPORTS, ViewState.ELDERS_MODULE].includes(currentView) ? 'bg-[#111827] border-0 md:border-gray-700' : ''}`}>
          
          {/* Header Blur Overlay (Visible on internal pages scroll, NOT Dashboard/Reports) */}
          {![ViewState.WELCOME, ViewState.DASHBOARD, ViewState.REPORTS, ViewState.ELDERS_MODULE].includes(currentView) && (
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-900/50 to-transparent z-20 pointer-events-none" />
          )}

          <div className={`flex-1 overflow-y-auto scroll-smooth custom-scrollbar ${![ViewState.DASHBOARD, ViewState.REPORTS, ViewState.ELDERS_MODULE].includes(currentView) ? 'pb-20 md:pb-0' : ''}`}>
            {renderView()}
          </div>
          
        </div>
        
        {/* Footer */}
        {![ViewState.DASHBOARD, ViewState.REPORTS, ViewState.ELDERS_MODULE].includes(currentView) && (
            <div className="text-center py-4 md:py-2">
            <p className="text-blue-300/40 text-[10px] uppercase tracking-widest">
                Sistema de Agentes • V 1.0 • Conectado a: {serverUrl}
            </p>
            </div>
        )}
      </div>

      {/* Floating Console Logger */}
      <ConsoleLogger logs={logs} onClear={clearLogs} />

      {/* Security Modal for Server Configuration */}
      <SecurityModal 
        isOpen={showSecurityNav}
        onClose={() => { setShowSecurityNav(false); setPendingView(null); }}
        onSuccess={handleSecuritySuccess}
        title="Configuração do Servidor"
      />

       {/* Login Modal */}
       <LoginModal 
         isOpen={showLogin}
         onClose={() => setShowLogin(false)}
         onSuccess={handleLoginSuccess}
         serverUrl={serverUrl}
       />
    </div>
  );
};

export default App;
