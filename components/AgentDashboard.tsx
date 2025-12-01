
import React, { useState, useEffect } from 'react';
import { Member, ViewState, LogType } from '../types';

interface AgentDashboardProps {
  currentUser: any;
  serverUrl: string;
  onLogout: () => void;
  onNavigate: (view: ViewState) => void;
  addLog: (type: LogType, message: string, details?: string) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({ currentUser, serverUrl, onLogout, onNavigate, addLog }) => {
  const [agents, setAgents] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSetor, setFilterSetor] = useState('Todos');
  const [filterCivil, setFilterCivil] = useState('Todos');
  const [filterFuncao, setFilterFuncao] = useState('Todas');

  const API_URL = serverUrl.replace(/\/$/, '');

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
              'ngrok-skip-browser-warning': 'true', // Importante para Ngrok Free
              'Bypass-Tunnel-Reminder': 'true'
          }
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        addLog('error', `Erro Servidor: ${response.status}`, `Msg: ${text.substring(0, 200)}`);
        
        if (text.includes('<!DOCTYPE html>')) {
             throw new Error("O endpoint retornou HTML (Provavelmente erro do Ngrok ou rota incorreta).");
        }
        throw new Error(`Servidor retornou erro ${response.status}: ${text}`);
      }

      addLog('success', `Resposta OK (${response.status})`, `Body Preview: ${text.substring(0, 100)}...`);

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
      console.error("Erro ao buscar agentes", error);
      setError(`${msg}`);
      addLog('error', 'Falha ao buscar agentes', msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
      const matchSearch = agent.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          agent.telefone.includes(searchTerm);
      const matchSetor = filterSetor === 'Todos' || agent.setor === filterSetor;
      const matchCivil = filterCivil === 'Todos' || agent.estado_civil === filterCivil;
      const matchFuncao = filterFuncao === 'Todas' || agent.funcao === filterFuncao;

      return matchSearch && matchSetor && matchCivil && matchFuncao;
  });

  return (
    <div className="flex flex-col h-full bg-[#111827] text-slate-100 overflow-hidden font-sans">
      
      {/* Top Navbar */}
      <div className="h-16 bg-[#1f2937] border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white p-0.5 overflow-hidden">
                <img src="https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png" className="w-full h-full object-contain" alt="Logo" />
             </div>
             <div>
                 <h1 className="text-lg font-bold text-white leading-tight">Pastoral Familiar</h1>
                 <p className="text-[10px] text-gray-400 uppercase tracking-wider">Cadastro Paroquial</p>
             </div>
         </div>

         <div className="flex items-center gap-6 text-sm">
             <span className="hidden md:block text-gray-300">Olá, <strong>{currentUser.nome_completo.split(' ')[0]}</strong>!</span>
             
             <div className="flex items-center gap-4 border-l border-gray-600 pl-6">
                 <button onClick={fetchAgents} className="flex items-center gap-2 text-yellow-500 font-medium hover:text-yellow-400 transition-colors">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                     Atualizar
                 </button>
                 <button onClick={onLogout} className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors ml-2">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                     Sair
                 </button>
             </div>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#111827]">
          
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
              <h2 className="text-2xl font-bold text-white">Agentes Cadastrados ({filteredAgents.length})</h2>
              
              <div className="flex items-center gap-3">
                  <button onClick={() => onNavigate(ViewState.REGISTER)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                     Novo
                  </button>
              </div>
          </div>
          
          {error && (
              <div className="bg-red-900/30 border border-red-500/30 p-4 rounded-xl text-center mb-6">
                  <p className="text-red-300 font-bold mb-2">Erro de Conexão</p>
                  <p className="text-sm text-red-200/70">{error}</p>
                  <div className="mt-2 text-xs text-red-300/50 font-mono bg-black/30 p-2 rounded">
                      Verifique o Terminal (canto inferior direito) para ver o erro exato do servidor.
                  </div>
                  <button onClick={fetchAgents} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">Tentar Novamente</button>
              </div>
          )}

          {/* Cards Grid */}
          {loading ? (
               <div className="flex items-center justify-center h-64">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
               </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAgents.map(agent => (
                    <div key={agent.id} className="bg-[#1f2937] border border-gray-700 rounded-xl p-6 relative group hover:border-gray-500 transition-all">
                        <div className="flex gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden border border-gray-600">
                                {agent.foto ? (
                                    <img src={agent.foto} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white leading-tight">{agent.nome_completo}</h3>
                                <span className="text-yellow-500 text-sm font-medium">{agent.funcao}</span>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400">
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
                    </div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
};
