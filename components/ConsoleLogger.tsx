
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface ConsoleLoggerProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const ConsoleLogger: React.FC<ConsoleLoggerProps> = ({ logs, onClear }) => {
  const [isOpen, setIsOpen] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <button 
        onClick={toggleOpen}
        className="fixed bottom-4 right-4 bg-black/80 text-green-400 border border-green-500/30 p-2 rounded-full shadow-lg backdrop-blur hover:bg-black transition-all z-50 flex items-center gap-2 pr-4"
      >
        <div className={`w-3 h-3 rounded-full ${logs.length > 0 && logs[logs.length-1].type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
        <span className="text-xs font-mono font-bold">Terminal ({logs.length})</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center px-0 md:px-4 pb-0 md:pb-4 pointer-events-none">
      <div className="w-full md:max-w-4xl bg-[#0f172a]/95 backdrop-blur-xl border-t md:border border-slate-700/50 shadow-2xl rounded-t-xl md:rounded-xl overflow-hidden pointer-events-auto flex flex-col max-h-[300px] transition-all duration-300">
        
        {/* Header / Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-white/5">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs font-bold text-slate-300 font-mono tracking-wide">CONSOLE DO SISTEMA</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">frontend-to-backend</span>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={onClear} className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors">
              LIMPAR
            </button>
            <button onClick={toggleOpen} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2 custom-scrollbar bg-black/40">
          {logs.length === 0 && (
            <div className="text-slate-600 italic text-center mt-8 opacity-50">
              Aguardando requisições...<br/>
              O log de conexões aparecerá aqui.
            </div>
          )}
          
          {logs.map((log) => (
            <div key={log.id} className="animate-fade-in border-l-2 pl-3 py-1 border-opacity-50" style={{
              borderColor: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#22c55e' : log.type === 'warning' ? '#eab308' : '#3b82f6'
            }}>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-slate-500">[{log.timestamp.toLocaleTimeString()}]</span>
                <span className={`font-bold uppercase ${
                   log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                }`}>
                  {log.type}
                </span>
                <span className="text-slate-200">{log.message}</span>
              </div>
              {log.details && (
                <div className="text-slate-400 break-all pl-20 opacity-80">
                  {log.details}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

      </div>
    </div>
  );
};
