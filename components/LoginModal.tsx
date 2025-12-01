
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: any) => void;
  serverUrl: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, serverUrl }) => {
  const [step, setStep] = useState<'LOGIN' | 'CHALLENGE'>('LOGIN');
  const [login, setLogin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Challenge Data
  const [challengeType, setChallengeType] = useState<'NASCIMENTO' | 'CASAMENTO'>('NASCIMENTO');
  const [options, setOptions] = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [userData, setUserData] = useState<any>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim()) return;

    setLoading(true);
    setError('');

    const API_URL = serverUrl.replace(/\/$/, '');
    
    try {
      const response = await fetch(`${API_URL}/api/membros/check-login`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.toUpperCase() }) // Force Upper
      });

      const data = await response.json();

      if (data.found) {
        setUserData(data);
        generateChallenge(data);
        setStep('CHALLENGE');
      } else {
        setError('Login não encontrado.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const generateChallenge = (data: any) => {
    // Decide question based on marital status
    let type: 'NASCIMENTO' | 'CASAMENTO' = 'NASCIMENTO';
    let correctDateStr = data.data_nascimento;

    if (data.estado_civil?.toUpperCase().includes('CASADO') && data.data_casamento) {
      // 50% chance if married
      if (Math.random() > 0.5) {
        type = 'CASAMENTO';
        correctDateStr = data.data_casamento;
      }
    }

    setChallengeType(type);
    
    // Parse date (assuming YYYY-MM-DD from Postgres)
    // Remove Time part if exists
    const cleanDateStr = correctDateStr.split('T')[0];
    setCorrectAnswer(formatDateBR(cleanDateStr));
    
    // Generate 3 wrong options
    const opts = new Set<string>();
    opts.add(formatDateBR(cleanDateStr));

    const baseDate = new Date(cleanDateStr);

    while (opts.size < 4) {
      const variant = new Date(baseDate);
      const rand = Math.random();
      
      if (rand < 0.33) {
        // Change Day
        variant.setDate(variant.getDate() + Math.floor(Math.random() * 20) - 10);
      } else if (rand < 0.66) {
        // Change Month
        variant.setMonth(variant.getMonth() + Math.floor(Math.random() * 5) - 2);
      } else {
        // Change Year
        variant.setFullYear(variant.getFullYear() + Math.floor(Math.random() * 4) - 2);
      }
      
      const fmt = formatDateBR(variant.toISOString().split('T')[0]);
      if (fmt !== formatDateBR(cleanDateStr)) {
        opts.add(fmt);
      }
    }

    // Shuffle
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  };

  const formatDateBR = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleOptionClick = (option: string) => {
    if (option === correctAnswer) {
      onSuccess(userData);
      onClose();
    } else {
      setError('Data incorreta. Tente novamente.');
      setTimeout(() => {
        onClose();
        setStep('LOGIN');
        setLogin('');
        setError('');
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <GlassCard className="w-full max-w-sm border-blue-500/30">
        
        <div className="absolute top-2 right-2">
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full mx-auto flex items-center justify-center mb-4 border border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.85.577-4.147" /></svg>
          </div>
          <h2 className="text-xl font-bold text-white">Acesso do Agente</h2>
        </div>

        {step === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs text-blue-300 ml-1">SEU LOGIN (Nome de Usuário)</label>
                <input 
                    type="text" 
                    value={login}
                    onChange={(e) => { setLogin(e.target.value.toUpperCase()); setError(''); }}
                    placeholder="DIGITE AQUI..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-center text-lg text-white placeholder-white/20 focus:outline-none focus:border-blue-400 uppercase tracking-widest"
                    autoFocus
                />
            </div>
            
            {error && <p className="text-xs text-red-400 text-center font-bold">{error}</p>}

            <button 
              type="submit"
              disabled={loading || !login}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-fade-in">
             <p className="text-sm text-slate-300 text-center">
                 Confirme sua identidade, {userData.nome_completo.split(' ')[0]}.
             </p>
             <div className="text-center font-semibold text-blue-200 mb-4">
                 Qual sua data de {challengeType === 'NASCIMENTO' ? 'Nascimento' : 'Casamento'}?
             </div>

             <div className="grid grid-cols-2 gap-3">
                 {options.map((opt, idx) => (
                     <button
                        key={idx}
                        onClick={() => handleOptionClick(opt)}
                        className="py-3 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500 rounded-lg text-white transition-all active:scale-95"
                     >
                         {opt}
                     </button>
                 ))}
             </div>
             {error && <p className="text-xs text-red-400 text-center font-bold mt-2">{error}</p>}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
