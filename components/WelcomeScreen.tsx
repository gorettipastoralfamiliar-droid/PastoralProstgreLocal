
import React from 'react';
import { ViewState } from '../types';

interface WelcomeScreenProps {
  onNavigate: (view: ViewState) => void;
  onLoginClick: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNavigate, onLoginClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 md:p-6 text-center animate-fade-in w-full max-w-md mx-auto">
      
      {/* Logo Area */}
      <div className="mb-6 md:mb-8 relative group cursor-pointer" onClick={() => onNavigate(ViewState.SERVER_SETUP)}>
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white backdrop-blur-md border-4 border-white/30 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-transform hover:scale-105 overflow-hidden p-1 mx-auto">
           {/* Logo Oficial da Pastoral Familiar */}
           <img 
                src= "https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png"
             alt="Pastoral Familiar Logo" 
             className="w-full h-full object-contain"
             onError={(e) => {
               // If image fails, do NOT show generic user icon. Show alt text or nothing.
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement!.classList.add('bg-blue-100');
               e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-blue-800 font-bold">Logo Pastoral</span>';
             }}
           />
        </div>
        {/* Hidden hint for backend setup */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-blue-300 whitespace-nowrap bg-black/50 px-2 py-1 rounded">
          Configurar Servidor
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-900 drop-shadow-sm mb-1" style={{ color: '#e2e8f0' }}>
        Pastoral Familiar
      </h1>
      <p className="text-slate-400 mb-8 md:mb-10 text-xs md:text-sm font-medium tracking-wide">
        Cadastro Paroquial
      </p>

      {/* Main Glass Card */}
      <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <h2 className="text-lg md:text-xl font-bold text-white mb-6 md:mb-8 relative z-10">
          Bem-vindo(a)
        </h2>

        <div className="space-y-4 md:space-y-6 relative z-10">
          <button 
            className="w-full py-3 md:py-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3 text-sm md:text-base"
            onClick={onLoginClick}
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
            className="w-full py-3 md:py-4 bg-white/90 hover:bg-white text-slate-900 rounded-xl font-semibold border border-white/50 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3 text-sm md:text-base"
          >
             <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-700">
               <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </div>
            Desejo me cadastrar
          </button>
        </div>
      </div>

    </div>
  );
};
