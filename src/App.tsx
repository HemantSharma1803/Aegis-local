import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavPage } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { AppLayout } from './components/layout/AppLayout';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { ImportProjectModal } from './components/modals/ImportProjectModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { AskAegisPage } from './pages/AskAegisPage';
import { PrepareMePage } from './pages/PrepareMePage';
import { JudgeModePage } from './pages/JudgeModePage';
import { VoicePracticePage } from './pages/VoicePracticePage';
import { ReadinessPage } from './pages/ReadinessPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SettingsPage } from './pages/SettingsPage';

const MainAppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('home');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { createProject, importFiles } = useProject();

  const handleCreateProjectSubmit = (name: string, description: string, goal: string) => {
    createProject(name, description, goal);
    setCurrentPage('project');
  };

  const handleImportFilesSubmit = (files: File[]) => {
    importFiles(files);
    setCurrentPage('project');
  };

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      onOpenCreateModal={() => setIsCreateModalOpen(true)}
      onOpenImportModal={() => setIsImportModalOpen(true)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {currentPage === 'home' && (
            <HomePage
              onNavigate={setCurrentPage}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenImportModal={() => setIsImportModalOpen(true)}
            />
          )}

          {currentPage === 'project' && (
            <ProjectPage
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
          )}

          {currentPage === 'ask-aegis' && (
            <AskAegisPage
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onNavigateToSettings={() => setCurrentPage('settings')}
              onNavigateToProject={() => setCurrentPage('project')}
            />
          )}

          {currentPage === 'prepare-me' && (
            <PrepareMePage
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onNavigateToJudge={() => setCurrentPage('judge-mode')}
              onNavigateToProject={() => setCurrentPage('project')}
              onNavigateToSettings={() => setCurrentPage('settings')}
            />
          )}

          {currentPage === 'judge-mode' && (
            <JudgeModePage
              onNavigateToProject={() => setCurrentPage('project')}
              onNavigateToSettings={() => setCurrentPage('settings')}
            />
          )}

          {currentPage === 'voice-practice' && (
            <VoicePracticePage
              onNavigateToReadiness={() => setCurrentPage('readiness')}
              onNavigateToProject={() => setCurrentPage('project')}
            />
          )}

          {currentPage === 'readiness' && (
            <ReadinessPage
              onNavigateToJudge={() => setCurrentPage('judge-mode')}
              onNavigateToVoice={() => setCurrentPage('voice-practice')}
              onNavigateToPrepare={() => setCurrentPage('prepare-me')}
            />
          )}

          {currentPage === 'privacy' && <PrivacyPage />}

          {currentPage === 'settings' && <SettingsPage />}
        </motion.div>
      </AnimatePresence>

      {/* Reusable Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProjectSubmit}
      />

      <ImportProjectModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportFilesSubmit}
        targetProjectName={useProject().activeProject?.name}
      />
    </AppLayout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ProjectProvider>
          <MainAppContent />
        </ProjectProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
