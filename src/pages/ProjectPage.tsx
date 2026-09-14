import React, { useState } from 'react';
import {
  FolderGit2,
  FileCode,
  FileText,
  Boxes,
  Cpu,
  HelpCircle,
  FolderOpen,
  UploadCloud,
  File,
  Info,
  ShieldCheck,
  Calendar,
  Target,
  Edit3,
  Trash2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useProject } from '../context/ProjectContext';
import { EditProjectModal } from '../components/modals/EditProjectModal';
import { DeleteProjectModal } from '../components/modals/DeleteProjectModal';
import { DropZone } from '../components/files/DropZone';
import { FileList } from '../components/files/FileList';
import { FileDetailsModal } from '../components/files/FileDetailsModal';
import { FilePreviewModal } from '../components/files/FilePreviewModal';
import { RemoveFileModal } from '../components/files/RemoveFileModal';
import { DuplicateFileModal } from '../components/files/DuplicateFileModal';
import { KnowledgeOverview } from '../components/knowledge/KnowledgeOverview';
import {
  ProjectFile,
  DuplicateFileConflict,
  DuplicateResolutionAction,
  SUPPORTED_EXTENSIONS,
} from '../types/file';
import { fileRepository } from '../services/fileRepository';
import { validateFile } from '../services/storageService';
import { useToast } from '../context/ToastContext';

interface ProjectPageProps {
  onOpenImportModal: () => void;
  onOpenCreateModal?: () => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({
  onOpenImportModal,
  onOpenCreateModal,
}) => {
  const {
    activeProject,
    hasProject,
    loadDemoProject,
    updateProject,
    deleteProject,
    importFiles,
    importSingleFileWithResolution,
    removeProjectFile,
    projectKnowledge,
    projectContextData,
    isProcessingKnowledge,
    rebuildActiveProjectKnowledge,
  } = useProject();

  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // File action modals state
  const [selectedFileForDetails, setSelectedFileForDetails] = useState<ProjectFile | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<ProjectFile | null>(null);
  const [selectedFileForRemoval, setSelectedFileForRemoval] = useState<ProjectFile | null>(null);
  const [duplicateConflict, setDuplicateConflict] = useState<DuplicateFileConflict | null>(null);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not recorded';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  /**
   * Handle files dropped or picked directly in the ProjectPage dropzone
   */
  const handleDropzoneFiles = async (files: File[]) => {
    if (!activeProject) return;

    if (activeProject.isDemo) {
      toast.warning(
        'Demo Project Active',
        'Representative demo files are protected. Switch to or create a custom project to import your own files.'
      );
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error('Unsupported File', validation.error || "This file type isn't supported yet.");
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    if (validFiles.length === 1) {
      const single = validFiles[0];
      const existing = fileRepository.findDuplicateFile(activeProject.id, single.name);
      if (existing) {
        setDuplicateConflict({ file: single, existingFile: existing });
        return;
      }
    }

    await importFiles(validFiles);
  };

  const handleResolveDuplicate = async (action: DuplicateResolutionAction) => {
    if (!duplicateConflict) return;
    const fileToImport = duplicateConflict.file;
    setDuplicateConflict(null);
    await importSingleFileWithResolution(fileToImport, action);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* If no project is active: Polished empty state */}
      {!hasProject || !activeProject ? (
        <div className="py-12">
          <EmptyState
            badgeText="STAGE EMPTY"
            icon={<FolderGit2 className="w-6 h-6 text-zinc-400" />}
            title="No active project."
            description="Initialize a new local project to start preparing for your technical presentation defense, or open the built-in Aegis Journal demo to explore."
            action={
              onOpenCreateModal ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenCreateModal}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Create Project
                </Button>
              ) : undefined
            }
            secondaryAction={
              <Button
                variant="outline"
                size="sm"
                onClick={loadDemoProject}
                icon={<FolderOpen className="w-3.5 h-3.5" />}
              >
                Open Demo Project
              </Button>
            }
          />
        </div>
      ) : (
        /* Active Project View */
        <div className="space-y-8">
          {/* Top Header with Management Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                  {activeProject.name || activeProject.title}
                </h1>
                {activeProject.isDemo ? (
                  <Badge variant="info" size="sm">
                    Demo Project
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm" dot>
                    Active Local Project
                  </Badge>
                )}
                {activeProject.category && (
                  <Badge variant="neutral" size="sm">
                    {activeProject.category}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
                {activeProject.description || 'No description provided.'}
              </p>
            </div>

            {/* Management Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Edit Details
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={onOpenImportModal}
                icon={<UploadCloud className="w-3.5 h-3.5" />}
              >
                Import Files
              </Button>
            </div>
          </div>

          {/* Processing Indicator Banner */}
          {isProcessingKnowledge && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="font-semibold text-emerald-200">
                  Building project context…
                </span>
                <span className="text-zinc-400 hidden sm:inline">
                  (Extracting document text and normalizing project facts)
                </span>
              </div>
              <Badge variant="warning" size="sm" dot>
                Processing
              </Badge>
            </div>
          )}

          {/* Section 1: Overview */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                <span>Project Overview</span>
              </h2>
              <span className="text-[11px] font-mono text-zinc-500">
                ID: {activeProject.id}
              </span>
            </div>

            <Card variant="default" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                    Project Name
                  </span>
                  <p className="text-sm font-semibold text-zinc-200">
                    {activeProject.name || activeProject.title}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                    Category / Type
                  </span>
                  <p className="text-sm font-medium text-emerald-400 font-mono text-xs">
                    {activeProject.category || 'Custom Workspace'}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                    Created Date
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{formatDate(activeProject.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase text-zinc-500 block mb-1">
                    Storage Mode
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    {activeProject.isDemo ? 'In-Memory Reference Resources' : 'Isolated Local File Manifest'}
                  </span>
                </div>
              </div>

              {/* Description & Goal Details */}
              <div className="mt-6 pt-6 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold block">
                    Short Description
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {activeProject.description || 'No description recorded.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    <span>Project Goal</span>
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed italic">
                    {activeProject.goal || 'No goal specified for this project.'}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 2: Segment 4 Structured Knowledge Engine Overview */}
          {projectContextData.hasExtractedKnowledge ? (
            <KnowledgeOverview
              context={projectContextData}
              knowledge={projectKnowledge}
              onRefreshKnowledge={rebuildActiveProjectKnowledge}
              isProcessing={isProcessingKnowledge}
            />
          ) : (
            /* Fallback to baseline project concepts if files have not yet been extracted */
            (activeProject.problem ||
              activeProject.solution ||
              activeProject.technologies?.length ||
              activeProject.architectureConcepts?.length ||
              activeProject.potentialTopics?.length) && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
                    <Boxes className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Project Knowledge</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeProject.problem && (
                    <Card variant="subtle" className="p-5 space-y-2">
                      <span className="text-[11px] font-mono uppercase font-semibold text-amber-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Problem Statement
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        &quot;{activeProject.problem}&quot;
                      </p>
                    </Card>
                  )}

                  {activeProject.solution && (
                    <Card variant="subtle" className="p-5 space-y-2">
                      <span className="text-[11px] font-mono uppercase font-semibold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Proposed Solution
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        &quot;{activeProject.solution}&quot;
                      </p>
                    </Card>
                  )}
                </div>
              </section>
            )
          )}

          {/* Section 3: Project Files Area */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Project Files</span>
                  <span className="text-zinc-500 font-mono">
                    ({activeProject.files?.length || 0})
                  </span>
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-zinc-500">Supported formats:</span>
                  {SUPPORTED_EXTENSIONS.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase"
                    >
                      .{fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rebuildActiveProjectKnowledge}
                  disabled={isProcessingKnowledge || activeProject.files.length === 0}
                  icon={<RefreshCw className={`w-3.5 h-3.5 ${isProcessingKnowledge ? 'animate-spin' : ''}`} />}
                >
                  Refresh Context
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenImportModal}
                  icon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Import Files
                </Button>
              </div>
            </div>

            {/* Inline Drag-and-Drop Area for custom projects */}
            {!activeProject.isDemo && (
              <DropZone
                onFilesSelected={handleDropzoneFiles}
                isProcessing={isProcessingKnowledge}
                className="my-2"
              />
            )}

            {/* If files section is empty */}
            {(!activeProject.files || activeProject.files.length === 0) ? (
              <div className="py-6">
                <EmptyState
                  badgeText="PROJECT CONTEXT"
                  icon={<FileText className="w-6 h-6 text-zinc-400" />}
                  title="Build your project context"
                  description="Add the files that explain your project. Aegis will extract text and build structured project context."
                  action={
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onOpenImportModal}
                      icon={<UploadCloud className="w-3.5 h-3.5" />}
                    >
                      Import Files
                    </Button>
                  }
                  secondaryAction={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadDemoProject}
                      icon={<FolderOpen className="w-3.5 h-3.5" />}
                    >
                      Open Demo Project
                    </Button>
                  }
                />
              </div>
            ) : (
              /* If files exist: Display in file list */
              <div className="space-y-3">
                {activeProject.isDemo ? (
                  <div className="p-3.5 rounded-lg bg-sky-950/20 border border-sky-800/40 flex items-start gap-3 text-xs text-sky-300">
                    <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sky-200 flex items-center gap-2">
                        <span>Aegis Journal Reference Content</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-900/60 border border-sky-700/50">
                          DEMO CONTENT
                        </span>
                      </p>
                      <p className="text-zinc-400 mt-0.5 leading-relaxed">
                        These representative sample documents are parsed through the same knowledge pipeline to generate structured project concepts. They are reference resources and remain isolated from your local storage.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-zinc-300">
                        Local File System Isolation & Knowledge Extraction Active
                      </p>
                      <p className="text-zinc-400 mt-0.5 leading-relaxed">
                        Files are preserved in your local project workspace. Plain text and Markdown documents are normalized and indexed into the Project Knowledge Base with full source traceability.
                      </p>
                    </div>
                  </div>
                )}

                {/* File list */}
                <FileList
                  files={activeProject.files}
                  isDemoProject={activeProject.isDemo}
                  onOpenPreview={(file) => setSelectedFileForPreview(file)}
                  onViewDetails={(file) => setSelectedFileForDetails(file)}
                  onRequestRemove={(file) => setSelectedFileForRemoval(file)}
                />
              </div>
            )}
          </section>
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={activeProject}
        onSave={(id, updates) => updateProject(id, updates)}
      />

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        project={activeProject}
        onConfirmDelete={(id) => deleteProject(id)}
      />

      {/* File Details Modal */}
      <FileDetailsModal
        isOpen={selectedFileForDetails !== null}
        onClose={() => setSelectedFileForDetails(null)}
        file={selectedFileForDetails}
        projectName={activeProject?.name}
        onOpenPreview={(file) => setSelectedFileForPreview(file)}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={selectedFileForPreview !== null}
        onClose={() => setSelectedFileForPreview(null)}
        file={selectedFileForPreview}
      />

      {/* Remove File Confirmation Modal */}
      <RemoveFileModal
        isOpen={selectedFileForRemoval !== null}
        onClose={() => setSelectedFileForRemoval(null)}
        file={selectedFileForRemoval}
        onConfirmRemove={(fileId) => removeProjectFile(fileId)}
      />

      {/* Duplicate File Conflict Resolution Modal */}
      <DuplicateFileModal
        isOpen={duplicateConflict !== null}
        onClose={() => setDuplicateConflict(null)}
        conflict={duplicateConflict}
        onResolve={handleResolveDuplicate}
      />
    </div>
  );
};
