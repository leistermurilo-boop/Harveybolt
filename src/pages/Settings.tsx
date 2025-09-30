import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, Building } from 'lucide-react';

export default function Settings() {
  const { company, refreshCompany } = useAuth();
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setName(company.name);
      setCnpj(company.cnpj);
      setEmail(company.email);
      setPhone(company.phone);
      setAddress(company.address);
      setLogoUrl(company.logo_url);
    }
  }, [company]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logos/${company.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', company.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
      }

      setLogoUrl(publicUrl);
      await refreshCompany();
      setSuccess('Logo atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message || 'Erro ao fazer upload do logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name,
          cnpj,
          email,
          phone,
          address,
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      await refreshCompany();
      setSuccess('Dados atualizados com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          Logo e Timbrado da Empresa
        </h2>

        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-slate-200">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building className="w-12 h-12 text-slate-400" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-5 h-5" />
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </span>
            </label>
            <p className="text-sm text-slate-600 mt-2">
              Formatos aceitos: PNG, JPG. Tamanho recomendado: 400x400px
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Este logo será aplicado automaticamente nos documentos gerados pela IA.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          Dados da Empresa
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Endereço Completo
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Preview do Timbrado</h3>
        <p className="text-sm text-slate-600 mb-4">
          Assim ficará o cabeçalho dos documentos gerados:
        </p>
        <div className="bg-white rounded-lg border-2 border-slate-300 p-6">
          <div className="flex items-start gap-4 pb-4 border-b-2 border-slate-900">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-lg text-slate-900">{name || 'Nome da Empresa'}</h4>
              <p className="text-sm text-slate-700 mt-1">
                {cnpj || 'CNPJ: 00.000.000/0000-00'}
              </p>
              {address && (
                <p className="text-sm text-slate-700">{address}</p>
              )}
              {email && (
                <p className="text-sm text-slate-700">
                  {email} {phone && `| ${phone}`}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <p>[Conteúdo do documento gerado pela IA aparecerá aqui]</p>
          </div>
        </div>
      </div>
    </div>
  );
}
