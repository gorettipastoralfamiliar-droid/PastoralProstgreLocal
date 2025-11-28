import React from 'react';
import { GlassCard } from './GlassCard';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
          Arquitetura Segura (Home Lab)
        </h2>
        <p className="text-sm text-blue-200/80 mt-2">
          Como conectar seu Vercel Frontend ao PostgreSQL em Casa sem expor portas.
        </p>
      </div>

      <GlassCard className="border-l-4 border-l-cyan-400">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto bg-black/40 rounded-full flex items-center justify-center border border-white/10 mb-2">
              <span className="text-2xl">☁️</span>
            </div>
            <p className="font-bold">Vercel</p>
            <p className="text-xs text-slate-400">Frontend (React)</p>
          </div>

          <div className="flex-1 flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-1">HTTPS Request</span>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent relative">
              <div className="absolute top-[-4px] left-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] animate-pulse" />
            </div>
          </div>

          <div className="flex-1 text-center">
            <div className="w-16 h-16 mx-auto bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/50 mb-2 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <span className="text-2xl">🛡️</span>
            </div>
            <p className="font-bold text-orange-200">Cloudflare Tunnel</p>
            <p className="text-xs text-slate-400">Proteção DDoS / CGNAT</p>
          </div>

           <div className="flex-1 flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-1">Tunnel Seguro</span>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          </div>

          <div className="flex-1 text-center">
             <div className="w-16 h-16 mx-auto bg-blue-900/40 rounded-full flex items-center justify-center border border-blue-500/50 mb-2">
              <span className="text-2xl">🏠</span>
            </div>
            <p className="font-bold text-blue-200">Home Server</p>
            <p className="text-xs text-slate-400">Node.js API + PostgreSQL</p>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard title="1. Instalar Cloudflared" className="bg-blue-900/20">
          <p className="text-sm text-slate-300 mb-2">
            No seu servidor de casa (Linux/Windows), instale o agente `cloudflared`. Ele cria um túnel criptografado de saída.
          </p>
          <code className="block bg-black/30 p-2 rounded text-xs font-mono text-green-400 border border-white/5">
            curl -L --output cloudflared.deb ...<br/>
            sudo dpkg -i cloudflared.deb
          </code>
        </GlassCard>

        <GlassCard title="2. Criar a API Local" className="bg-blue-900/20">
          <p className="text-sm text-slate-300 mb-2">
            Você precisa de uma API (Node.js/Express) rodando na porta 3000 (exemplo) para receber as requisições do túnel e falar com o Banco.
          </p>
          <p className="text-xs text-blue-300 mt-2">
            Use a aba "Gerador de API" para criar este código agora.
          </p>
        </GlassCard>
      </div>
    </div>
  );
};