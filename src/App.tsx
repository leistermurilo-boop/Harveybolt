import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import CaseDetail from './pages/CaseDetail';
import Layout from './components/Layout';
import NewCaseModal from './components/NewCaseModal';

type Page = 'dashboard' | 'settings' | 'caseDetail';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPage('caseDetail');
  };

  const handleBackFromCase = () => {
    setSelectedCaseId(null);
    setCurrentPage('dashboard');
  };

  const handleNewCase = () => {
    setShowNewCaseModal(true);
  };

  const handleCaseCreated = () => {
    setShowNewCaseModal(false);
    if (currentPage === 'dashboard') {
      window.location.reload();
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage === 'caseDetail' ? 'dashboard' : currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSelectedCaseId(null);
        }}
      >
        {currentPage === 'dashboard' && (
          <Dashboard onCaseClick={handleCaseClick} onNewCase={handleNewCase} />
        )}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'caseDetail' && selectedCaseId && (
          <CaseDetail caseId={selectedCaseId} onBack={handleBackFromCase} />
        )}
      </Layout>

      <NewCaseModal
        isOpen={showNewCaseModal}
        onClose={() => setShowNewCaseModal(false)}
        onSuccess={handleCaseCreated}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
