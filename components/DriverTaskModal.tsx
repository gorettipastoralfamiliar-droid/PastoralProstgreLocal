
import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Assistido, Escala, Evento, Member } from '../types';

interface DriverTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Member;
  serverUrl: string;
}

export const DriverTaskModal: React.FC<DriverTaskModalProps> = ({ isOpen, onClose, currentUser, serverUrl }) => {
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<Evento | null>(null);
  const [myPassengers, setMyPassengers] = useState<Assistido[]>([]);
  const [allScales, setAllScales] = useState<Escala[]>([]);
  const [myScales, setMyScales] = useState<Escala[]>([]);
  
  const API_URL = serverUrl.replace(/\/$/, '');
  const headers = { 'ngrok-skip-browser-warning': 'true' };

  // CORREÇÃO: useEffect deve ser chamado ANTES de qualquer retorno condicional
  useEffect(() => {
    // Se não estiver aberto ou não for motorista, não faz nada (dentro do efeito)
    if (!isOpen || !currentUser.possui_veiculo) return;

    const checkAssignments = async () => {
      setLoading(true);
      try {
        const resEvents = await fetch(`${API_URL}/api/eventos`, { headers });
        if (!resEvents.ok) throw new Error("Falha ao buscar eventos");
        
        const events: Evento[] = await resEvents.json();
        const currentEvent = events.find(e => e.ativo);

        if (!currentEvent) {
          onClose(); 
          return;
        }

        const resEscalas = await fetch(`${API_URL}/api/escalas/${currentEvent.id}`, { headers });
        if (!resEscalas.ok) throw new Error("Falha ao buscar escalas");
        
        const escalas: Escala[] = await resEscalas.json();
        setAllScales(escalas);
        
        const myScalesData = escalas.filter(e => String(e.motorista_id) === String(currentUser.id));

        if (myScalesData.length === 0) {
          onClose();
          return;
        }
        setMyScales(myScalesData);

        const resAssistidos = await fetch(`${API_URL}/api/assistidos`, { headers });
        if (!resAssistidos.ok) throw new Error("Falha ao buscar assistidos");
        
        const allAssistidos: Assistido[] = await resAssistidos.json();
        const passengers = allAssistidos.filter(a => 
            myScalesData.some(s => String(s.assistido_id) === String(a.id))
        );

        setActiveEvent(currentEvent);
        setMyPassengers(passengers);
      } catch (error) {
        console.error("Erro ao verificar tarefas do motorista", error);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    checkAssignments();
  }, [isOpen, currentUser]); 

  const updateScale = async (assistidoId: number, field: 'status' | 'tipo', value: string) => {
    if (!activeEvent) return;
    
    // Optimistic Update
    const updatedAll = allScales.map(s => {
        if (String(s.assistido_id) === String(assistidoId) && String(s.evento_id) === String(activeEvent.id)) {
            return { ...s, [field]: value };
        }
        return s;
    });
    
    setAllScales(updatedAll);
    setMyScales(updatedAll.filter(e => String(e.motorista_id) === String(currentUser.id)));

    // Send to server
    try {
        await fetch(`${API_URL}/api/escalas/batch`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ evento_id: activeEvent.id, escalas: updatedAll })
        });
    } catch (e) {
        console.error("Erro ao salvar escala", e);
        // Em produção, deveria reverter o estado aqui
    }
  };

  const cycleStatus = (assistidoId: number, current: string) => {
    const map: Record<string, string> = {
        'Planejada': 'Confirmada',
        'Confirmada': 'Concluida',
        'Concluida': 'Cancelada',
        'Cancelada': 'Planejada'
    };
    updateScale(assistidoId, 'status', map[current] || 'Planejada');
  };

  const cycleType = (assistidoId: number, current: string) => {
    const map: Record<string, string> = {
        'Ida': 'Volta',
        'Volta': 'Ambos',
        'Ambos': 'Ida'
    };
    updateScale(assistidoId, 'tipo', map[current] || 'Ambos');
  };

  const openGps = (address: string) => {
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const openWhatsapp = (phone: string) => {
    let nums = phone.replace(/\D/g, '');
    if (nums.length >= 10 && nums.length <= 11) nums = '55' + nums;
    window.open(`https://wa.me/${nums}`, '_blank');
  };

  // CORREÇÃO: O retorno null deve ficar AQUI, depois de todos os hooks
  if (!isOpen || !currentUser.possui_veiculo) return null;

  if (loading) {
      return (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
      );
  }

  if (!activeEvent || myPassengers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <GlassCard className="w-full max-w-md border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col max-h-[90vh] p-0 overflow-hidden">
        
        {/* Compact Header */}
        <div className="bg-gradient-to-r from-blue-900/80 to-blue-800/80 p-4 border-b border-white/10 flex justify-between items-center">
            <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    Missão de Transporte
                </h2>
                <p className="text-xs text-blue-200">{activeEvent.titulo} • {new Date(activeEvent.data_inicio).toLocaleDateString()}</p>
            </div>
            <button onClick={onClose} className="bg-white/10 rounded-full p-2 hover:bg-white/20 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Scrollable Passenger List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-[#0f172a]">
            {myPassengers.map((p, idx) => {
                const scale = myScales.find(s => String(s.assistido_id) === String(p.id));
                return (
                    <div key={p.id} className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden shadow-lg relative group">
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500"></div>
                        
                        <div className="p-4 pl-5">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-white leading-tight mb-1">{p.nome_completo}</h3>
                                    
                                    {/* STATUS BADGES INTERACTIVE */}
                                    {scale && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <button 
                                                onClick={() => cycleType(p.id!, scale.tipo)}
                                                className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] px-3 py-1.5 rounded border border-slate-600 uppercase font-bold tracking-wider transition-colors"
                                                title="Clique para alterar Tipo"
                                            >
                                                {scale.tipo === 'Ambos' ? 'IDA/VOLTA' : scale.tipo.toUpperCase()}
                                            </button>
                                            
                                            <button 
                                                onClick={() => cycleStatus(p.id!, scale.status)}
                                                className={`text-[10px] px-3 py-1.5 rounded border uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors ${
                                                scale.status === 'Confirmada' ? 'bg-green-900/40 text-green-400 border-green-500/30 hover:bg-green-900/60' :
                                                scale.status === 'Concluida' ? 'bg-blue-900/40 text-blue-400 border-blue-500/30 hover:bg-blue-900/60' :
                                                scale.status === 'Cancelada' ? 'bg-red-900/40 text-red-400 border-red-500/30 hover:bg-red-900/60' :
                                                'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
                                            }`}
                                                title="Clique para alterar Status"
                                            >
                                                <div className={`w-2 h-2 rounded-full ${
                                                     scale.status === 'Confirmada' ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' :
                                                     scale.status === 'Concluida' ? 'bg-blue-400' :
                                                     scale.status === 'Cancelada' ? 'bg-red-400' :
                                                     'bg-slate-400'
                                                }`} />
                                                {scale.status}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <span className="bg-blue-900/50 text-blue-200 text-[10px] px-2 py-1 rounded border border-blue-500/30 shrink-0 ml-2">
                                    #{idx + 1}
                                </span>
                            </div>
                            
                            <div className="flex items-start gap-2 mb-3 mt-3">
                                <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <div>
                                    <p className="text-sm text-slate-300 leading-tight">{p.endereco_logradouro}, {p.endereco_numero}</p>
                                    <p className="text-xs text-slate-500">{p.endereco_bairro}</p>
                                    {p.ponto_referencia && <p className="text-[10px] text-yellow-500/80 mt-1 italic">Ref: {p.ponto_referencia}</p>}
                                </div>
                            </div>

                            {p.usa_cadeira_rodas && (
                                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-red-300 bg-red-900/20 px-2 py-1 rounded inline-block">
                                    ♿ Usa Cadeira de Rodas
                                </div>
                            )}

                            {/* Action Buttons with W-6 Icons */}
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <button 
                                    onClick={() => openGps(`${p.endereco_logradouro}, ${p.endereco_numero} - ${p.endereco_bairro}, ${p.endereco_cidade}`)}
                                    className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="font-bold text-sm">Abrir GPS</span>
                                </button>
                                
                                <button 
                                    onClick={() => openWhatsapp(p.telefone_principal)}
                                    className="bg-slate-700 hover:bg-slate-600 text-green-400 border border-slate-600 hover:border-green-500/50 py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                    <span className="font-bold text-sm">WhatsApp</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>

        <div className="p-4 bg-[#1e293b] border-t border-white/10">
            <button onClick={onClose} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">
                Confirmar Leitura
            </button>
        </div>

      </GlassCard>
    </div>
  );
};
