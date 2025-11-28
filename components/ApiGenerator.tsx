import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { generateBackendCode } from '../services/geminiService';
import { GeneratedCode } from '../types';

export const ApiGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para gerenciamento da API Key
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(true);
  const [inputKey, setInputKey] = useState('');

  // Ao montar, verifica se já existe chave no ENV ou LocalStorage
  useEffect(() => {
    const envKey = process.env.API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');

    if (envKey) {
      setApiKey(envKey);
      setShowKeyInput(false);
    } else if (storedKey) {
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
    if (confirm('Deseja remover sua chave de API deste navegador?')) {
      localStorage.removeItem('gemini_api_key');
      setApiKey('');
      setResult(null);
      setShowKeyInput(true);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    if (!apiKey) {
      setShowKeyInput(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateBackendCode(prompt, apiKey);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  // Tela de Configuração da Chave
  if (showKeyInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-6 animate-fade-in">
        <GlassCard className="max-w-md w-full p-8 border-blue-500/30">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#5566D0] to-cyan-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/40 mb-4">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Configuração da IA</h2>
            <p className="text-sm text-blue-200/80">
              Para gerar o código do backend automaticamente, precisamos de uma chave da API Gemini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-blue-200 mb-1 ml-1">
                Sua Gemini API Key
              </label>
              <input 
                type="password" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Cole sua chave aqui..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
              />
            </div>

            <button
              onClick={handleSaveKey}
              disabled={!inputKey.trim()}
              className="w-full py-3 bg-gradient-to-r from-[#5566D0] to-blue-600 hover:from-blue-600 hover:to-[#5566D0] text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar Chave
            </button>

            <div className="text-center pt-2">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-300 hover:text-white underline transition-colors"
              >
                Não tem uma chave? Gere gratuitamente aqui.
              </a>
            </div>
            
            <p className="text-[10px] text-center text-slate-500 mt-4">
              Sua chave será armazenada localmente no seu navegador e usada apenas para gerar o código.
            </p>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Tela Principal do Gerador
  return (
    <div className="space-y-6 h-full flex flex-col relative animate-fade-in">
      
      {/* Header com botão de Configuração */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerador de API Node.js</h2>
          <p className="text-blue-200/70 text-sm">
            Descreva sua tabela e receba o código completo.
          </p>
        </div>
        <button 
          onClick={handleResetKey}
          title="Alterar API Key"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </div>

      <GlassCard className="flex-shrink-0">
        <label className="block text-sm font-medium text-blue-100 mb-2">
          O que você precisa cadastrar/consultar?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Eu tenho uma tabela 'agentes' com id, nome, paroquia e função. Preciso de uma API completa (CRUD) para gerenciar esses dados conectando no meu Postgres local."
          className="w-full h-32 bg-black/20 border border-blue-500/30 rounded-lg p-3 text-white placeholder-blue-300/30 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none custom-scrollbar"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`
              px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg
              ${loading 
                ? 'bg-blue-800 text-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#5566D0] to-cyan-500 hover:from-blue-600 hover:to-cyan-400 text-white shadow-blue-500/25'}
            `}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Gerando Código...
              </span>
            ) : (
              'Gerar Código da API'
            )}
          </button>
        </div>
      </GlassCard>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm animate-fade-in flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <p className="font-bold">Erro</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {result && (
        <GlassCard className="flex-1 overflow-auto animate-fade-in border-green-500/30 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-xl font-bold text-green-300">{result.title}</h3>
            <span className="text-xs bg-green-900/50 text-green-300 px-2 py-1 rounded border border-green-500/30">Node.js Express</span>
          </div>
          
          <p className="text-sm text-slate-300 mb-4 italic border-l-2 border-slate-500 pl-3 flex-shrink-0">
            {result.explanation}
          </p>

          <div className="relative group flex-1 overflow-hidden rounded-lg border border-white/10 shadow-inner">
            <pre className="bg-[#0d1117] p-4 h-full overflow-auto text-xs md:text-sm font-mono text-blue-100 custom-scrollbar">
              <code>{result.code}</code>
            </pre>
            <button 
              onClick={() => navigator.clipboard.writeText(result.code)}
              className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 p-2 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur"
            >
              Copiar
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
