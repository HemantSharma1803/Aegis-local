import React, { useState, useRef, useEffect } from 'react';
import {
  FolderKanban,
  Shield,
  Cpu,
  Plus,
  FolderOpen,
  ChevronDown,
  Check,
  X,
  FileCode,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { WindowControls } from './WindowControls';
import { Badge } from '../ui/Badge';
import { NavPage, Project } from '../../types';

interface TopbarProps {
  onOpenCreateModal: () => void;
  onOpenImportModal: () => void;
  onNavigate: (page: NavPage) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCreateModal,
  onOpenImportModal,
  onNavigate,
}) => {
  const {
    projects,
    activeProject,
    hasProject,
    loadDemoProject,
    closeProject,
    setActiveProjectById,
  } = useProject();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSwitcherOpen(false);
    };

    if (isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSwitcherOpen]);

  const activeProjectName = activeProject ? activeProject.name || activeProject.title : '';

  return (
    <header className="h-12 bg-[#0c0e14] border-b border-zinc-800/80 px-4 flex items-center justify-between select-none z-30 relative">
      {/* Left: Project Selector & Switcher */}
      <div className="flex items-center gap-3" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border text-xs transition-all cursor-pointer ${
              isSwitcherOpen
                ? 'border-zinc-500 bg-zinc-800/80 text-zinc-100'
                : 'border-zinc-800 hover:border-zinc-700 text-zinc-200'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-mono text-[11px]">PROJECT:</span>
            {hasProject && activeProject ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-100 truncate max-w-[180px] sm:max-w-[240px]">
                  {activeProjectName}
                </span>
                {activeProject.isDemo && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/70 text-sky-400 border border-sky-800/50">
                    Demo
                  </span>
                )}
              </div>
            ) : (
              <span className="text-zinc-400 italic">No Project Loaded</span>
            )}
            <ChevronDown
              className={`w-3 h-3 text-zinc-400 ml-1 transition-transform ${
                isSwitcherOpen ? 'rotate-180 text-zinc-200' : ''
              }`}
            />
          </button>

          {/* Project Switcher Dropdown */}
          {isSwitcherOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-[#11131c] border border-zinc-700/80 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
              <div className="px-2.5 py-1.5 border-b border-zinc-800/80 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold tracking-wider">
                  Workspace Projects
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {projects.length} available
                </span>
              </div>

              {/* Projects List */}
              <div className="max-h-56 overflow-y-auto py-1.5 space-y-1">
                {projects.length === 0 ? (
                  <div className="p-3 text-center text-xs text-zinc-500 italic">
                    No projects saved yet
                  </div>
                ) : (
                  projects.map((proj: Project) => {
                    const isSelected = activeProject?.id === proj.id;
                    const projName = proj.name || proj.title || 'Untitled Project';

                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          setActiveProjectById(proj.id);
                          setIsSwitcherOpen(false);
                          onNavigate('project');
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60'
                            : 'hover:bg-zinc-800/50 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isSelected ? 'bg-emerald-400' : 'bg-zinc-600'
                            }`}
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium truncate">{projName}</span>
                              {proj.isDemo && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-sky-950/60 text-sky-400 border border-sky-800/40">
                                  Demo
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 block truncate">
                              {proj.files?.length || 0} file(s) •{' '}
                              {proj.isDemo ? 'Built-in reference' : 'Local'}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Switcher Actions Footer */}
              <div className="pt-1.5 border-t border-zinc-800/80 mt-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSwitcherOpen(false);
                    onOpenCreateModal();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Create New Project</span>
                </button>

                {(!activeProject || !activeProject.isDemo) && (
                  <button
                    type="button"
                    onClick={() => {
                      loadDemoProject();
                      setIsSwitcherOpen(false);
                      onNavigate('project');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                    <span>Open Aegis Journal Demo</span>
                  </button>
                )}

                {hasProject && (
                  <button
                    type="button"
                    onClick={() => {
                      closeProject();
                      setIsSwitcherOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Close Current Project</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick buttons when no project is open */}
        {!hasProject && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={loadDemoProject}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FolderOpen className="w-3 h-3 text-sky-400" />
              <span>Aegis Journal Demo</span>
            </button>
            <span className="text-zinc-700">|</span>
            <button
              onClick={onOpenCreateModal}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>New Project</span>
            </button>
          </div>
        )}
      </div>

      {/* Center: System Status */}
      <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-zinc-300 font-medium">On-Device Sandbox</span>
          <span className="text-zinc-600 font-mono">|</span>
          <span className="text-zinc-400 font-mono">Local Storage</span>
        </div>
      </div>

      {/* Right: Quick actions and Window Chrome */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('privacy')}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors cursor-pointer"
          title="Privacy Architecture"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline text-[11px]">Local Perimeter</span>
        </button>

        <button
          onClick={() => onNavigate('settings')}
          className="text-xs text-zinc-400 hover:text-zinc-200 p-1.5 rounded hover:bg-zinc-800/50 transition-colors cursor-pointer"
          title="Settings"
        >
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {/* Windows Desktop Window controls */}
        <div className="pl-2 border-l border-zinc-800/80">
          <WindowControls />
        </div>
      </div>
    </header>
  );
};
