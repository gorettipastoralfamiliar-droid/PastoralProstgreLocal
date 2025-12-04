
import React, { useState, useEffect } from 'react';
import { Member, LogType } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface RegistrationFormProps {
  onBack: () => void;
  addLog: (type: LogType, message: string, details?: string) => void;
  serverUrl: string;
  initialData?: Member | null; // Dados para edição
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack, addLog, serverUrl, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [compressingInfo, setCompressingInfo] = useState('');
  
  const API_URL = serverUrl.replace(/\/$/, '');

  const [formData, setFormData] = useState<Member>({
    nome_completo: '',
    login: '',
    data_nascimento: '',
    estado_civil: 'Solteiro(a)',
    telefone: '',
    email: '',
    cep: '',
    logradouro: '',
    bairro: '',
    cidade: '',
    uf: '',
    possui_veiculo: false,
    paroquia: '',
    comunidade: '',
    setor: '',
    funcao: '',
    data_ingresso: new Date().toISOString().split('T')[0],
    observacoes: '',
    foto: '' 
  });

  // Carrega dados se for edição
  useEffect(() => {
      if (initialData) {
          setFormData({
              ...initialData,
              // Garante formatação correta de datas para o input type="date"
              data_nascimento: initialData.data_nascimento ? initialData.data_nascimento.split('T')[0] : '',
              data_casamento: initialData.data_casamento ? initialData.data_casamento.split('T')[0] : '',
              data_ingresso: initialData.data_ingresso ? initialData.data_ingresso.split('T')[0] : '',
          });
      }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Máscara de CEP
    if (name === 'cep') {
        const numbers = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: numbers }));
        if (numbers.length === 8) {
            fetchAddress(numbers);
        }
        return;
    }

    // Máscara de Telefone (XX) XXXXX-XXXX
    if (name === 'telefone') {
        let nums = value.replace(/\D/g, '');
        if (nums.length > 11) nums = nums.slice(0, 11);
        
        let formatted = nums;
        if (nums.length > 2) {
            formatted = `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
        }
        if (nums.length > 7) {
            formatted = `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
        }
        
        setFormData(prev => ({ ...prev, [name]: formatted }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          setCompressingInfo('Otimizando imagem...');
          const compressedBase64 = await compressImage(file);
          setFormData(prev => ({ ...prev, foto: compressedBase64 }));
          setCompressingInfo('');
      } catch (error) {
          console.error("Erro ao comprimir imagem", error);
          alert("Erro ao processar imagem. Tente outra.");
          setCompressingInfo('');
      }
    }
  };

  const fetchAddress = async (cepInput: string) => {
    if (!cepInput || cepInput.length !== 8) return;
    setCepLoading(true);
    addLog('info', `Buscando CEP: ${cepInput}...`);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepInput}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        addLog('warning', `CEP ${cepInput} não encontrado na base do ViaCEP.`);
        alert("CEP não encontrado!");
        setFormData(prev => ({ ...prev, logradouro: '', bairro: '', cidade: '', uf: '' }));
      } else {
        addLog('success', `CEP Encontrado: ${data.localidade}-${data.uf}`);
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }));
      }
    } catch (error) {
      addLog('error', `Falha ao conectar com ViaCEP`, String(error));
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepBlur = () => {
      const cepLimpo = formData.cep.replace(/\D/g, '');
      if (cepLimpo.length === 8) {
          fetchAddress(cepLimpo);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const isEdit = !!initialData?.id;
    const url = isEdit ? `${API_URL}/api/membros/${initialData.id}` : `${API_URL}/api/membros`;
    const method = isEdit ? 'PUT' : 'POST';

    addLog('info', `${isEdit ? 'Atualizando' : 'Cadastrando'} agente...`, `${method} ${url}`);
    
    try {
        const response = await fetch(url, {
            method: method,
            mode: 'cors',
            headers: { 
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify(formData)
        });

        const text = await response.text();

        if (response.ok) {
            addLog('success', `Agente ${isEdit ? 'atualizado' : 'cadastrado'} com sucesso!`);
            alert(isEdit ? 'Atualização realizada!' : 'Cadastro realizado!');
            onBack();
        } else {
            throw new Error(`Status ${response.status}: ${text}`);
        }

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('Failed to fetch')) {
            addLog('error', 'Bloqueio de CORS ou Rede', `Se for edição, verifique se o server.js tem a rota PUT.`);
            alert(`Falha de Conexão.\n\nSe estiver editando, atualize seu 'server.js' para a Versão 6 (Com PUT).`);
        } else {
            addLog('error', 'O servidor recusou a operação', errorMsg);
            alert(`Erro: ${errorMsg}`);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pb-24 animate-fade-in relative text-slate-100">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">{initialData ? 'Editar Agente' : 'Novo Agente'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Left Column: Personal Data */}
            <div className="md:col-span-8 space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Dados Pessoais
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-shrink-0 flex justify-center md:justify-start">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-800/50 border-2 border-dashed border-blue-400/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                {formData.foto ? (
                                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <svg className="w-8 h-8 text-blue-400/50 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] text-blue-300/50">Foto</span>
                                    </div>
                                )}
                                </div>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                {compressingInfo && <div className="absolute -bottom-6 left-0 w-full text-center text-[10px] text-green-400 animate-pulse">{compressingInfo}</div>}
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <InputField label="Nome Completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Login (Usuário)" name="login" value={formData.login} onChange={handleChange} required />
                                <InputField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Nascimento" type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
                        <SelectField label="Estado Civil" name="estado_civil" value={formData.estado_civil} onChange={handleChange} options={['Solteiro(a)', 'Casado(a)', 'Viúvo(a)', 'Separado(a)']} />
                        <InputField label="Telefone" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(XX) 9XXXX-XXXX" required />
                    </div>

                    {formData.estado_civil === 'Casado(a)' && (
                    <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <InputField label="Nome do Cônjuge" name="nome_conjuge" value={formData.nome_conjuge || ''} onChange={handleChange} />
                        <InputField label="Data Casamento" type="date" name="data_casamento" value={formData.data_casamento || ''} onChange={handleChange} />
                    </div>
                    )}
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 space-y-4 relative overflow-hidden transition-all">
                     {cepLoading && (
                         <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                             <div className="flex items-center gap-3">
                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                                 <span className="text-sm font-medium text-blue-200">Buscando endereço...</span>
                             </div>
                         </div>
                     )}

                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Endereço
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="md:col-span-1 relative">
                            <label className="text-xs text-blue-200 ml-1 block font-medium">CEP</label>
                            <div className="relative flex items-center">
                                <input 
                                    name="cep" 
                                    value={formData.cep} 
                                    onChange={handleChange}
                                    onBlur={handleCepBlur}
                                    required 
                                    placeholder="00000000" 
                                    maxLength={8} 
                                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-4 pr-10 py-2 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400 transition-all text-sm"
                                />
                                <button 
                                    type="button"
                                    onClick={() => fetchAddress(formData.cep.replace(/\D/g, ''))}
                                    className="absolute right-2 p-1.5 text-blue-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                                    title="Buscar Endereço"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </button>
                            </div>
                         </div>
                         <div className="md:col-span-3">
                            <InputField label="Logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} required disabled={cepLoading} />
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} required disabled={cepLoading} />
                        <InputField label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} required disabled={cepLoading} />
                        <InputField label="UF" name="uf" value={formData.uf} onChange={handleChange} required maxLength={2} disabled={cepLoading} />
                    </div>
                </div>
            </div>

            {/* Right Column: Pastoral Info */}
            <div className="md:col-span-4 space-y-6">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        Dados da Pastoral
                    </h3>
                    
                    <InputField label="Paróquia" name="paroquia" value={formData.paroquia} onChange={handleChange} required />
                    <InputField label="Comunidade" name="comunidade" value={formData.comunidade} onChange={handleChange} required />
                    
                    <SelectField 
                        label="Setor" 
                        name="setor" 
                        value={formData.setor} 
                        onChange={handleChange} 
                        options={['Pré-Matrimonial', 'Pós-Matrimonial', 'Casos Especiais']} 
                        required 
                    />

                    <SelectField 
                        label="Função" 
                        name="funcao" 
                        value={formData.funcao} 
                        onChange={handleChange} 
                        options={['Agente', 'Coordenador Paroquial', 'Vice Coordenador', 'Coordenador Setor', 'Secretário', 'Tesoureiro']} 
                        required 
                    />
                    
                    <InputField label="Data de Ingresso" type="date" name="data_ingresso" value={formData.data_ingresso} onChange={handleChange} required />
                </div>

                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Outros
                    </h3>
                    
                    <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                        <span className="text-sm text-slate-300">Possui Veículo?</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="possui_veiculo" checked={formData.possui_veiculo} onChange={handleCheckboxChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                    </div>

                    {formData.possui_veiculo && (
                        <InputField label="Modelo do Veículo" name="modelo_veiculo" value={formData.modelo_veiculo || ''} onChange={handleChange} className="animate-fade-in" />
                    )}

                    <div className="space-y-1">
                        <label className="text-xs text-blue-200 ml-1">Observações</label>
                        <textarea 
                            name="observacoes" 
                            value={formData.observacoes || ''} 
                            onChange={handleChange}
                            rows={4}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 md:py-3 text-white focus:outline-none focus:border-blue-400 transition-colors resize-none text-sm"
                        />
                    </div>
                </div>

                <button
                type="submit"
                disabled={loading || !!compressingInfo}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1
                    ${loading || !!compressingInfo
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-600/30 active:scale-95'}
                `}
                >
                {loading ? 'Salvando...' : compressingInfo ? 'Processando foto...' : (initialData ? 'Salvar Alterações' : 'Realizar Cadastro')}
                </button>
            </div>
        </div>

      </form>
    </div>
  );
};

const InputField = ({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-xs text-blue-200 ml-1 block font-medium">{label}</label>
    <input 
      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      {...props}
    />
  </div>
);

const SelectField = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: string[] }) => (
  <div className="space-y-1">
    <label className="text-xs text-blue-200 ml-1 block font-medium">{label}</label>
    <div className="relative">
        <select 
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 md:py-3 text-white focus:outline-none focus:border-blue-400 transition-all appearance-none text-sm"
        {...props}
        >
        <option value="" disabled className="bg-slate-800 text-slate-400">Selecione...</option>
        {options.map(opt => <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
    </div>
  </div>
);
