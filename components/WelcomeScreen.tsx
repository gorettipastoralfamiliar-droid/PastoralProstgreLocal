import React from 'react';
import { ViewState } from '../types';

interface WelcomeScreenProps {
  onNavigate: (view: ViewState) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-center animate-fade-in w-full max-w-md mx-auto">
      
      {/* Logo Area */}
      <div className="mb-8 relative group cursor-pointer" onClick={() => onNavigate(ViewState.SERVER_SETUP)}>
        <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-transform hover:scale-105">
           {/* Placeholder for Pastoral Logo - Using an Icon for now */}
           <svg className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
           </svg>
        </div>
        {/* Hidden hint for backend setup */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-300 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
          Configurar Servidor
        </div>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-900 drop-shadow-sm mb-1" style={{ color: '#e2e8f0' }}>
        Pastoral Familiar
      </h1>
      <p className="text-slate-400 mb-10 text-sm font-medium tracking-wide">
        Cadastro Paroquial
      </p>

      {/* Main Glass Card */}
      <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <h2 className="text-xl font-bold text-white mb-8 relative z-10">
          Bem-vindo(a)
        </h2>

        <div className="space-y-6 relative z-10">
          <button 
            className="w-full py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3"
            onClick={() => alert('Feature de Login ainda não implementada. Use "Desejo me cadastrar".')}
          >
            <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            Já sou cadastrado
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-400/30"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase tracking-wider">Ou</span>
            <div className="flex-grow border-t border-slate-400/30"></div>
          </div>

          <button 
            onClick={() => onNavigate(ViewState.REGISTER)}
            className="w-full py-4 bg-white/90 hover:bg-white text-slate-900 rounded-xl font-semibold border border-white/50 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
          >
             <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-700">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </div>
            Desejo me cadastrar
          </button>
        </div>
      </div>

    </div>
  );
};