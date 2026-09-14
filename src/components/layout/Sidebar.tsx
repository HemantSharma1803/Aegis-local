import React from 'react';
import {
  Home,
  FolderGit2,
  MessageSquare,
  Compass,
  Gavel,
  Mic,
  CheckCircle2,
  ShieldCheck,
  Settings,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { NavPage } from '../../types';
import { AegisLogo } from '../brand/AegisLogo';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { activeProject } = useProject();

  const navItems: Array<{
    id: NavPage;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    hasActiveDot?: boolean;
  }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    {
      id: 'project',
      label: 'Project',
      icon: <FolderGit2 className="w-4 h-4" />,
      badge: activeProject
        ? activeProject.isDemo
          ? 'Demo Active'
          : `${activeProject.files?.length || 0} files`
        : undefined,
      hasActiveDot: !!activeProject,
    },
    { id: 'ask-aegis', label: 'Ask Aegis', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'prepare-me', label: 'Prepare Me', icon: <Compass className="w-4 h-4" /> },
    { id: 'judge-mode', label: 'Judge Mode', icon: <Gavel className="w-4 h-4" /> },
    { id: 'voice-practice', label: 'Voice Practice', icon: <Mic className="w-4 h-4" /> },
    { id: 'readiness', label: 'Readiness', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-full bg-[#0e1017] border-r border-zinc-800/80 flex flex-col justify-between select-none z-20 flex-shrink-0">
      {/* Top Header / Brand */}
      <div className="flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
          <AegisLogo size="md" showText={true} />
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1" aria-label="Main Navigation">
          <div className="px-2 pb-1.5 pt-2 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            Workspace
          </div>

          {navItems.slice(0, 6).map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group outline-none cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
                    {item.badge}
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                ) : null}
              </button>
            );
          })}

          <div className="px-2 pb-1.5 pt-4 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            System & Security
          </div>

          {navItems.slice(6).map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group outline-none cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800/90 text-zinc-100 font-semibold shadow-sm border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-zinc-100' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom status indicator (Local-first status) */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-zinc-200">
                Local-first workspace
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                No external telemetry
              </span>
            </div>
          </div>
          <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      </div>
    </aside>
  );
};
