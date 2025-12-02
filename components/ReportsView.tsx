
import React, { useState, useEffect } from 'react';
import { Member, LogType } from '../types';

interface ReportsViewProps {
  currentUser: any;
  serverUrl: string;
  onBack: () => void;
  addLog: (type: LogType, message: string, details?: string) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Huge list of Bodas as requested
const BODAS_MAP: { [key: string]: string } = {
  "1 ano": "Papel", "1 mês": "Bodas de Beijinho", "2 meses": "Sorvete", "3 meses": "Algodão Doce", "4 meses": "Pipocas", "5 meses": "Chocolate", "6 meses": "Plumas", "7 meses": "Purpurina", "8 meses": "Pompons", "9 meses": "Maternidade", "10 meses": "Pintinhos", "11 meses": "Chicletes",
  "2 anos": "Algodão", "3 anos": "Couro ou Trigo", "4 anos": "Cera ou Flores e Frutas", "5 anos": "Ferro ou Madeira", "6 anos": "Açúcar ou Perfume", "7 anos": "Lã ou Latão", "8 anos": "Barro ou Papoula", "9 anos": "Cerâmica ou Vime", "10 anos": "Estanho", "11 anos": "Aço", "12 anos": "Ônix ou Seda", "13 anos": "Linho ou Renda", "14 anos": "Marfim", "15 anos": "Cristal", "16 anos": "Safira ou Turmalina", "17 anos": "Rosa", "18 anos": "Turquesa", "19 anos": "Água Marinha ou Cretone", "20 anos": "Porcelana", "21 anos": "Zircão", "22 anos": "Louça", "23 anos": "Palha", "24 anos": "Opala", "25 anos": "Prata", "26 anos": "Alexandrita", "27 anos": "Crisoprásio", "28 anos": "Hematita", "29 anos": "Erva", "30 anos": "Pérola", "31 anos": "Nácar", "32 anos": "Pinho", "33 anos": "Crizo", "34 anos": "Oliveira", "35 anos": "Coral", "36 anos": "Cedro", "37 anos": "Aventurina", "38 anos": "Carvalho", "39 anos": "Mármore", "40 anos": "Esmeralda", "41 anos": "Seda", "42 anos": "Prata Dourada", "43 anos": "Azeviche", "44 anos": "Carbonato", "45 anos": "Rubi", "46 anos": "Alabastro", "47 anos": "Jaspe", "48 anos": "Granito", "49 anos": "Heliotrópio", "50 anos": "Ouro", "51 anos": "Bronze", "52 anos": "Argila", "53 anos": "Antimônio", "54 anos": "Níquel", "55 anos": "Ametista", "56 anos": "Malaquita", "57 anos": "Lápis Lázuli", "58 anos": "Vidro", "59 anos": "Cereja", "60 anos": "Diamante", "61 anos": "Cobre", "62 anos": "Alecrim ou Telurita", "63 anos": "Lilás ou Sândalo", "64 anos": "Fabulita", "65 anos": "Pérola Negra", "66 anos": "Ébano", "67 anos": "Neve", "68 anos": "Chumbo", "69 anos": "Mercúrio", "70 anos": "Vinho", "71 anos": "Zinco", "72 anos": "Aveia", "73 anos": "Manjerona", "74 anos": "Macieira", "75 anos": "Alabastro ou Brilhante", "76 anos": "Cipreste", "77 anos": "Alfazema", "78 anos": "Benjoim", "79 anos": "Café", "80 anos": "Carvalho", "81 anos": "Cacau", "82 anos": "Cravo", "83 anos": "Begônia", "84 anos": "Crisântemo", "85 anos": "girassol", "86 anos": "Hortênsia", "87 anos": "Nogueira", "88 anos": "Pêra", "89 anos": "Figueira", "90 anos": "Álamo", "91 anos": "Pinheiro", "92 anos": "Salgueiro", "93 anos": "Imbuia", "94 anos": "Palmeira", "95 anos": "Sândalo", "96 anos": "Oliveira", "97 anos": "Abeto", "98 anos": "Pinheiro", "99 anos": "Salgueiro", "100 anos": "Jequitibá"
};

export const ReportsView: React.FC<ReportsViewProps> = ({ currentUser, serverUrl, onBack, addLog }) => {
  const [activeTab, setActiveTab] = useState<'ANIVERSARIOS' | 'CASAMENTOS' | 'GRAFICOS'>('GRAFICOS');
  const [agents, setAgents] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    const API_URL = serverUrl.replace(/\/$/, '');
    try {
      const response = await fetch(`${API_URL}/api/membros`, { 
        mode: 'cors', headers: { 'ngrok-skip-browser-warning': 'true' } 
      });
      const data = await response.json();
      if (Array.isArray(data)) setAgents(data);
    } catch (error) {
      addLog('error', 'Erro ao carregar relatório', String(error));
    } finally {
      setLoading(false);
    }
  };

  // --- STATS CALCULATION ---
  const totalAgents = agents.length;
  const activeSectors = new Set(agents.map(a => a.setor)).size;
  const avgAgents = activeSectors > 0 ? (totalAgents / activeSectors).toFixed(1) : '0';

  // Pie Chart Data
  const civilCounts = {
    'Casado(a)': agents.filter(a => a.estado_civil === 'Casado(a)').length,
    'Solteiro(a)': agents.filter(a => a.estado_civil === 'Solteiro(a)').length,
    'Viúvo(a)': agents.filter(a => a.estado_civil === 'Viúvo(a)').length,
  };
  const civilTotal = Object.values(civilCounts).reduce((a, b) => a + b, 0) || 1;
  
  // Bar Chart Data (Fixed Categories)
  const sectorCounts = {
    'Casos Especiais': agents.filter(a => a.setor === 'Casos Especiais').length,
    'Pré-matrimonial': agents.filter(a => a.setor === 'Pré-Matrimonial').length,
    'Pós-matrimonial': agents.filter(a => a.setor === 'Pós-Matrimonial').length,
  };
  const maxSectorCount = Math.max(...Object.values(sectorCounts), 1); 

  // --- BODAS CALCULATION ---
  const calculateBodas = (dateStr: string) => {
    if (!dateStr) return { diff: '', name: 'N/A' };
    
    const start = new Date(dateStr);
    const now = new Date();
    
    // Simplistic diff logic (years and months)
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
      years--;
      months += 12;
    }

    let diffText = '';
    let bodasName = '';

    if (years > 0) {
      diffText = `${years} anos`;
      bodasName = BODAS_MAP[`${years} anos`] || '';
    } else {
      diffText = `${months} meses`;
      bodasName = BODAS_MAP[`${months} meses`] || '';
    }

    return { diff: diffText, name: bodasName };
  };

  // --- DATA PROCESSING FOR LISTS ---

  const getFilteredData = (type: 'ANIVERSARIOS' | 'CASAMENTOS') => {
    const isBirthday = type === 'ANIVERSARIOS';
    
    // Filter agents valid for the list
    let filtered = agents.filter(a => {
        const dateStr = isBirthday ? a.data_nascimento : a.data_casamento;
        if (!dateStr) return false;
        
        // Check Month Filter
        if (filterMonth !== 'all') {
            const date = new Date(dateStr);
            // date.getMonth is 0-indexed, filterMonth is '0'..'11'
            if (date.getMonth() !== parseInt(filterMonth)) return false;
        }

        // For weddings, strictly married
        if (!isBirthday && a.estado_civil !== 'Casado(a)') return false;
        
        return true;
    });

    // Sort by Month then Day
    filtered.sort((a, b) => {
        const dateA = new Date(isBirthday ? a.data_nascimento : a.data_casamento!);
        const dateB = new Date(isBirthday ? b.data_nascimento : b.data_casamento!);
        if (dateA.getMonth() !== dateB.getMonth()) return dateA.getMonth() - dateB.getMonth();
        return dateA.getDate() - dateB.getDate();
    });

    // Group by Month
    const grouped: { [key: number]: Member[] } = {};
    filtered.forEach(agent => {
        const date = new Date(isBirthday ? agent.data_nascimento : agent.data_casamento!);
        const month = date.getMonth();
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push(agent);
    });

    return grouped;
  };

  const formatDateShort = (dateStr: string) => {
    if(!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  
  const formatDateFull = (dateStr: string) => {
    if(!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
  };

  // --- PRINT FUNCTIONS ---
  
  const handlePrintDashboard = () => {
    let contentHtml = `
      <html>
        <head>
          <title>Relatório Gerencial</title>
          <style>
             @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
             body { font-family: 'Roboto', sans-serif; padding: 40px; color: #333; }
             .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
             .logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 10px; }
             h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
             p { color: #666; margin: 5px 0; }
             
             .stats-row { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 40px; }
             .stat-card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; background: #f9fafb; }
             .stat-label { font-size: 12px; text-transform: uppercase; color: #666; font-weight: bold; }
             .stat-val { font-size: 36px; font-weight: bold; color: #1e3a8a; margin-top: 10px; }

             .charts-section { display: flex; gap: 40px; }
             .chart-box { flex: 1; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
             .chart-title { text-align: center; font-weight: bold; margin-bottom: 20px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 10px; }

             table { width: 100%; border-collapse: collapse; font-size: 13px; }
             th, td { padding: 8px 0; border-bottom: 1px solid #eee; text-align: left; }
             th { color: #666; font-weight: bold; }

             .bar-row { display: flex; align-items: center; margin-bottom: 12px; }
             .bar-label { width: 140px; font-size: 12px; font-weight: bold; color: #555; }
             .bar-track { flex: 1; height: 24px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
             .bar-fill { height: 100%; background: #4ade80; }
             .bar-val { width: 30px; text-align: right; font-size: 12px; font-weight: bold; margin-left: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png" class="logo" />
            <h1>Relatório Gerencial - Pastoral Familiar</h1>
            <p>Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div class="stats-row">
            <div class="stat-card">
                <div class="stat-label">Total de Agentes</div>
                <div class="stat-val">${totalAgents}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Setores Ativos</div>
                <div class="stat-val" style="color: #10b981;">${activeSectors}</div>
            </div>
             <div class="stat-card">
                <div class="stat-label">Média / Setor</div>
                <div class="stat-val" style="color: #f59e0b;">${avgAgents}</div>
            </div>
          </div>

          <div class="charts-section">
            <div class="chart-box">
                <div class="chart-title">Estado Civil</div>
                <table>
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th style="text-align:right">Qtd</th>
                            <th style="text-align:right">%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(civilCounts).map(([k,v]) => `
                            <tr>
                                <td>${k}</td>
                                <td style="text-align:right"><strong>${v}</strong></td>
                                <td style="text-align:right">${Math.round((v/civilTotal)*100)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="chart-box">
                <div class="chart-title">Distribuição por Setor</div>
                ${Object.entries(sectorCounts).map(([k,v]) => `
                    <div class="bar-row">
                        <div class="bar-label">${k}</div>
                        <div class="bar-track">
                            <div class="bar-fill" style="width: ${(v/maxSectorCount)*100}%"></div>
                        </div>
                        <div class="bar-val">${v}</div>
                    </div>
                `).join('')}
            </div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(contentHtml);
        printWindow.document.close();
    }
  };

  const handlePrint = (type: 'ANIVERSARIOS' | 'CASAMENTOS') => {
    const groupedData = getFilteredData(type);
    const title = type === 'ANIVERSARIOS' ? 'Relatório de Aniversariantes' : 'Relatório de Matrimônios';
    const color = type === 'ANIVERSARIOS' ? '#ec4899' : '#f59e0b'; // Pink or Orange
    
    // Create HTML structure for printing
    let contentHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
            body { font-family: 'Roboto', sans-serif; margin: 40px; color: #333; }
            .header { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid #ddd; padding-bottom: 20px; }
            .logo { width: 80px; height: 80px; object-fit: contain; }
            .title-box h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
            .title-box p { margin: 5px 0 0; color: #666; font-size: 14px; }
            .month-section { margin-bottom: 30px; }
            .month-header { background-color: ${color}; color: white; padding: 8px 15px; font-weight: bold; text-transform: uppercase; font-size: 14px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid #eee; color: #555; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png" class="logo" />
            <div class="title-box">
              <h1>${title}</h1>
              <p>Pastoral Familiar - Cadastro Paroquial</p>
              <p>Período: ${filterMonth === 'all' ? 'Todos os Meses' : MONTHS[parseInt(filterMonth)]}</p>
            </div>
          </div>
    `;

    // Loop through sorted months
    const sortedMonths = Object.keys(groupedData).map(Number).sort((a,b) => a - b);

    if (sortedMonths.length === 0) {
        contentHtml += `<p style="text-align:center; color:#999;">Nenhum registro encontrado para este período.</p>`;
    }

    sortedMonths.forEach(monthIndex => {
        contentHtml += `
            <div class="month-section">
                <div class="month-header">${MONTHS[monthIndex]}</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 35%">Nome ${type === 'CASAMENTOS' ? '(Casal)' : ''}</th>
                            <th style="width: 20%">Telefone</th>
                            <th style="width: 15%">${type === 'ANIVERSARIOS' ? 'Data Nasc.' : 'Data'}</th>
                            <th style="width: 30%">${type === 'ANIVERSARIOS' ? 'Casamento' : 'Bodas'}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        groupedData[monthIndex].forEach(agent => {
            const phone = agent.telefone;
            const dateVal = type === 'ANIVERSARIOS' ? formatDateShort(agent.data_nascimento) : formatDateFull(agent.data_casamento!);
            
            let extraCol = '';
            if (type === 'ANIVERSARIOS') {
                extraCol = agent.data_casamento ? formatDateFull(agent.data_casamento) : '-';
            } else {
                const bodas = calculateBodas(agent.data_casamento!);
                extraCol = `<strong>${bodas.diff}</strong>${bodas.name ? ': ' + bodas.name : ''}`;
            }

            contentHtml += `
                <tr>
                    <td>${agent.nome_completo}</td>
                    <td>${phone}</td>
                    <td>${dateVal}</td>
                    <td>${extraCol}</td>
                </tr>
            `;
        });

        contentHtml += `
                    </tbody>
                </table>
            </div>
        `;
    });

    contentHtml += `
        </body>
        <script>window.print();</script>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(contentHtml);
        printWindow.document.close();
    }
  };


  // --- RENDER ---
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#5566D0]/20 to-[#0f172a] text-slate-100 font-sans overflow-hidden">
      
      {/* Header */}
      <div className="h-16 bg-[#1f2937]/80 backdrop-blur border-b border-gray-700 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
             </button>
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white p-0.5 overflow-hidden">
                    <img src="https://swufojxuemmouglmlptu.supabase.co/storage/v1/object/public/logos/1763492095165.png" className="w-full h-full object-contain" alt="Logo" />
                </div>
                <h1 className="text-xl font-bold">Relatórios da Pastoral</h1>
             </div>
        </div>
        <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-6 pb-2">
        <button onClick={() => setActiveTab('ANIVERSARIOS')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'ANIVERSARIOS' ? 'bg-[#ec4899] text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            🎂 Aniversariantes
        </button>
        <button onClick={() => setActiveTab('CASAMENTOS')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'CASAMENTOS' ? 'bg-[#f59e0b] text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            ♥ Casamentos
        </button>
        <button onClick={() => setActiveTab('GRAFICOS')} className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'GRAFICOS' ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
            📊 Gráficos
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col">
        
        {loading && <div className="text-center py-20 animate-pulse text-blue-300">Carregando dados...</div>}

        {!loading && activeTab === 'GRAFICOS' && (
            <div className="flex flex-col min-h-full">
                <div className="space-y-6 animate-fade-in flex-1">
                    {/* Top Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center shadow-xl">
                            <p className="text-sm font-bold text-slate-400 uppercase">Total de Agentes</p>
                            <p className="text-5xl font-bold text-blue-400 mt-2 drop-shadow-lg">{totalAgents}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center shadow-xl">
                            <p className="text-sm font-bold text-slate-400 uppercase">Setores Ativos</p>
                            <p className="text-5xl font-bold text-green-400 mt-2 drop-shadow-lg">{activeSectors}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center shadow-xl">
                            <p className="text-sm font-bold text-slate-400 uppercase">Média de Agentes por Setor</p>
                            <p className="text-5xl font-bold text-orange-400 mt-2 drop-shadow-lg">{avgAgents}</p>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-96">
                        {/* Pie Chart Panel */}
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col">
                            <h3 className="text-lg font-bold text-slate-200 mb-6">Agentes por Estado Civil</h3>
                            <div className="flex-1 flex items-center justify-center gap-8">
                                {/* CSS Pie Chart */}
                                <div className="relative w-48 h-48 rounded-full shadow-2xl" style={{
                                    background: `conic-gradient(
                                        #3b82f6 0% ${(civilCounts['Casado(a)']/civilTotal)*100}%, 
                                        #10b981 ${(civilCounts['Casado(a)']/civilTotal)*100}% ${((civilCounts['Casado(a)'] + civilCounts['Solteiro(a)'])/civilTotal)*100}%,
                                        #f59e0b ${((civilCounts['Casado(a)'] + civilCounts['Solteiro(a)'])/civilTotal)*100}% 100%
                                    )`
                                }}>
                                </div>
                                
                                {/* Legend */}
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                                        <span className="text-blue-300">Casado(a) ({Math.round((civilCounts['Casado(a)']/civilTotal)*100)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                                        <span className="text-green-300">Solteiro(a) ({Math.round((civilCounts['Solteiro(a)']/civilTotal)*100)}%)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
                                        <span className="text-orange-300">Viúvo(a) ({Math.round((civilCounts['Viúvo(a)']/civilTotal)*100)}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bar Chart Panel */}
                        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col">
                            <h3 className="text-lg font-bold text-slate-200 mb-6">Agentes por Setor Pastoral</h3>
                            <div className="flex-1 flex items-end justify-around pb-4 border-b border-white/10 relative">
                                {Object.entries(sectorCounts).map(([sector, count]) => (
                                    <div key={sector} className="flex flex-col items-center w-1/4 h-full justify-end group">
                                        <div className="text-xs font-bold text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{count}</div>
                                        <div 
                                            className="w-full bg-green-400/80 rounded-t-lg hover:bg-green-300 transition-all shadow-lg"
                                            style={{ height: `${(count / maxSectorCount) * 80}%`, minHeight: '4px' }}
                                        ></div>
                                        <div className="text-[10px] text-center mt-2 text-slate-300 h-8 leading-tight">{sector}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* GRAPHICS FOOTER */}
                <div className="bg-white/10 border border-white/10 rounded-xl p-4 mt-6 flex justify-end gap-3">
                    <button 
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold shadow transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={handlePrintDashboard}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-green-900/20 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir Gráficos
                    </button>
                </div>
            </div>
        )}

        {/* LIST VIEW (BIRTHDAYS OR WEDDINGS) */}
        {!loading && (activeTab === 'ANIVERSARIOS' || activeTab === 'CASAMENTOS') && (
            <div className="flex flex-col h-full animate-fade-in">
                
                {/* FILTER & HEADER */}
                <div className="bg-white/10 border border-white/10 rounded-t-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full text-xl ${activeTab === 'ANIVERSARIOS' ? 'bg-pink-500/20 text-pink-300' : 'bg-orange-500/20 text-orange-300'}`}>
                            {activeTab === 'ANIVERSARIOS' ? '🎂' : '♥'}
                        </div>
                        <div>
                             <h2 className="font-bold text-lg">{activeTab === 'ANIVERSARIOS' ? 'Aniversariantes' : 'Casamentos'}</h2>
                             <p className="text-xs text-slate-400">Selecione o mês para visualizar</p>
                        </div>
                    </div>

                    <div className="w-full md:w-64">
                        <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block">Filtrar por Mês</label>
                        <select 
                            value={filterMonth} 
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">Todos os meses</option>
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i.toString()}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SCROLLABLE LIST */}
                <div className="flex-1 bg-black/20 border-x border-white/5 overflow-y-auto p-4 custom-scrollbar">
                    {(() => {
                        const grouped = getFilteredData(activeTab);
                        const monthKeys = Object.keys(grouped).map(Number).sort((a,b) => a-b);
                        
                        if (monthKeys.length === 0) {
                            return <div className="text-center py-10 text-slate-500">Nenhum registro encontrado para este filtro.</div>;
                        }

                        return monthKeys.map(monthIndex => (
                            <div key={monthIndex} className="mb-6">
                                <h3 className={`text-sm font-bold uppercase mb-3 pl-2 border-l-4 ${activeTab === 'ANIVERSARIOS' ? 'border-pink-500 text-pink-300' : 'border-orange-500 text-orange-300'}`}>
                                    {MONTHS[monthIndex]}
                                </h3>
                                <div className="space-y-2">
                                    {grouped[monthIndex].map(agent => (
                                        <div key={agent.id} className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2 transition-colors">
                                            <div className="flex items-center gap-3">
                                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeTab === 'ANIVERSARIOS' ? 'bg-pink-500/20 text-pink-300' : 'bg-orange-500/20 text-orange-300'}`}>
                                                     {activeTab === 'ANIVERSARIOS' 
                                                        ? new Date(agent.data_nascimento).getDate() 
                                                        : new Date(agent.data_casamento!).getDate()
                                                     }
                                                 </div>
                                                 <div>
                                                     <p className="font-bold text-sm text-white">{agent.nome_completo}</p>
                                                     <p className="text-xs text-slate-400 flex items-center gap-1">
                                                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                         {agent.telefone}
                                                     </p>
                                                 </div>
                                            </div>

                                            <div className="text-right">
                                                {activeTab === 'ANIVERSARIOS' ? (
                                                     agent.data_casamento && (
                                                         <span className="text-[10px] bg-orange-900/30 text-orange-300 px-2 py-1 rounded border border-orange-500/20">
                                                             Casamento: {formatDateFull(agent.data_casamento)}
                                                         </span>
                                                     )
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-slate-400">Bodas ({calculateBodas(agent.data_casamento!).diff})</span>
                                                        <span className="text-xs font-bold text-yellow-500">{calculateBodas(agent.data_casamento!).name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="bg-white/10 border border-white/10 rounded-b-xl p-4 flex justify-end gap-3">
                    <button 
                        onClick={onBack}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold shadow transition-colors"
                    >
                        Fechar
                    </button>
                    <button 
                        onClick={() => handlePrint(activeTab)}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2 ${activeTab === 'ANIVERSARIOS' ? 'bg-pink-600 hover:bg-pink-500 shadow-pink-900/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Imprimir Lista
                    </button>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};
