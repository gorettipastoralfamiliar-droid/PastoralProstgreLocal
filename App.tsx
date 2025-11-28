import React, { useState } from 'react';
import { ViewState } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegistrationForm } from './components/RegistrationForm';
import { ServerSetup } from './components/ServerSetup';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.WELCOME);

  const renderView = () => {
    switch (currentView) {
      case ViewState.WELCOME:
        return <WelcomeScreen onNavigate={(view) => setCurrentView(view)} />;
      case ViewState.REGISTER:
        return <RegistrationForm onBack={() => setCurrentView(ViewState.WELCOME)} />;
      case ViewState.SERVER_SETUP:
        return <ServerSetup onBack={() => setCurrentView(ViewState.WELCOME)} />;
      default:
        return <WelcomeScreen onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-0 md:p-6 bg-[#0f172a] overflow-hidden font-sans">
       {/* Global Background Elements for that "Blue Atmosphere" */}
       <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[70%] bg-blue-600/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px]" />
       </div>

      {/* Main App Container */}
      {/* Changed md:max-w-md to md:max-w-6xl for Desktop Dashboard feel */}
      <div className={`
        w-full h-screen md:h-[90vh] relative z-10 flex flex-col transition-all duration-500
        ${currentView === ViewState.WELCOME ? 'md:max-w-md' : 'md:max-w-5xl'}
      `}>
         {/* Glassmorphism Container */}
        <div className="flex-1 bg-white/10 md:backdrop-blur-xl md:border md:border-white/20 md:rounded-[30px] shadow-2xl overflow-hidden flex flex-col relative">
          
          {/* Header Blur Overlay (Visible on internal pages scroll) */}
          {currentView !== ViewState.WELCOME && (
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-900/50 to-transparent z-20 pointer-events-none" />
          )}

          <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
            {renderView()}
          </div>
          
        </div>
        
        {/* Footer/Copyright */}
        <div className="text-center py-4 md:py-2">
          <p className="text-blue-300/40 text-[10px] uppercase tracking-widest">
            Sistema de Agentes • V 1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;