
import React, { useState, useEffect } from 'react';
import { LogType, Assistido, Evento, Member, Escala } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { GlassCard } from './GlassCard';

interface EldersModuleProps {
  currentUser: any;
  serverUrl: string;
  onBack: () => void;
  addLog: (type: LogType, message: string, details?: string) => void;
}

const TABS = {
  ELDERS: 'Assistidos',
  EVENTS: 'Eventos',
  TRANSPORT: 'Transporte'
};

// --- HELPER STATUS LOGIC ---
const getEventStatus = (ativo: boolean, dateStr: string) => {
    if (!dateStr) return { label: 'DATA INVÁLIDA', color: 'bg-gray-600', icon: '?' };
    
    const eventDate = new Date(dateStr);
    const now = new Date();
    
    // 1. Prioridade: Se a data já passou -> CONCLUÍDO (Independente se está ativo ou não)
    if (eventDate < now) {
        return { label: 'CONCLUÍDO', color: 'bg-gray-600 text-gray-300 border border-gray-500', icon: '🏁' };
    }
    
    // 2. Se data futura e marcado como ativo -> ATIVO
    if (ativo) {
        return { label: 'ATIVO', color: 'bg-green-600 text-white shadow-lg shadow-green-900/50', icon: '🟢' };
    }
    
    // 3. Se data futura e desmarcado -> AGENDADO
    return { label: 'AGENDADO', color: 'bg-blue-600 text-white shadow-lg shadow-blue-900/50', icon: '📅' };
};

// --- SUB-COMPONENT: ELDER WHATSAPP MODAL ---
interface ElderWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedElders: Assistido[];
}

const ElderWhatsAppModal: React.FC<ElderWhatsAppModalProps> = ({ isOpen, onClose, selectedElders }) => {
    const [messageElder, setMessageElder] = useState('Olá {nome}, a Paz de Cristo! Lembramos da nossa Missa da Saúde no dia...');
    const [messageResp, setMessageResp] = useState('Olá {responsavel}, sou da Pastoral Familiar. Gostaria de confirmar a presença do(a) {nome} na Missa da Saúde.');
    const [sentIds, setSentIds] = useState<Set<string>>(new Set()); // id_tipo (ex: 1_elder, 1_resp)

    if (!isOpen) return null;

    const getLink = (phone: string, text: string) => {
        let nums = phone.replace(/\D/g, '');
        if (nums.length >= 10 && nums.length <= 11) nums = '55' + nums;
        return `https://wa.me/${nums}?text=${encodeURIComponent(text)}`;
    };

    const handleSend = (elder: Assistido, type: 'ELDER' | 'RESP') => {
        let text = '';
        let phone = '';
        const firstName = elder.nome_completo.split(' ')[0];

        if (type === 'ELDER') {
            text = messageElder.replace(/{nome}/g, firstName);
            phone = elder.telefone_principal;
        } else {
            text = messageResp
                .replace(/{nome}/g, elder.nome_completo)
                .replace(/{responsavel}/g, elder.responsavel_nome?.split(' ')[0] || 'Responsável');
            phone = elder.telefone_responsavel || '';
        }

        if (phone) {
            window.open(getLink(phone, text), '_blank');
            setSentIds(prev => new Set(prev).add(`${elder.id}_${type}`));
        } else {
            alert('Telefone não cadastrado.');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <GlassCard className="w-full max-w-4xl h-[85vh] flex flex-col border-green-500/30 p-0 overflow-hidden bg-[#111827]">
                <div className="p-4 border-b border-white/10 bg-green-900/20 flex justify-between items-center">
                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-xl md:text-2xl">📱</span> Disparo WhatsApp ({selectedElders.length})
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2">✕</button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Configuração das Mensagens */}
                    <div className="w-full md:w-1/3 p-4 border-r border-white/10 overflow-y-auto custom-scrollbar bg-black/20">
                        <h4 className="font-bold text-green-400 mb-2 text-xs md:text-sm uppercase">1. Mensagem para o Idoso</h4>
                        <textarea 
                            value={messageElder} 
                            onChange={e => setMessageElder(e.target.value)}
                            className="w-full h-24 md:h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-xs md:text-sm text-white mb-4 focus:border-green-500 outline-none resize-none"
                        />
                        <div className="text-[10px] md:text-xs text-slate-400 mb-6">Variável: {`{nome}`}</div>

                        <h4 className="font-bold text-blue-400 mb-2 text-xs md:text-sm uppercase">2. Mensagem para Responsável</h4>
                        <textarea 
                            value={messageResp} 
                            onChange={e => setMessageResp(e.target.value)}
                            className="w-full h-24 md:h-32 bg-black/40 border border-white/10 rounded-lg p-3 text-xs md:text-sm text-white mb-4 focus:border-blue-500 outline-none resize-none"
                        />
                         <div className="text-[10px] md:text-xs text-slate-400">Variáveis: {`{nome}, {responsavel}`}</div>
                    </div>

                    {/* Lista de Envio */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-[#0f172a]">
                        <h4 className="font-bold text-white mb-4 text-xs md:text-sm uppercase sticky top-0 bg-[#0f172a] py-2 z-10">Lista de Envio</h4>
                        <div className="space-y-3">
                            {selectedElders.map(elder => (
                                <div key={elder.id} className="bg-white/5 border border-white/5 rounded-lg p-3 flex flex-col gap-3">
                                    <div className="flex items-center gap-3 border-b border-white/5 pb-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{elder.nome_completo.charAt(0)}</div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{elder.nome_completo}</div>
                                            <div className="text-xs text-slate-400">Bairro: {elder.endereco_bairro}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {/* Botão Idoso */}
                                        <button 
                                            onClick={() => handleSend(elder, 'ELDER')}
                                            className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${sentIds.has(`${elder.id}_ELDER`) ? 'bg-transparent border border-green-500 text-green-500 opacity-50' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                                        >
                                            {sentIds.has(`${elder.id}_ELDER`) ? 'Enviado' : 'Enviar p/ Idoso'}
                                        </button>

                                        {/* Botão Responsável */}
                                        {elder.telefone_responsavel ? (
                                             <button 
                                                onClick={() => handleSend(elder, 'RESP')}
                                                className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${sentIds.has(`${elder.id}_RESP`) ? 'bg-transparent border border-blue-500 text-blue-500 opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                            >
                                                {sentIds.has(`${elder.id}_RESP`) ? 'Enviado' : `Enviar p/ Resp.`}
                                            </button>
                                        ) : (
                                            <button disabled className="flex-1 py-2 rounded text-xs font-bold bg-gray-700 text-gray-500 cursor-not-allowed">
                                                Sem Resp.
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export const EldersModule: React.FC<EldersModuleProps> = ({ currentUser, serverUrl, onBack, addLog }) => {
  const [activeTab, setActiveTab] = useState<keyof typeof TABS>('ELDERS');
  const API_URL = serverUrl.replace(/\/$/, '');
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', 
    'Bypass-Tunnel-Reminder': 'true'
  };

  // State Stores
  const [assistidos, setAssistidos] = useState<Assistido[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [drivers, setDrivers] = useState<Member[]>([]); // Only with vehicle
  const [loading, setLoading] = useState(false);

  // --- TAB: ELDERS (CRUD) ---
  const [showElderModal, setShowElderModal] = useState(false);
  const [editingElder, setEditingElder] = useState<Assistido | null>(null);
  const [elderForm, setElderForm] = useState<Assistido>(initialElderForm());
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  
  // Selection & WhatsApp
  const [selectedElderIds, setSelectedElderIds] = useState<Set<number>>(new Set());
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  // --- TAB: EVENTS (CRUD & DUPLICATION) ---
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [eventForm, setEventForm] = useState<Evento>(initialEventForm());
  
  // Duplication State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<Evento | null>(null);
  const [newDuplicateDate, setNewDuplicateDate] = useState('');

  // --- TAB: TRANSPORT ---
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [draggedElderId, setDraggedElderId] = useState<number | null>(null);

  function initialElderForm(): Assistido {
    return {
      nome_completo: '', telefone_principal: '', endereco_logradouro: '', endereco_numero: '',
      endereco_bairro: '', endereco_cidade: '', endereco_cep: '', usa_cadeira_rodas: false, ativo: true,
      foto: '', responsavel_nome: '', telefone_responsavel: '', ponto_referencia: '', necessidades_especiais: ''
    };
  }

  function initialEventForm(): Evento {
    return {
      titulo: 'Missa da Saúde',
      data_inicio: new Date().toISOString().slice(0, 16),
      local_nome: 'Paróquia Santa Maria Goretti',
      local_endereco: '',
      ativo: true
    };
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_URL}/api/assistidos`, { headers }),
        fetch(`${API_URL}/api/eventos`, { headers }),
        fetch(`${API_URL}/api/membros`, { headers }) // Need to filter drivers
      ]);
      
      const d1 = await r1.json();
      const d2 = await r2.json();
      const d3 = await r3.json();

      if(Array.isArray(d1)) setAssistidos(d1);
      if(Array.isArray(d2)) setEventos(d2);
      if(Array.isArray(d3)) setDrivers(d3.filter((m: Member) => m.possui_veiculo));

    } catch (e) {
      addLog('error', 'Erro ao carregar dados do módulo', String(e));
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS: ELDER ---
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              setCompressingPhoto(true);
              const compressed = await compressImage(file);
              setElderForm(prev => ({ ...prev, foto: compressed }));
          } catch (err) {
              alert('Erro ao processar foto');
          } finally {
              setCompressingPhoto(false);
          }
      }
  };

  const fetchCep = async (cep: string) => {
      const cleanCep = cep.replace(/\D/g, '');
      if (cleanCep.length !== 8) return;
      
      setCepLoading(true);
      try {
          const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await res.json();
          if (!data.erro) {
              setElderForm(prev => ({
                  ...prev,
                  endereco_logradouro: data.logradouro,
                  endereco_bairro: data.bairro,
                  endereco_cidade: data.localidade,
                  // Mantém o número se já tiver digitado
              }));
          } else {
              alert('CEP não encontrado.');
          }
      } catch (error) {
          console.error(error);
      } finally {
          setCepLoading(false);
      }
  };

  const saveElder = async () => {
    try {
      const method = editingElder ? 'PUT' : 'POST';
      const url = editingElder ? `${API_URL}/api/assistidos/${editingElder.id}` : `${API_URL}/api/assistidos`;
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(elderForm) });
      if(res.ok) {
        addLog('success', `Assistido ${editingElder ? 'atualizado' : 'cadastrado'}!`);
        setShowElderModal(false);
        fetchData();
      } else throw new Error('Falha ao salvar');
    } catch(e) { addLog('error', 'Erro ao salvar assistido', String(e)); }
  };

  const deleteElder = async (id: number) => {
    if(!confirm('Excluir este assistido?')) return;
    try {
       await fetch(`${API_URL}/api/assistidos/${id}`, { method: 'DELETE', headers });
       fetchData();
    } catch(e) { console.error(e); }
  };

  const handleToggleSelectElder = (id: number) => {
      setSelectedElderIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleSelectAllElders = () => {
      if (selectedElderIds.size === assistidos.length) setSelectedElderIds(new Set());
      else setSelectedElderIds(new Set(assistidos.map(a => a.id!)));
  };

  // --- ACTIONS: MAPS ---
  const openGoogleMaps = (elder: Assistido) => {
      const fullAddress = `${elder.endereco_logradouro}, ${elder.endereco_numero} - ${elder.endereco_bairro}, ${elder.endereco_cidade}`;
      const encoded = encodeURIComponent(fullAddress);
      // Opens Google Maps in Directions mode from current location
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank');
  };

  const handlePrintGeneralList = () => {
      const html = `
        <html>
            <head>
                <title>Relatório Geral de Assistidos</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; font-size: 12px; }
                    h1 { color: #1e3a8a; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #eee; text-align: left; padding: 8px; border-bottom: 2px solid #aaa; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .chair { color: red; font-weight: bold; }
                    .resp { color: #666; font-style: italic; }
                    @media print { th { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <h1>Relatório Geral de Assistidos (${assistidos.length})</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>Endereço</th>
                            <th>Bairro</th>
                            <th>Responsável</th>
                            <th>Obs.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assistidos.map(a => `
                            <tr>
                                <td><strong>${a.nome_completo}</strong> ${a.usa_cadeira_rodas ? '<span class="chair">[CADEIRA]</span>' : ''}</td>
                                <td>${a.telefone_principal}</td>
                                <td>${a.endereco_logradouro}, ${a.endereco_numero}</td>
                                <td>${a.endereco_bairro}</td>
                                <td>
                                    ${a.responsavel_nome ? `<div>${a.responsavel_nome}</div><div class="resp">${a.telefone_responsavel || ''}</div>` : '-'}
                                </td>
                                <td>${a.necessidades_especiais || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>window.print()</script>
            </body>
        </html>
      `;
      const win = window.open('', '_blank');
      win?.document.write(html);
      win?.document.close();
  };

  // --- ACTIONS: EVENT ---
  const saveEvent = async () => {
    try {
      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? `${API_URL}/api/eventos/${editingEvent.id}` : `${API_URL}/api/eventos`;

      const res = await fetch(url, { method, headers, body: JSON.stringify(eventForm) });
      if(res.ok) {
        addLog('success', `Evento ${editingEvent ? 'atualizado' : 'criado'}!`);
        setShowEventModal(false);
        fetchData();
      }
    } catch(e) { console.error(e); }
  };

  const deleteEvent = async (id: number) => {
    if(!confirm('Tem certeza que deseja EXCLUIR este evento?')) return;
    try {
        await fetch(`${API_URL}/api/eventos/${id}`, { method: 'DELETE', headers });
        addLog('success', 'Evento excluído');
        fetchData();
    } catch(e) { console.error(e); }
  };

  // --- ACTIONS: SHARE EVENT ---
  const handleShareEvent = (ev: Evento) => {
      const text = `*PASTORAL FAMILIAR - CONVITE* ✝️\n\n` +
                   `📅 *Evento:* ${ev.titulo}\n` +
                   `🗓️ *Data:* ${new Date(ev.data_inicio).toLocaleString('pt-BR')}\n` +
                   `📍 *Local:* ${ev.local_nome}\n` +
                   (ev.local_endereco ? `🗺️ *Endereço:* ${ev.local_endereco}\n` : '') +
                   `\nContamos com sua presença!`;
      
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // --- DUPLICATE EVENT LOGIC ---
  const openDuplicateModal = (event: Evento) => {
      setEventToDuplicate(event);
      setNewDuplicateDate('');
      setDuplicateModalOpen(true);
  };

  const executeDuplicate = async () => {
      if(!eventToDuplicate || !newDuplicateDate) return alert('Selecione uma data para o novo evento.');
      
      try {
          addLog('info', 'Duplicando evento e escalas...');
          const res = await fetch(`${API_URL}/api/eventos/${eventToDuplicate.id}/duplicate`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ new_date: newDuplicateDate })
          });
          
          if(res.ok) {
              addLog('success', 'Evento duplicado com sucesso!');
              setDuplicateModalOpen(false);
              fetchData();
          } else {
              const err = await res.json();
              throw new Error(err.error || 'Erro ao duplicar');
          }
      } catch(e) {
          addLog('error', 'Falha na duplicação', String(e));
          alert('Erro ao duplicar evento. Verifique se a Stored Procedure foi criada no banco (Veja Configuração do Servidor).');
      }
  };

  // --- ACTIONS: TRANSPORT ---
  const loadEscalas = async (eventId: number) => {
    setSelectedEventId(eventId);
    try {
      const res = await fetch(`${API_URL}/api/escalas/${eventId}`, { headers });
      const data = await res.json();
      if(Array.isArray(data)) setEscalas(data);
    } catch(e) { console.error(e); }
  };

  const handleAutoMatch = () => {
    if(!selectedEventId) return;
    const newEscalas: Escala[] = [];
    const unassignedElders = assistidos.filter(a => a.ativo && !escalas.find(e => String(e.assistido_id) === String(a.id)));
    
    // Group elders by Bairro
    const byBairro: {[key:string]: Assistido[]} = {};
    unassignedElders.forEach(e => {
        const b = e.endereco_bairro || 'Outros';
        if(!byBairro[b]) byBairro[b] = [];
        byBairro[b].push(e);
    });

    const availableDrivers = [...drivers]; // Copy

    // Simple matching: Try to match Driver Bairro with Elder Bairro
    availableDrivers.forEach(driver => {
        // Find elders in same bairro
        let candidates = byBairro[driver.bairro] || [];
        
        // If no candidates in same bairro, take from 'Outros' or any large pile
        if(candidates.length === 0) {
             const biggestPile = Object.keys(byBairro).sort((a,b) => byBairro[b].length - byBairro[a].length)[0];
             if(biggestPile) candidates = byBairro[biggestPile];
        }

        // Assign up to 3
        const toAssign = candidates.splice(0, 3);
        
        toAssign.forEach(elder => {
             newEscalas.push({
                 evento_id: selectedEventId,
                 motorista_id: driver.id!,
                 assistido_id: elder.id!,
                 status: 'Planejada',
                 tipo: 'Ambos'
             });
        });
    });

    const finalEscalas = [...escalas, ...newEscalas];
    setEscalas(finalEscalas);
    saveEscalasBatch(finalEscalas);
  };

  const saveEscalasBatch = async (data: Escala[]) => {
    if(!selectedEventId) return;
    try {
        await fetch(`${API_URL}/api/escalas/batch`, { 
            method: 'POST', headers, 
            body: JSON.stringify({ evento_id: selectedEventId, escalas: data }) 
        });
        addLog('success', 'Escalas salvas com sucesso!');
    } catch(e) {
        addLog('error', 'Erro ao salvar escalas');
    }
  };

  const onDropElder = (motoristaId: number) => {
      if(!draggedElderId || !selectedEventId) return;
      
      const filtered = escalas.filter(e => String(e.assistido_id) !== String(draggedElderId));
      
      const newAssignment: Escala = {
          evento_id: selectedEventId,
          motorista_id: motoristaId,
          assistido_id: draggedElderId,
          status: 'Planejada',
          tipo: 'Ambos'
      };
      
      const updated = [...filtered, newAssignment];
      setEscalas(updated);
      saveEscalasBatch(updated);
      setDraggedElderId(null);
  };

  const onUnassignElder = (assistidoId: number) => {
      if(!selectedEventId) return;
      const filtered = escalas.filter(e => String(e.assistido_id) !== String(assistidoId));
      setEscalas(filtered);
      saveEscalasBatch(filtered);
  };

  const updateEscalaStatus = (assistidoId: number, status: string) => {
      const updated = escalas.map(e => String(e.assistido_id) === String(assistidoId) ? { ...e, status: status as any } : e);
      setEscalas(updated);
      saveEscalasBatch(updated);
  };

  const updateEscalaTipo = (assistidoId: number, tipo: string) => {
      const updated = escalas.map(e => String(e.assistido_id) === String(assistidoId) ? { ...e, tipo: tipo as any } : e);
      setEscalas(updated);
      saveEscalasBatch(updated);
  };

  const generateManifestHTML = (driverId: number, eventId: number) => {
      const driver = drivers.find(d => String(d.id) === String(driverId));
      // Comparison fix: convert to String to ensure "123" == 123
      const myPassengers = escalas.filter(e => String(e.motorista_id) === String(driverId) && String(e.evento_id) === String(eventId))
          .map(e => assistidos.find(a => String(a.id) === String(e.assistido_id))).filter(Boolean) as Assistido[];
      
      if(!driver || myPassengers.length === 0) return '';
      
      const event = eventos.find(e => String(e.id) === String(eventId));

      return `
        <div class="page-break">
            <div style="border: 2px solid #000; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #1e3a8a;">🚙 Motorista: ${driver.nome_completo}</h1>
                <p style="margin: 5px 0;"><strong>Telefone:</strong> ${driver.telefone} | <strong>Veículo:</strong> ${driver.modelo_veiculo || 'N/D'}</p>
                <p style="margin: 5px 0; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
                    <strong>Evento:</strong> ${event?.titulo} - ${new Date(event?.data_inicio || '').toLocaleString()}
                    <br/><strong>Local:</strong> ${event?.local_nome}
                </p>
                
                <h2 style="margin-top: 15px;">Passageiros (${myPassengers.length})</h2>
                ${myPassengers.map(p => {
                    const esc = escalas.find(e => String(e.assistido_id) === String(p.id) && String(e.evento_id) === String(eventId));
                    return `
                    <div style="border: 1px solid #999; padding: 10px; margin-bottom: 10px; border-radius: 6px; background: #f9f9f9;">
                        <h3 style="margin: 0; font-size: 16px;">
                            ${p.nome_completo} 
                            ${p.usa_cadeira_rodas ? '<span style="color:red; border:1px solid red; padding:0 3px;">CADEIRANTE</span>' : ''}
                        </h3>
                        <div style="font-size: 12px; font-weight: bold; color: #555; margin: 5px 0;">
                            TIPO: ${esc?.tipo?.toUpperCase()} | STATUS: ${esc?.status?.toUpperCase()}
                        </div>
                        <p style="margin: 3px 0;">📍 ${p.endereco_logradouro}, ${p.endereco_numero} - ${p.endereco_bairro}</p>
                        <p style="margin: 3px 0;">📞 <strong>${p.telefone_principal}</strong></p>
                        ${p.responsavel_nome ? `<p style="margin: 3px 0; color: #666;">👤 Resp: ${p.responsavel_nome} (${p.telefone_responsavel || '-'})</p>` : ''}
                        ${p.ponto_referencia ? `<p style="margin: 3px 0; font-style: italic;">Ref: ${p.ponto_referencia}</p>` : ''}
                    </div>
                `}).join('')}
            </div>
        </div>
      `;
  };

  const handlePrintManifest = (driverId: number) => {
      if(!selectedEventId) return;
      const content = generateManifestHTML(driverId, selectedEventId);
      if(!content) return alert('Sem passageiros.');
      
      const win = window.open('', '_blank');
      win?.document.write(`<html><head><title>Roteiro</title></head><body>${content}<script>window.print()</script></body></html>`);
      win?.document.close();
  };

  const handlePrintAllManifests = () => {
      if(!selectedEventId) return;
      
      // Filter robustness: convert IDs to String for comparison
      const activeDrivers = drivers.filter(d => 
        escalas.some(e => String(e.motorista_id) === String(d.id) && String(e.evento_id) === String(selectedEventId))
      );
      
      if(activeDrivers.length === 0) return alert('Nenhuma escala definida para este evento.');

      const allContent = activeDrivers.map(d => generateManifestHTML(d.id!, selectedEventId!)).join('<hr style="border:0; border-bottom:1px dashed #ccc; margin: 20px 0;" />');

      const html = `
        <html>
            <head>
                <title>Roteiros Completos</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .page-break { page-break-after: always; }
                    @media print { .page-break { page-break-after: always; } hr { display: none; } }
                </style>
            </head>
            <body>
                ${allContent}
                <script>window.print()</script>
            </body>
        </html>
      `;
      const win = window.open('', '_blank');
      win?.document.write(html);
      win?.document.close();
  };

  const formatPhone = (p: string) => p ? p.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3') : '-';

  return (
    <div className="flex flex-col h-full bg-[#111827] text-slate-100 font-sans overflow-hidden">
      
      {/* WHATSAPP MODAL */}
      <ElderWhatsAppModal 
        isOpen={showWhatsApp} 
        onClose={() => setShowWhatsApp(false)}
        selectedElders={assistidos.filter(a => selectedElderIds.has(a.id!))}
      />

      {/* Header */}
      <div className="h-16 bg-[#1f2937] border-b border-gray-700 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
         <div className="flex items-center gap-2 md:gap-3">
             <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-blue-300 transition-all">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <h1 className="text-lg md:text-xl font-bold text-white">Missa da Saúde</h1>
         </div>
         <div className="flex gap-2">
            {Object.entries(TABS).map(([key, label]) => (
                <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-lg transition-colors ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    {label}
                </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 md:p-6 relative">
        
        {/* --- TAB: ELDERS --- */}
        {activeTab === 'ELDERS' && (
           <div className="h-full flex flex-col">
              <div className="flex flex-col md:flex-row justify-between mb-4 items-center gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-white">Assistidos ({assistidos.length})</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-400 border-l border-gray-700 pl-4">
                            <input type="checkbox" onChange={handleSelectAllElders} checked={selectedElderIds.size > 0 && selectedElderIds.size === assistidos.length} />
                            Todos
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                      {selectedElderIds.size > 0 && (
                          <button onClick={() => setShowWhatsApp(true)} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow text-xs md:text-sm flex items-center gap-2 animate-fade-in whitespace-nowrap">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                              Zap ({selectedElderIds.size})
                          </button>
                      )}
                      
                      <button onClick={handlePrintGeneralList} className="px-3 py-2 md:px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg shadow font-bold flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir
                      </button>

                      <button onClick={() => { setEditingElder(null); setElderForm(initialElderForm()); setShowElderModal(true); }} className="px-3 py-2 md:px-4 bg-green-600 text-white rounded-lg shadow hover:bg-green-500 font-bold flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> 
                        Novo
                      </button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1f2937] rounded-xl border border-gray-700">
                  <table className="w-full text-left text-xs md:text-sm">
                      <thead className="bg-[#374151] text-gray-300 border-b border-gray-600">
                          <tr>
                              <th className="p-2 md:p-4 w-10">
                                  <input type="checkbox" onChange={handleSelectAllElders} checked={selectedElderIds.size > 0 && selectedElderIds.size === assistidos.length} />
                              </th>
                              <th className="p-2 md:p-4">Foto</th>
                              <th className="p-2 md:p-4">Nome</th>
                              <th className="hidden md:table-cell p-4">Responsável</th>
                              <th className="hidden md:table-cell p-4">Bairro</th>
                              <th className="p-2 md:p-4">Telefone</th>
                              <th className="p-2 md:p-4 text-center">Cadeira</th>
                              <th className="p-2 md:p-4 text-center">Ações</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                          {assistidos.map(a => (
                              <tr key={a.id} className={`hover:bg-white/5 transition-colors ${selectedElderIds.has(a.id!) ? 'bg-blue-900/10' : ''}`}>
                                  <td className="p-2 md:p-4">
                                      <input type="checkbox" checked={selectedElderIds.has(a.id!)} onChange={() => handleToggleSelectElder(a.id!)} />
                                  </td>
                                  <td className="p-2 md:p-4">
                                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-600 overflow-hidden border border-gray-500">
                                          {a.foto ? <img src={a.foto} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[8px] md:text-xs">Foto</div>}
                                      </div>
                                  </td>
                                  <td className="p-2 md:p-4 font-medium max-w-[120px] truncate md:max-w-none">{a.nome_completo}</td>
                                  <td className="hidden md:table-cell p-4">
                                      {a.responsavel_nome ? (
                                        <div className="text-xs">
                                            <p className="font-bold text-gray-300">{a.responsavel_nome}</p>
                                            <p className="text-gray-500">{formatPhone(a.telefone_responsavel || '')}</p>
                                        </div>
                                      ) : <span className="text-gray-600">-</span>}
                                  </td>
                                  <td className="hidden md:table-cell p-4">{a.endereco_bairro}</td>
                                  <td className="p-2 md:p-4 text-gray-400 text-xs">{formatPhone(a.telefone_principal)}</td>
                                  <td className="p-2 md:p-4 text-center">{a.usa_cadeira_rodas ? '♿' : '-'}</td>
                                  <td className="p-2 md:p-4 text-center">
                                      <div className="flex justify-center gap-2">
                                        <button onClick={() => openGoogleMaps(a)} className="text-green-400 hover:text-white" title="Abrir GPS">
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </button>
                                        <button onClick={() => { setEditingElder(a); setElderForm(a); setShowElderModal(true); }} className="text-blue-400 hover:text-white" title="Editar">✏️</button>
                                        <button onClick={() => deleteElder(a.id!)} className="text-red-400 hover:text-white" title="Excluir">🗑️</button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
           </div>
        )}

        {/* --- TAB: EVENTS --- */}
        {activeTab === 'EVENTS' && (
           <div className="h-full flex flex-col">
              <div className="flex justify-between mb-4 items-center">
                  <h2 className="text-lg font-bold text-white">Eventos Agendados</h2>
                  <button onClick={() => { setEditingEvent(null); setEventForm(initialEventForm()); setShowEventModal(true); }} className="px-3 py-2 md:px-4 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-500 font-bold flex items-center gap-2 text-xs md:text-sm">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg> Novo Evento
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pb-20">
                  {eventos.map(ev => {
                      const status = getEventStatus(ev.ativo, ev.data_inicio);
                      return (
                        <div key={ev.id} className="bg-[#1f2937] border border-gray-700 rounded-xl p-4 md:p-6 relative group hover:border-indigo-500 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 md:p-3 bg-indigo-900/30 rounded-lg text-indigo-300">
                                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <span className={`px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold shadow-sm ${status.color} flex items-center gap-1`}>
                                    <span>{status.icon}</span> {status.label}
                                </span>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-white mb-1">{ev.titulo}</h3>
                            <p className="text-xs md:text-sm text-gray-400 mb-3">{new Date(ev.data_inicio).toLocaleString()}</p>
                            <p className="text-xs md:text-sm text-gray-300 mb-2 flex items-center gap-1">📍 {ev.local_nome}</p>
                            
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                                <button onClick={() => { setEditingEvent(ev); setEventForm(ev); setShowEventModal(true); }} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs md:text-sm font-bold">Editar</button>
                                
                                {/* WhatsApp Share Button */}
                                <button onClick={() => handleShareEvent(ev)} className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded text-white" title="Compartilhar no WhatsApp">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                </button>

                                <button onClick={() => openDuplicateModal(ev)} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white" title="Duplicar Evento (Copia Escalas)">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                </button>
                                <button onClick={() => deleteEvent(ev.id!)} className="px-3 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded">🗑️</button>
                            </div>
                        </div>
                      );
                  })}
              </div>
           </div>
        )}

        {/* --- TAB: TRANSPORT --- */}
        {activeTab === 'TRANSPORT' && (
           <div className="h-full flex flex-col gap-4">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-[#1f2937] p-4 rounded-xl border border-gray-700 gap-4">
                  <div className="flex flex-col w-full md:w-auto gap-1">
                      <label className="text-xs font-bold text-gray-400">Selecione o Evento:</label>
                      <select 
                          className="bg-black/30 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 w-full md:w-64"
                          onChange={(e) => loadEscalas(Number(e.target.value))}
                          value={selectedEventId || ''}
                      >
                          <option value="">Selecione...</option>
                          {eventos.filter(e => e.ativo).map(e => <option key={e.id} value={e.id}>{e.titulo} - {new Date(e.data_inicio).toLocaleDateString()}</option>)}
                      </select>
                  </div>
                  {selectedEventId && (
                      <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={handleAutoMatch} className="flex-1 md:flex-none px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded font-bold text-xs md:text-sm shadow flex items-center justify-center gap-2">
                             ⚡ Alocação Automática
                          </button>
                          <button onClick={handlePrintAllManifests} className="flex-1 md:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-xs md:text-sm shadow flex items-center justify-center gap-2">
                             🖨️ Roteiros
                          </button>
                      </div>
                  )}
              </div>

              {selectedEventId ? (
                <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-y-auto">
                    {/* Left: Unassigned Elders */}
                    <div className="w-full md:w-1/4 bg-[#1f2937] rounded-xl border border-gray-700 flex flex-col shrink-0 h-48 md:h-auto">
                        <div className="p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                            <h3 className="font-bold text-gray-300 text-sm">Não Alocados</h3>
                            <p className="text-[10px] text-gray-500">Arraste para um motorista</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {assistidos.filter(a => a.ativo && !escalas.find(e => String(e.assistido_id) === String(a.id))).map(elder => (
                                <div 
                                    key={elder.id} 
                                    draggable
                                    onDragStart={() => setDraggedElderId(elder.id!)}
                                    className="p-2 md:p-3 bg-slate-800 border border-gray-600 rounded cursor-grab active:cursor-grabbing hover:border-blue-500 transition-colors shadow-sm"
                                >
                                    <div className="flex justify-between">
                                        <p className="text-xs md:text-sm font-bold text-white">{elder.nome_completo}</p>
                                        {elder.usa_cadeira_rodas && <span className="text-xs" title="Cadeirante">♿</span>}
                                    </div>
                                    <p className="text-[10px] text-gray-400">{elder.endereco_bairro}</p>
                                </div>
                            ))}
                            {assistidos.filter(a => a.ativo && !escalas.find(e => String(e.assistido_id) === String(a.id))).length === 0 && (
                                <div className="text-center text-xs text-gray-600 py-4">Todos alocados!</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Drivers & Allocation */}
                    <div className="flex-1 bg-[#1f2937] rounded-xl border border-gray-700 flex flex-col min-h-0">
                         <div className="p-3 border-b border-gray-700 bg-gray-800/50 rounded-t-xl flex justify-between">
                            <h3 className="font-bold text-gray-300 text-sm">Frota Disponível</h3>
                            <span className="text-xs text-blue-400">Viagens: {escalas.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 md:p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 custom-scrollbar">
                            {drivers.map(driver => {
                                const driverEscalas = escalas.filter(e => String(e.motorista_id) === String(driver.id));
                                return (
                                    <div 
                                        key={driver.id}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => onDropElder(driver.id!)}
                                        className={`border rounded-xl p-3 flex flex-col gap-2 transition-colors ${driverEscalas.length > 0 ? 'bg-blue-900/10 border-blue-500/30' : 'bg-slate-800/50 border-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                                                {driver.nome_completo.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs md:text-sm text-white truncate">{driver.nome_completo}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{driver.modelo_veiculo || 'Veículo N/D'}</p>
                                            </div>
                                            <button onClick={() => handlePrintManifest(driver.id!)} className="p-2 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 rounded-lg transition-colors" title="Imprimir Roteiro Individual">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                        </div>

                                        <div className="space-y-1 min-h-[50px]">
                                            {driverEscalas.map(esc => {
                                                const pass = assistidos.find(a => String(a.id) === String(esc.assistido_id));
                                                if(!pass) return null;
                                                return (
                                                    <div key={esc.id || pass.id} className="bg-black/30 p-2 rounded text-xs flex flex-col gap-1 relative group">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-1 overflow-hidden">
                                                                <span className="font-bold text-gray-200 truncate">{pass.nome_completo} {pass.usa_cadeira_rodas && '♿'}</span>
                                                                <button onClick={() => openGoogleMaps(pass)} className="p-1.5 text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 rounded-md shrink-0 transition-colors" title="GPS Rota">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                </button>
                                                            </div>
                                                            <button 
                                                                onClick={() => onUnassignElder(pass.id!)}
                                                                className="p-1.5 text-red-500 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                                                                title="Remover Passageiro"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <select 
                                                                value={esc.tipo}
                                                                onChange={(e) => updateEscalaTipo(pass.id!, e.target.value)}
                                                                className="bg-slate-700 text-[9px] md:text-[10px] rounded px-1 border-0 focus:ring-1 focus:ring-blue-500 w-16"
                                                            >
                                                                <option value="Ambos">Ida/Volta</option>
                                                                <option value="Ida">Só Ida</option>
                                                                <option value="Volta">Só Volta</option>
                                                            </select>
                                                            <select 
                                                                value={esc.status}
                                                                onChange={(e) => updateEscalaStatus(pass.id!, e.target.value)}
                                                                className={`flex-1 text-[9px] md:text-[10px] rounded px-1 border-0 focus:ring-1 ${esc.status === 'Confirmada' ? 'bg-green-900 text-green-300' : 'bg-slate-700'}`}
                                                            >
                                                                <option value="Planejada">Planejada</option>
                                                                <option value="Confirmada">Confirmada</option>
                                                                <option value="Cancelada">Cancelada</option>
                                                                <option value="Concluida">Concluída</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {driverEscalas.length === 0 && <div className="text-center text-[10px] text-gray-600 py-2">Arraste aqui</div>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                      Selecione um evento para gerenciar o transporte.
                  </div>
              )}
           </div>
        )}
      </div>

      {/* MODAL: ASSISTIDO */}
      {showElderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#1f2937] border border-gray-600 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-4 md:p-6 shadow-2xl">
                  <h2 className="text-lg md:text-xl font-bold text-white mb-6 border-b border-gray-700 pb-2">{editingElder ? 'Editar Assistido' : 'Novo Assistido'}</h2>
                  <div className="space-y-4">
                      <div className="flex gap-4 items-start">
                          <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-700 rounded-lg flex-shrink-0 relative overflow-hidden group border border-gray-600">
                              {elderForm.foto ? (
                                  <img src={elderForm.foto} className="w-full h-full object-cover"/>
                              ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-gray-400">Sem Foto</div>
                              )}
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                              {compressingPhoto && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white">...</div>}
                          </div>
                          <div className="flex-1 space-y-4">
                             <input type="text" placeholder="Nome Completo" value={elderForm.nome_completo} onChange={e => setElderForm({...elderForm, nome_completo: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                             <input type="date" placeholder="Data Nasc (YYYY-MM-DD)" value={elderForm.data_nascimento || ''} onChange={e => setElderForm({...elderForm, data_nascimento: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="Nome Responsável" value={elderForm.responsavel_nome || ''} onChange={e => setElderForm({...elderForm, responsavel_nome: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                          <input type="text" placeholder="Tel. Responsável" value={elderForm.telefone_responsavel || ''} onChange={e => setElderForm({...elderForm, telefone_responsavel: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input type="text" placeholder="Telefone Principal" value={elderForm.telefone_principal} onChange={e => setElderForm({...elderForm, telefone_principal: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                          <div className="relative">
                            <input 
                                type="text" 
                                placeholder="CEP (Busca Automática)" 
                                value={elderForm.endereco_cep} 
                                onChange={e => {
                                    setElderForm({...elderForm, endereco_cep: e.target.value});
                                    if(e.target.value.replace(/\D/g,'').length === 8) fetchCep(e.target.value);
                                }} 
                                className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white pr-8 text-sm" 
                            />
                            {cepLoading && <div className="absolute right-2 top-2.5 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                          </div>
                      </div>
                      
                      <input type="text" placeholder="Logradouro" value={elderForm.endereco_logradouro} onChange={e => setElderForm({...elderForm, endereco_logradouro: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" disabled={cepLoading} />
                      
                      <div className="grid grid-cols-3 gap-4">
                          <input type="text" placeholder="Número" value={elderForm.endereco_numero} onChange={e => setElderForm({...elderForm, endereco_numero: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                          <input type="text" placeholder="Bairro" value={elderForm.endereco_bairro} onChange={e => setElderForm({...elderForm, endereco_bairro: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" disabled={cepLoading} />
                          <input type="text" placeholder="Cidade" value={elderForm.endereco_cidade} onChange={e => setElderForm({...elderForm, endereco_cidade: e.target.value})} className="p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" disabled={cepLoading} />
                      </div>
                      
                      <input type="text" placeholder="Ponto de Referência" value={elderForm.ponto_referencia || ''} onChange={e => setElderForm({...elderForm, ponto_referencia: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white text-sm" />
                      <textarea placeholder="Necessidades Especiais" value={elderForm.necessidades_especiais || ''} onChange={e => setElderForm({...elderForm, necessidades_especiais: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white h-20 text-sm"></textarea>
                      
                      <label className="flex items-center gap-2 text-white text-sm">
                          <input type="checkbox" checked={elderForm.usa_cadeira_rodas} onChange={e => setElderForm({...elderForm, usa_cadeira_rodas: e.target.checked})} className="w-5 h-5 rounded bg-gray-700 border-gray-600" />
                          Usa Cadeira de Rodas?
                      </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowElderModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm">Cancelar</button>
                      <button onClick={saveElder} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 font-bold text-sm">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: EVENTO */}
      {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#1f2937] border border-gray-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-6">{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h2>
                  <div className="space-y-4">
                      <input type="text" placeholder="Título" value={eventForm.titulo} onChange={e => setEventForm({...eventForm, titulo: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white" />
                      <input type="datetime-local" value={eventForm.data_inicio} onChange={e => setEventForm({...eventForm, data_inicio: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white" />
                      <input type="text" placeholder="Nome do Local" value={eventForm.local_nome} onChange={e => setEventForm({...eventForm, local_nome: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white" />
                      <input type="text" placeholder="Endereço Local" value={eventForm.local_endereco || ''} onChange={e => setEventForm({...eventForm, local_endereco: e.target.value})} className="w-full p-2 bg-black/20 border border-gray-600 rounded text-white" />
                      
                      {/* STATUS CONTROL PANEL */}
                      <div className="bg-black/20 p-3 rounded-lg border border-white/10 flex items-center justify-between">
                          <label className="flex items-center gap-3 text-white cursor-pointer select-none">
                              <div className="relative">
                                  <input type="checkbox" checked={eventForm.ativo} onChange={e => setEventForm({...eventForm, ativo: e.target.checked})} className="sr-only peer" />
                                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                              </div>
                              <span className="text-sm font-medium">Evento Ativo (Principal)</span>
                          </label>
                          
                          {/* Calculated Status Badge */}
                          {(() => {
                              const status = getEventStatus(eventForm.ativo, eventForm.data_inicio);
                              return (
                                  <div className={`px-3 py-1 rounded text-xs font-bold ${status.color} flex items-center gap-1`}>
                                      {status.icon} {status.label}
                                  </div>
                              )
                          })()}
                      </div>
                      
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button onClick={() => setShowEventModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Cancelar</button>
                      <button onClick={saveEvent} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-bold">Salvar</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: DUPLICAÇÃO DE EVENTO */}
      {duplicateModalOpen && eventToDuplicate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <GlassCard className="w-full max-w-sm border-yellow-500/30">
                  <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                      Duplicar Evento
                  </h2>
                  <p className="text-sm text-gray-300 mb-6">
                      Você está duplicando <strong>"{eventToDuplicate.titulo}"</strong>. 
                      Isso criará uma cópia com todas as escalas e passageiros, mas com status <em>Inativo</em> e <em>Planejado</em>.
                  </p>
                  
                  <div className="mb-6">
                      <label className="text-xs font-bold text-yellow-500 block mb-1">DATA E HORA DO NOVO EVENTO</label>
                      <input 
                          type="datetime-local" 
                          value={newDuplicateDate}
                          onChange={(e) => setNewDuplicateDate(e.target.value)}
                          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3 text-white focus:border-yellow-500 outline-none"
                      />
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => setDuplicateModalOpen(false)} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white font-bold">Cancelar</button>
                      <button onClick={executeDuplicate} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white font-bold">Confirmar</button>
                  </div>
              </GlassCard>
          </div>
      )}

    </div>
  );
};
