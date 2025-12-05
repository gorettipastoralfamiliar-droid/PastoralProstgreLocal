
import React, { useState, useEffect } from 'react';
import { Member, ViewState, LogType } from '../types';
import { WhatsAppModal } from './WhatsAppModal';
import JSZip from 'jszip';

interface AgentDashboardProps {
  currentUser: any;
  serverUrl: string;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  addLog: (type: LogType, message: string, details?: string) => void;
  onEdit: (agent: Member) => void;
  onOpenDriverModal: () => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, serverUrl, onLogout, onNavigate, addLog, onEdit, onOpenDriverModal }) => {
  const [agents, setAgents] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Export Loading State
  const [isExporting, setIsExporting] = useState(false);
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  
  // Visual Feedback for Editing
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('Todos');
  const [filterCivil, setFilterCivil] = useState('Todos');
  const [filterFuncao, setFilterFuncao] = useState('Todas');

  const API_URL = serverUrl.replace(/\/$/, '');

  const isRestrictedView = currentUser?.funcao === 'Agente';
  const canViewReports = currentUser?.funcao !== 'Agente';

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    addLog('info', 'Buscando agentes...', `GET ${API_URL}/api/membros`);
    
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/membros`, { 
          mode: 'cors',
          headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true', 
              'Bypass-Tunnel-Reminder': 'true'
          }
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        if (text.includes('<!DOCTYPE html>')) {
             throw new Error("O endpoint retornou HTML (Provavelmente erro do Ngrok).");
        }
        throw new Error(`Servidor retornou erro ${response.status}: ${text}`);
      }

      try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
              setAgents(data);
          } else {
              throw new Error("O servidor retornou dados, mas não é uma lista (Array).");
          }
      } catch (jsonErr) {
          throw new Error("Erro ao ler JSON. O servidor pode ter enviado texto plano.");
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      let friendlyMsg = msg;
      
      if (msg.includes('Failed to fetch')) {
        const isMixedContent = window.location.protocol === 'https:' && API_URL.startsWith('http:');
        friendlyMsg = isMixedContent 
            ? "Falha de Conexão (Mixed Content): Seu navegador bloqueou o acesso porque o site é HTTPS e o servidor é HTTP. Use o Ngrok ou acesse via localhost."
            : "Falha de Conexão: O servidor não respondeu. Verifique se ele está rodando e se o IP está correto.";
      }
      
      setError(friendlyMsg);
      addLog('error', 'Falha ao buscar agentes', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId?: number) => {
    if (!agentId) return;
    if (!confirm('Tem certeza que deseja EXCLUIR este agente?')) return;

    try {
        const response = await fetch(`${API_URL}/api/membros/${agentId}`, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true'
            }
        });

        if (response.ok) {
            addLog('success', `Agente ${agentId} deletado.`);
            setAgents(prev => prev.filter(a => a.id !== agentId));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(agentId);
                return next;
            });
        } else {
            throw new Error(`Erro ${response.status}`);
        }
    } catch (error) {
        alert('Erro ao excluir: ' + error);
        addLog('error', 'Erro ao excluir agente', String(error));
    }
  };

  const handleEditClick = (agent: Member) => {
      if (!agent.id) return;
      setEditingId(agent.id);
      setTimeout(() => {
          onEdit(agent);
      }, 300);
  };

  const handleExportCSV = () => {
      if (filteredAgents.length === 0) return;

      const headers = ['ID', 'Nome', 'Login', 'Telefone', 'Email', 'Estado Civil', 'Setor', 'Função', 'Paróquia'];
      const csvContent = [
          headers.join(','),
          ...filteredAgents.map(a => [
              a.id,
              `"${a.nome_completo}"`,
              a.login,
              a.telefone,
              a.email,
              a.estado_civil,
              a.setor,
              a.funcao,
              a.paroquia
          ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `agentes_pastoral_${new Date().toLocaleDateString()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- Photos Export Logic (ZIP) ---
  const handleExportPhotos = async () => {
      const agentsToExport = filteredAgents.filter(a => a.foto && a.foto.trim().length > 0);

      if (agentsToExport.length === 0) {
          alert("Nenhum agente com foto encontrada para exportação.");
          return;
      }

      if(!confirm(`Deseja baixar um arquivo ZIP com as fotos de ${agentsToExport.length} agentes?`)) {
          return;
      }

      setIsExporting(true);
      addLog('info', 'Iniciando ZIP...', `Processando ${agentsToExport.length} fotos.`);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ZipClass = (JSZip as any).default || JSZip;
        const zip = new ZipClass();
        const folder = zip.folder("fotos_agentes");

        let count = 0;

        for (const agent of agentsToExport) {
            if (!agent.foto) continue;
            try {
                const firstName = agent.nome_completo.split(' ')[0].trim().replace(/[^a-z0-9]/gi, '_');
                const safeName = `${agent.id}_${firstName}`;

                if (agent.foto.includes('base64,')) {
                    const parts = agent.foto.split(',');
                    if (parts.length === 2) {
                        const base64Data = parts[1];
                        const mimeType = parts[0].split(':')[1].split(';')[0];
                        let extension = 'jpg';
                        if (mimeType.includes('png')) extension = 'png';
                        else if (mimeType.includes('gif')) extension = 'gif';
                        else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = 'jpg';
                        folder?.file(`${safeName}.${extension}`, base64Data, { base64: true });
                        count++;
                    }
                } 
                else if (agent.foto.startsWith('http')) {
                    try {
                        const response = await fetch(agent.foto, { mode: 'cors', cache: 'no-cache' });
                        if (response.ok) {
                            const blob = await response.blob();
                            let ext = 'jpg';
                            if (blob.type === 'image/png') ext = 'png';
                            else if (blob.type === 'image/gif') ext = 'gif';
                            folder?.file(`${safeName}.${ext}`, blob);
                            count++;
                        }
                    } catch (fetchErr) {
                         console.error(`Erro de rede na foto de ${agent.nome_completo}`, fetchErr);
                    }
                }
            } catch (e) {
                console.error("Erro ao processar imagem:", e);
            }
        }

        if (count > 0) {
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fotos_agentes_${new Date().toISOString().split('T')[0]}.zip`;
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            addLog('success', 'ZIP Criado com Sucesso', `${count} fotos exportadas.`);
        } else {
            alert("Nenhuma foto válida encontrada.");
        }
      } catch (error) {
          addLog('error', 'Erro ao criar ZIP', String(error));
      } finally {
          setIsExporting(false);
      }
  };

  const filteredAgents = agents.filter(agent => {
      if (isRestrictedView && agent.id && currentUser.id && agent.id !== String(currentUser.id) && agent.id !== Number(currentUser.id)) {
          return false;
      }
      const matchSearch = agent.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          agent.telefone.includes(searchTerm);
      const matchSetor = filterSetor === 'Todos' || agent.setor === filterSetor;
      const matchCivil = filterCivil === 'Todos' || agent.estado_civil === filterCivil;
      const matchFuncao = filterFuncao === 'Todas' || agent.funcao === filterFuncao;
      return matchSearch && matchSetor && matchCivil && matchFuncao;
  });

  const handleToggleSelect = (id: number) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleSelectAll = () => {
      if (selectedIds.size === filteredAgents.length) {
          setSelectedIds(new Set());
      } else {
          const allIds = filteredAgents.map(a => a.id!).filter(id => id !== undefined);
          setSelectedIds(new Set(allIds));
      }
  };

  const selectedAgentsList = agents.filter(a => a.id && selectedIds.has(a.id));

  return (
    <div className="flex flex-col h-full bg-[#111827] text-slate-100 overflow-hidden font-sans relative">
      
      <WhatsAppModal 
        isOpen={showWhatsApp} 
        onClose={() => setShowWhatsApp(false)} 
        selectedAgents={selectedAgentsList}
      />

      {/* Top Navbar */}
      <div className="h-16 bg-[#1f2937] border-b border-gray-700 flex items-center justify-between px-4 md:px-6 shrink-0">
         <div className="flex items-center gap-2 md:gap-3">
             <div className="w-8 h-8 rounded-full bg-white p-0.5 overflow-hidden">
                <img src="https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png" className="w-full h-full object-contain" alt="Logo" loading="lazy" />
             </div>
             <div>
                 <h1 className="text-base md:text-lg font-bold text-white leading-tight">Pastoral Familiar</h1>
                 <p className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-wider">Cadastro Paroquial</p>
             </div>
         </div>

         <div className="flex items-center gap-4 text-sm">
             <div className="hidden md:block text-right">
                 <span className="block text-gray-300">Olá, <strong>{currentUser.nome_completo.split(' ')[0]}</strong>!</span>
                 <span className="text-[10px] text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800">{currentUser.funcao || 'Usuário'}</span>
             </div>
             
             <div className="flex items-center gap-2 md:gap-4 border-l border-gray-600 pl-4 md:pl-6">
                 
                 {/* New Module Button */}
                 <button onClick={() => onNavigate(ViewState.ELDERS_MODULE)} className="flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-900/20 px-2 py-1.5 md:px-3 rounded-lg border border-indigo-500/30 text-xs md:text-sm whitespace-nowrap">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     <span className="hidden md:inline">Missa da </span>Saúde
                 </button>

                 {currentUser.possui_veiculo && (
                    <button onClick={onOpenDriverModal} className="flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors bg-blue-900/20 px-2 py-1.5 md:px-3 rounded-lg border border-blue-500/30 text-xs md:text-sm whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Transporte
                    </button>
                 )}

                 <button onClick={fetchAgents} className="flex items-center gap-2 text-yellow-500 font-medium hover:text-yellow-400 transition-colors" title="Atualizar">
                     <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>

                 {canViewReports && (
                    <button onClick={() => onNavigate(ViewState.REPORTS)} className="flex items-center gap-2 text-blue-400 font-medium hover:text-blue-300 transition-colors">
                        <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span className="hidden md:inline">Relatórios</span>
                    </button>
                 )}

                 <button onClick={onLogout} className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors ml-2" title="Sair">
                     <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 </button>
             </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#111827]">
          
          {/* Filters Bar */}
          <div className="bg-[#1f2937] rounded-xl border border-gray-700 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Buscar por Nome ou Telefone</label>
                  <input 
                    type="text" 
                    placeholder="Digite aqui..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Setor Pastoral</label>
                  <select 
                    value={filterSetor}
                    onChange={(e) => setFilterSetor(e.target.value)}
                    className="w-full bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                      <option value="Todos">Todos</option>
                      <option value="Pré-Matrimonial">Pré-Matrimonial</option>
                      <option value="Pós-Matrimonial">Pós-Matrimonial</option>
                      <option value="Casos Especiais">Casos Especiais</option>
                  </select>
              </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Estado Civil</label>
                  <select 
                    value={filterCivil}
                    onChange={(e) => setFilterCivil(e.target.value)}
                    className="w-full bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                      <option value="Todos">Todos</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
              </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">Função</label>
                  <select 
                    value={filterFuncao}
                    onChange={(e) => setFilterFuncao(e.target.value)}
                    className="w-full bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                      <option value="Todas">Todas</option>
                      <option value="Agente">Agente</option>
                      <option value="Coordenador Paroquial">Coordenador</option>
                  </select>
              </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-white">Agentes ({filteredAgents.length})</h2>
                {!isRestrictedView && (
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={filteredAgents.length > 0 && selectedIds.size === filteredAgents.length}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs md:text-sm text-gray-400">Todos</span>
                    </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                  {selectedIds.size > 0 && (
                      <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-lg px-2 md:px-3 py-1 animate-fade-in mr-2 whitespace-nowrap">
                          <span className="text-xs text-blue-200 font-bold">{selectedIds.size} sel.</span>
                          <button 
                            onClick={() => setShowWhatsApp(true)}
                            className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded shadow"
                            title="Enviar WhatsApp em Massa"
                          >
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                          </button>
                      </div>
                  )}

                  {!isRestrictedView && (
                     <>
                        <button 
                            onClick={handleExportPhotos} 
                            disabled={isExporting}
                            className={`px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 border border-purple-800 shadow-lg shadow-purple-900/20 whitespace-nowrap ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`} 
                            title="Baixar todas as fotos (ZIP)"
                        >
                            {isExporting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            )}
                            <span className="hidden md:inline">Fotos ZIP</span>
                        </button>

                        <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 border border-gray-600 whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span className="hidden md:inline">CSV</span>
                        </button>

                        <button onClick={() => onNavigate(ViewState.REGISTER)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 whitespace-nowrap">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Novo
                        </button>
                    </>
                  )}
              </div>
          </div>
          
          {error && (
              <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl text-center mb-6">
                  <p className="text-red-300 font-bold mb-2">Erro de Conexão</p>
                  <p className="text-sm text-red-200/70">{error}</p>
                  <button onClick={fetchAgents} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">Tentar Novamente</button>
              </div>
          )}

          {/* Cards Grid */}
          {loading ? (
               <div className="flex items-center justify-center h-64">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
               </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pb-20">
                {filteredAgents.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        Nenhum agente encontrado.
                    </div>
                )}
                
                {filteredAgents.map(agent => (
                    <div 
                        key={agent.id} 
                        className={`bg-[#1f2937] border rounded-xl p-4 md:p-6 relative group transition-all duration-300 ${
                            editingId === agent.id 
                            ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-[1.03] z-20 ring-2 ring-blue-400'
                            : selectedIds.has(agent.id!) 
                                ? 'border-blue-500 ring-1 ring-blue-500/50' 
                                : 'border-gray-700 hover:border-gray-500'
                        }`}
                    >
                        
                        {!isRestrictedView && (
                            <div className="absolute top-4 right-4 z-10">
                                <input 
                                    type="checkbox" 
                                    checked={selectedIds.has(agent.id!)}
                                    onChange={() => handleToggleSelect(agent.id!)}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                            </div>
                        )}

                        <div className="flex gap-4 mb-4">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                                {agent.foto ? (
                                    <img src={agent.foto} className="w-full h-full object-cover" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                )}
                            </div>
                            <div className="pr-6">
                                <h3 className="font-bold text-base md:text-lg text-white leading-tight">{agent.nome_completo}</h3>
                                <span className="text-yellow-500 text-xs md:text-sm font-medium">{agent.funcao}</span>
                            </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-400 mb-8">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                {agent.setor}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                {agent.paroquia}
                            </div>
                             <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {agent.telefone}
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-4 right-4 flex justify-end gap-2">
                           
                           {!isRestrictedView && (
                               <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
                                    className="p-2 rounded-full bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors shadow-lg border border-gray-600 hover:border-red-500"
                                    title="Excluir"
                               >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                           )}

                           <button 
                                onClick={(e) => { e.stopPropagation(); handleEditClick(agent); }}
                                className="p-2 rounded-full bg-slate-700 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors shadow-lg border border-gray-600 hover:border-blue-500"
                                title="Editar"
                           >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                           </button>
                        </div>
                    </div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};
