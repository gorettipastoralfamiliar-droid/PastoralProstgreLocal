import React from 'react';
import { GlassCard } from './GlassCard';
import { ServerMetric } from '../types';

export const Dashboard: React.FC = () => {
  // Mock data representing a healthy home server connection via Cloudflare Tunnel
  const metrics: ServerMetric[] = [
    { label: 'Postgres Status', value: 'Online', status: 'good' },
    { label: 'Latency (Tunnel)', value: '45ms', status: 'good' },
    { label: 'Active Conns', value: '3', status: 'warning' },
    { label: 'Last Backup', value: '2h ago', status: 'good' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <GlassCard key={idx} className="flex flex-col items-center justify-center py-6">
            <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">{metric.label}</span>
            <span className={`text-2xl font-bold ${
              metric.status === 'good' ? 'text-green-400' : 
              metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {metric.value}
            </span>
            <div className={`mt-2 h-1.5 w-12 rounded-full ${
               metric.status === 'good' ? 'bg-green-500/50 shadow-[0_0_8px_#4ade80]' : 
               metric.status === 'warning' ? 'bg-yellow-500/50' : 'bg-red-500/50'
            }`} />
          </GlassCard>
        ))}
      </div>

      <GlassCard title="Atividade Recente" className="h-64 overflow-hidden">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
                  ⚡
                </div>
                <div>
                  <p className="text-sm font-medium text-white">API Request: /users</p>
                  <p className="text-xs text-slate-400">Via Cloudflare Tunnel • 200 OK</p>
                </div>
              </div>
              <span className="text-xs text-slate-500">{i * 12} min ago</span>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f172a]/90 to-transparent pointer-events-none" />
      </GlassCard>

      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 flex items-center gap-4">
        <div className="p-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/40">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <div>
          <h4 className="font-bold text-white">Supabase Free Tier Saver</h4>
          <p className="text-xs text-blue-100">Seu servidor local está economizando aprox. <span className="font-bold text-green-300">R$ 125,00/mês</span> em custos de cloud DB.</p>
        </div>
      </div>
    </div>
  );
};