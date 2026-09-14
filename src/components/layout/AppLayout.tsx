import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NavPage } from '../../types';

interface AppLayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  onOpenCreateModal,
  onOpenImportModal,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0d12] text-zinc-200">
      {/* Sidebar navigation */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main content container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top desktop bar */}
        <Topbar
          onOpenCreateModal={onOpenCreateModal}
          onOpenImportModal={onOpenImportModal}
          onNavigate={onNavigate}
        />

        {/* Scrollable page canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0a0b10]">
          {children}
        </main>
      </div>
    </div>
  );
};
