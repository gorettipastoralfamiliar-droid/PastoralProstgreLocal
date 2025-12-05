
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
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true', // Pula aviso do Ngrok
            'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ login: login.toUpperCase() }) // Force Upper
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          throw new Error("O servidor não retornou JSON. Verifique se a URL está correta ou se o backend foi atualizado.");
      }

      const data = await response.json();

      if (data.found) {
        setUserData(data);
        generateChallenge(data);
        setStep('CHALLENGE');
      } else {
        setError('Login não encontrado.');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão ou Login inválido.');
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
    
    // Parse date safely handling strings like "1980-05-20" or "1980-05-20T00:00:00"
    const cleanDateStr = correctDateStr.split('T')[0];
    const [y, m, d] = cleanDateStr.split('-').map(Number);
    // Note: Month in JS Date is 0-indexed (0=Jan, 11=Dec)
    const baseDateObj = new Date(y, m - 1, d);
    const today = new Date();

    const correctFmt = formatDateBR(baseDateObj);
    setCorrectAnswer(correctFmt);
    
    const opts = new Set<string>();
    opts.add(correctFmt);

    // Generate 3 unique wrong options with high entropy
    while (opts.size < 4) {
      const variant = new Date(baseDateObj);
      const r = Math.random();
      
      if (r < 0.40) {
        let yearOffset = Math.floor(Math.random() * 31) - 15;
        if (yearOffset === 0) yearOffset = 1;
        
        variant.setFullYear(variant.getFullYear() + yearOffset);
        variant.setMonth(Math.floor(Math.random() * 12));
      } 
      else if (r < 0.70) {
        variant.setMonth(Math.floor(Math.random() * 12));
        variant.setDate(Math.floor(Math.random() * 28) + 1);
      } 
      else if (r < 0.85) {
        const decades = [-20, -10, 10, 20];
        const decadeOffset = decades[Math.floor(Math.random() * decades.length)];
        variant.setFullYear(variant.getFullYear() + decadeOffset);
      }
      else {
        let smallOffset = Math.floor(Math.random() * 5) - 2; 
        if (smallOffset === 0) smallOffset = -1;
        variant.setFullYear(variant.getFullYear() + smallOffset);
        variant.setDate(variant.getDate() + (Math.random() > 0.5 ? 5 : -5));
      }

      if (variant > today) {
          variant.setFullYear(variant.getFullYear() - 20);
      }
      
      const fmt = formatDateBR(variant);
      if (fmt !== correctFmt) {
        opts.add(fmt);
      }
    }

    const finalOptions = Array.from(opts);
    shuffleArray(finalOptions);
    setOptions(finalOptions);
  };

  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const formatDateBR = (date: Date) => {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const handleOptionClick = async (option: string) => {
    if (option === correctAnswer) {
      setLoading(true); // Re-usa loading para feedback visual
      
      // CRITICAL FIX: Fetch full profile to ensure 'possui_veiculo' is present
      // O endpoint check-login antigo não retorna possui_veiculo, então buscamos tudo.
      try {
          const API_URL = serverUrl.replace(/\/$/, '');
          const res = await fetch(`${API_URL}/api/membros`, {
              mode: 'cors',
              headers: { 
                  'ngrok-skip-browser-warning': 'true',
                  'Bypass-Tunnel-Reminder': 'true'
              }
          });
          
          if (res.ok) {
              const allMembers = await res.json();
              // Encontra o usuário atual na lista completa para ter todos os campos
              const fullProfile = allMembers.find((m: any) => String(m.id) === String(userData.id));
              
              if (fullProfile) {
                  onSuccess(fullProfile);
              } else {
                  onSuccess(userData); // Fallback
              }
          } else {
               onSuccess(userData); // Fallback
          }
      } catch (error) {
          console.error("Erro ao buscar perfil completo", error);
          onSuccess(userData); // Fallback se der erro
      } finally {
          setLoading(false);
          onClose();
      }
      
    } else {
      setError('Data incorreta. Tente novamente.');
      setTimeout(() => {
        onClose();
        setStep('LOGIN');
        setLogin('');
        setError('');
        setUserData(null);
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
                        disabled={loading}
                        className="py-3 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500 rounded-lg text-white transition-all active:scale-95 font-medium disabled:opacity-50"
                     >
                         {opt}
                     </button>
                 ))}
             </div>
             {error && <p className="text-xs text-red-400 text-center font-bold mt-2">{error}</p>}
             {loading && <p className="text-xs text-blue-300 text-center animate-pulse mt-2">Carregando perfil...</p>}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
