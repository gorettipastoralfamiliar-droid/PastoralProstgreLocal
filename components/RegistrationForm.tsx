import React, { useState } from 'react';
import { Member } from '../types';

interface RegistrationFormProps {
  onBack: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  
  // Initial state matching the DB schema
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
    foto: '' // Base64 string will go here
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Mask logic for CEP (optional strictly visual, but good for UX)
    if (name === 'cep') {
        const numbers = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: numbers }));
        if (numbers.length === 8) {
            fetchAddress(numbers);
        }
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchAddress = async (cep: string) => {
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        }));
      } else {
        // Optional: Notify user CEP not found
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setCepLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // This is where you would call your backend API
    // const response = await fetch('http://YOUR_HOME_SERVER_IP:3000/api/membros', { ... })
    
    setTimeout(() => {
      setLoading(false);
      alert("Simulação: Cadastro enviado com sucesso!\n\nVerifique a aba 'Configurar Servidor' (clique no logo da tela inicial) para pegar o código do backend.");
      onBack();
    }, 1500);
  };

  return (
    <div className="p-6 pb-24 animate-fade-in relative text-slate-100">
      
      {/* Navbarish header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur text-white transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-2xl font-bold tracking-tight">Novo Agente</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Responsive Grid Layout: On Mobile 1 col, on Desktop 2 cols gap */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

            {/* Left Column: Photo & Personal Data */}
            <div className="md:col-span-8 space-y-6">
                 {/* Section: Basic Info */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Dados Pessoais
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                         {/* Photo Uploader */}
                        <div className="flex-shrink-0 flex justify-center md:justify-start">
                            <div className="relative group cursor-pointer">
                                <div className="w-28 h-28 rounded-2xl bg-slate-800/50 border-2 border-dashed border-blue-400/50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                                {formData.foto ? (
                                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <svg className="w-8 h-8 text-blue-400/50 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] text-blue-300/50">Adicionar Foto</span>
                                    </div>
                                )}
                                </div>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>

                        {/* Name & Login Fields */}
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
                        <InputField label="Telefone / WhatsApp" name="telefone" value={formData.telefone} onChange={handleChange} placeholder="(XX) 9XXXX-XXXX" required />
                    </div>

                    {formData.estado_civil === 'Casado(a)' && (
                    <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <InputField label="Nome do Cônjuge" name="nome_conjuge" value={formData.nome_conjuge || ''} onChange={handleChange} />
                        <InputField label="Data Casamento" type="date" name="data_casamento" value={formData.data_casamento || ''} onChange={handleChange} />
                    </div>
                    )}
                </div>

                {/* Section: Address (ViaCEP) */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4 relative overflow-hidden">
                     {/* Loading Indicator for ViaCEP */}
                     {cepLoading && (
                         <div className="absolute top-0 right-0 p-4">
                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                         </div>
                     )}
                    <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Endereço
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="md:col-span-1">
                            <InputField 
                                label="CEP" 
                                name="cep" 
                                value={formData.cep} 
                                onChange={handleChange} 
                                required 
                                placeholder="00000000"
                                maxLength={8}
                            />
                         </div>
                         <div className="md:col-span-3">
                            <InputField label="Logradouro" name="logradouro" value={formData.logradouro} onChange={handleChange} required />
                         </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField label="Bairro" name="bairro" value={formData.bairro} onChange={handleChange} required />
                        <InputField label="Cidade" name="cidade" value={formData.cidade} onChange={handleChange} required />
                        <InputField label="UF" name="uf" value={formData.uf} onChange={handleChange} required maxLength={2} placeholder="SP" />
                    </div>
                </div>
            </div>

            {/* Right Column: Church Info & Other */}
            <div className="md:col-span-4 space-y-6">
                
                 {/* Section: Pastoral Details */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
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

                {/* Section: Additional Info */}
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
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
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors resize-none text-sm"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                type="submit"
                disabled={loading}
                className={`
                    w-full py-4 rounded-xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1
                    ${loading 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-600/30 active:scale-95'}
                `}
                >
                {loading ? 'Salvando...' : 'Realizar Cadastro'}
                </button>
            </div>
        </div>

      </form>
    </div>
  );
};

// Reusable Helper Components for the form
const InputField = ({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="text-xs text-blue-200 ml-1 block font-medium">{label}</label>
    <input 
      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all text-sm"
      {...props}
    />
  </div>
);

const SelectField = ({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, options: string[] }) => (
  <div className="space-y-1">
    <label className="text-xs text-blue-200 ml-1 block font-medium">{label}</label>
    <div className="relative">
        <select 
        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-all appearance-none text-sm"
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