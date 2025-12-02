
import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Member } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgents: Member[];
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, selectedAgents }) => {
  const [message, setMessage] = useState('Olá {nome}, a Paz de Cristo! Gostaria de falar sobre a Pastoral.');
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  const getFormattedPhone = (phone: string) => {
    // Remove tudo que não é número
    let nums = phone.replace(/\D/g, '');
    // Se não tiver DDI (55) e tiver 10 ou 11 digitos, adiciona
    if (nums.length >= 10 && nums.length <= 11) {
      nums = '55' + nums;
    }
    return nums;
  };

  const generateLink = (agent: Member) => {
    const phone = getFormattedPhone(agent.telefone);
    // Substitui variáveis
    const firstName = agent.nome_completo.split(' ')[0];
    const text = message
      .replace(/{nome}/g, firstName)
      .replace(/{paroquia}/g, agent.paroquia)
      .replace(/{funcao}/g, agent.funcao);
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleSend = (agent: Member) => {
    const link = generateLink(agent);
    window.open(link, '_blank');
    setSentIds(prev => new Set(prev).add(agent.id!));
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <GlassCard className="w-full max-w-2xl h-[80vh] flex flex-col border-green-500/30 p-0 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-green-600/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-green-500 rounded-full shadow-lg shadow-green-500/30">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Disparo WhatsApp</h2>
               <p className="text-xs text-green-200">Selecionados: {selectedAgents.length} agentes</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row min-h-0">
          
          {/* Left: Message Editor */}
          <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col gap-4">
             <div>
               <label className="text-sm font-bold text-slate-300 mb-2 block">Sua Mensagem</label>
               <textarea
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 className="w-full h-48 bg-black/30 border border-white/20 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 resize-none"
                 placeholder="Digite sua mensagem..."
               />
             </div>
             
             <div>
               <p className="text-xs text-slate-400 mb-2">Variáveis Disponíveis (Clique para inserir):</p>
               <div className="flex gap-2">
                 {['{nome}', '{paroquia}', '{funcao}'].map(variable => (
                   <button 
                     key={variable}
                     onClick={() => insertVariable(variable)}
                     className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-blue-300 transition-colors"
                   >
                     {variable}
                   </button>
                 ))}
               </div>
             </div>

             <div className="mt-auto bg-green-900/20 border border-green-500/20 p-3 rounded-lg text-xs text-green-200">
               <p><strong>Dica:</strong> O navegador pode bloquear múltiplos popups. Clique em "Enviar" um a um na lista ao lado.</p>
             </div>
          </div>

          {/* Right: Sending List */}
          <div className="w-full md:w-1/2 flex flex-col bg-black/20">
             <div className="p-4 border-b border-white/10 bg-white/5">
                <h3 className="font-bold text-white text-sm">Lista de Envio</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {selectedAgents.map(agent => {
                   const isSent = sentIds.has(agent.id!);
                   return (
                     <div key={agent.id} className={`p-3 rounded-lg border flex items-center justify-between transition-all ${isSent ? 'bg-green-900/20 border-green-500/30 opacity-70' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSent ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                              {agent.nome_completo.charAt(0)}
                           </div>
                           <div className="overflow-hidden">
                             <p className="text-sm font-bold text-white truncate w-32 md:w-40">{agent.nome_completo}</p>
                             <p className="text-xs text-slate-400">{agent.telefone}</p>
                           </div>
                        </div>
                        
                        <button
                          onClick={() => handleSend(agent)}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                            isSent 
                            ? 'bg-transparent text-green-400 border border-green-500/50' 
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                          }`}
                        >
                          {isSent ? (
                            <>Enviado <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></>
                          ) : (
                            <>Enviar <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></>
                          )}
                        </button>
                     </div>
                   );
                })}
             </div>
          </div>

        </div>
      </GlassCard>
    </div>
  );
};
