import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Case } from '../lib/supabase';
import { Plus, FolderOpen, FileText, CheckCircle } from 'lucide-react';

type DashboardStats = {
  totalCases: number;
  activeCases: number;
  completedCases: number;
};

type DashboardProps = {
  onCaseClick: (caseId: string) => void;
  onNewCase: () => void;
};

export default function Dashboard({ onCaseClick, onNewCase }: DashboardProps) {
  const { company } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    completedCases: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      loadCases();
    }
  }, [company]);

  const loadCases = async () => {
    if (!company) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCases(data);
      setStats({
        totalCases: data.length,
        activeCases: data.filter((c) => c.status === 'active').length,
        completedCases: data.filter((c) => c.status === 'completed').length,
      });
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-slate-100 text-slate-800',
    };
    const labels = {
      active: 'Ativo',
      completed: 'Concluído',
      archived: 'Arquivado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total de Casos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCases}</p>
            </div>
            <FolderOpen className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Casos Ativos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.activeCases}</p>
            </div>
            <FileText className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Casos Concluídos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.completedCases}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Casos de Licitação</h2>
          <button
            onClick={onNewCase}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Caso
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-600">Carregando...</div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum caso cadastrado</h3>
              <p className="text-slate-600 mb-6">Comece criando seu primeiro caso de licitação.</p>
              <button
                onClick={onNewCase}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar Primeiro Caso
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => onCaseClick(c.id)}
                  className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">{c.title}</h3>
                    {getStatusBadge(c.status)}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium">Processo:</span> {c.process_number}
                    </p>
                    <p>
                      <span className="font-medium">Órgão:</span> {c.agency}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
