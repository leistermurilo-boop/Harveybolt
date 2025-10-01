import { useState, useEffect } from 'react';
import { supabase, Case, Document, GeneratedDoc } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { generateDocument } from '../lib/documentGenerator';
import { ArrowLeft, Upload, FileText, Sparkles, Download, X } from 'lucide-react';

type CaseDetailProps = {
  caseId: string;
  onBack: () => void;
};

type Tab = 'documents' | 'generated' | 'letterhead';

export default function CaseDetail({ caseId, onBack }: CaseDetailProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    loadCase();
    loadDocuments();
    loadGeneratedDocs();
  }, [caseId]);

  const loadCase = async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    if (!error && data) {
      setCaseData(data);
    }
    setLoading(false);
  };

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
  };

  const loadGeneratedDocs = async () => {
    const { data, error } = await supabase
      .from('generated_docs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGeneratedDocs(data);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: Document['type']) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${caseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { error: insertError } = await supabase.from('documents').insert({
        case_id: caseId,
        filename: file.name,
        type,
        storage_path: fileName,
        file_size: file.size,
      });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Erro ao salvar no banco: ${insertError.message}`);
      }

      await loadDocuments();
      alert('Arquivo enviado com sucesso!');
    } catch (error: any) {
      console.error('Full upload error:', error);
      alert(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      edital: 'Edital',
      recurso_concorrente: 'Recurso de Concorrente',
      outros: 'Outros',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  if (!caseData) {
    return <div className="text-center py-8">Caso não encontrado</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
          <p className="text-slate-600 mt-1">
            Processo {caseData.process_number} - {caseData.agency}
          </p>
        </div>
      </div>

      {caseData.description && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-slate-700">{caseData.description}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('generated')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'generated'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Peças Geradas
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Documentos Anexados</h3>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Sparkles className="w-5 h-5" />
                  Gerar Documento
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['edital', 'recurso_concorrente', 'outros'].map((type) => (
                  <label
                    key={type}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      uploading
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                        : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, type as Document['type'])}
                      disabled={uploading}
                    />
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">
                      {getDocTypeLabel(type)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX</p>
                  </label>
                ))}
              </div>

              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{doc.filename}</p>
                          <p className="text-sm text-slate-600">
                            {getDocTypeLabel(doc.type)} - {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">
                        {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'generated' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Peças Jurídicas Geradas</h3>

              {generatedDocs.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">
                    Nenhuma peça gerada ainda
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Use a IA para gerar documentos jurídicos automaticamente.
                  </p>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    Gerar Primeira Peça
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {generatedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-slate-900">{doc.doc_type}</p>
                          <p className="text-sm text-slate-600">
                            Gerado em {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.open(doc.docx_url, '_blank')}
                        disabled={!doc.docx_url}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                        Baixar DOCX
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showGenerateModal && (
        <GenerateDocModal
          caseId={caseId}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            loadGeneratedDocs();
            setShowGenerateModal(false);
            setActiveTab('generated');
          }}
        />
      )}
    </div>
  );
}

type GenerateDocModalProps = {
  caseId: string;
  onClose: () => void;
  onSuccess: () => void;
};

function GenerateDocModal({ caseId, onClose, onSuccess }: GenerateDocModalProps) {
  const { company } = useAuth();
  const [docType, setDocType] = useState('');
  const [params, setParams] = useState('');
  const [generating, setGenerating] = useState(false);
  const [caseData, setCaseData] = useState<Case | null>(null);

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const loadCase = async () => {
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .maybeSingle();

    if (!error && data) {
      setCaseData(data);
    }
  };

  const docTypes = [
    { value: 'recurso_administrativo', label: 'Recurso Administrativo' },
    { value: 'contrarrazoes', label: 'Contrarrazões de Recurso' },
    { value: 'substituicao_marca', label: 'Solicitação de Substituição de Marca' },
    { value: 'prorrogacao_prazo', label: 'Solicitação de Prorrogação de Prazo' },
    { value: 'defesa_notificacao', label: 'Defesa contra Notificação' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company || !caseData) {
      alert('Dados da empresa ou caso não encontrados');
      return;
    }

    setGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      let logoBlob: Blob | undefined;
      if (company.logo_url) {
        try {
          const response = await fetch(company.logo_url);
          logoBlob = await response.blob();
        } catch (error) {
          console.warn('Failed to fetch logo:', error);
        }
      }

      const docBlob = await generateDocument({
        docType: docType as any,
        company,
        caseData,
        parameters: params,
        logoBlob,
      });

      const fileName = `${Date.now()}.docx`;
      const filePath = `generated/${caseId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, docBlob, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const docLabel = docTypes.find(d => d.value === docType)?.label || docType;
      const { error: insertError } = await supabase.from('generated_docs').insert({
        case_id: caseId,
        doc_type: docLabel,
        content: 'Documento DOCX gerado com sucesso',
        parameters: { params, docType },
        docx_url: publicUrl,
      });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Erro ao salvar no banco: ${insertError.message}`);
      }

      alert('Documento gerado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Generate error:', error);
      alert(error.message || 'Erro ao gerar documento');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Gerar Documento Jurídico</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tipo de Documento *
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecione o tipo</option>
              {docTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Parâmetros e Contexto
            </label>
            <textarea
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
              placeholder="Descreva detalhes relevantes que devem ser incluídos no documento..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={generating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Gerando documento (3-5s)...' : 'Gerar Documento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
