
import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, onSuccess, title = "Acesso Restrito" }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    // Senha = Dia + Hora + Minuto (ex: 010940)
    const expectedPassword = `${day}${hour}${minute}`;
    
    // Debug (opcional, remova em produção se quiser ser estrito)
    console.log(`[Security] Senha esperada: ${expectedPassword}`);

    if (password === expectedPassword) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <GlassCard className="w-full max-w-sm border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-red-500/50">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-slate-400 mt-1">Digite a senha de acesso.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => { setPassword(e.target.value.replace(/\D/g,'')); setError(false); }}
            placeholder="000000"
            maxLength={6}
            className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] text-white focus:outline-none transition-all ${error ? 'border-red-500 text-red-400 placeholder-red-800/50' : 'border-white/10 focus:border-blue-400'}`}
            autoFocus
          />
          
          {error && (
            <p className="text-xs text-red-400 text-center font-bold animate-pulse">
              Senha incorreta. Tente novamente.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="py-3 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40 transition-all active:scale-95"
            >
              Desbloquear
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};
