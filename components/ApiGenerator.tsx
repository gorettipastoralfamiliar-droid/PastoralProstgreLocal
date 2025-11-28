import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { generateBackendCode } from '../services/geminiService';
import { GeneratedCode } from '../types';

interface ApiGeneratorProps {
  onBack: () => void;
}

export const ApiGenerator: React.FC<ApiGeneratorProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(true);
  const [inputKey, setInputKey] = useState('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowKeyInput(false);
    }
  }, []);

  const handleSaveKey = () => {
    if (!inputKey.trim()) return;
    localStorage.setItem('gemini_api_key', inputKey.trim());
    setApiKey(inputKey.trim());
    setShowKeyInput(false);
    setInputKey('');
  };

  const handleResetKey = () => {
    if (confirm('Remover chave de API deste navegador?')) {
      localStorage.removeItem('gemini_api_key');
      setApiKey('');
      setResult(null);
      setShowKeyInput(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!apiKey) { setShowKeyInput(true); return; }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateBackendCode(prompt, apiKey);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  if (showKeyInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fade-in relative">
        <button onClick={onBack} className="absolute top-0 left-0 p-2 text-white/50 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <GlassCard className="max-w-md w-full p-8 border-blue-500/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#5566D0] to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/40 mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">IA Backend Dev</h2>
            <p className="text-sm text-blue-200/80">
              Insira sua Gemini API Key para gerar código customizado.
            </p>
          </div>

          <div className="space-y-4">
            <input 
              type="password" 
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Cole sua API Key aqui..."
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-all"
            />
            <button
              onClick={handleSaveKey}
              disabled={!inputKey.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#5566D0] to-blue-600 hover:from-blue-600 hover:to-[#5566D0] text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50"
            >
              Salvar Chave
            </button>
            <div className="text-center">
               <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-xs text-blue-300 underline">Gerar chave gratuitamente</a>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col relative animate-fade-in">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
                <h2 className="text-2xl font-bold text-white">Gerador IA</h2>
                <p className="text-blue-200/70 text-sm">Crie APIs customizadas para seu servidor.</p>
            </div>
        </div>
        <button onClick={handleResetKey} className="text-xs text-slate-400 hover:text-red-400 border border-white/10 px-2 py-1 rounded">
            Trocar Chave
        </button>
      </div>

      <GlassCard className="flex-shrink-0">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Crie uma tabela 'eventos' com data e local, e uma API Node.js para listar esses eventos."
          className="w-full h-24 bg-black/20 border border-blue-500/30 rounded-lg p-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="px-6 py-2 bg-gradient-to-r from-[#5566D0] to-cyan-500 text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Gerando...' : 'Gerar Código'}
          </button>
        </div>
      </GlassCard>

      {result && (
        <GlassCard className="flex-1 overflow-hidden flex flex-col min-h-0 border-green-500/30">
          <div className="flex justify-between mb-2">
            <h3 className="font-bold text-green-300">{result.title}</h3>
            <button onClick={() => navigator.clipboard.writeText(result.code)} className="text-xs bg-white/10 px-2 py-1 rounded text-white hover:bg-white/20">Copiar</button>
          </div>
          <pre className="flex-1 bg-[#0d1117] p-4 overflow-auto rounded-lg text-xs font-mono text-blue-100 custom-scrollbar">
            <code>{result.code}</code>
          </pre>
        </GlassCard>
      )}
    </div>
  );
};