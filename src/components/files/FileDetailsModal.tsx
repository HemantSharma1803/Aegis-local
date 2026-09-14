import React from 'react';
import {
  FileText,
  Calendar,
  Layers,
  CheckCircle,
  Clock,
  HardDrive,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProjectFile } from '../../types/file';
import { FileIcon, FileStatusBadge } from './FileIcon';

interface FileDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile | null;
  projectName?: string;
  onOpenPreview?: (file: ProjectFile) => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  isOpen,
  onClose,
  file,
  projectName = 'Current Project',
  onOpenPreview,
}) => {
  if (!file) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Not recorded';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const isTextFile = file.extension === 'txt' || file.extension === 'md';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Details"
      description="Inspect local project file metadata and lifecycle status."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Header summary */}
        <div className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileIcon extension={file.extension} className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-zinc-100 truncate">
                {file.name}
              </h3>
              {file.isDemoFile ? (
                <Badge variant="info" size="sm">
                  DEMO CONTENT
                </Badge>
              ) : (
                <FileStatusBadge status={file.status} size="sm" />
              )}
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              Path: {file.path}
            </p>
          </div>
        </div>

        {/* Core Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Document Type
            </span>
            <p className="text-xs font-medium text-zinc-200">
              {file.type} (.{file.extension.toUpperCase()})
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              File Size
            </span>
            <p className="text-xs font-medium text-zinc-200 font-mono">
              {file.formattedSize || `${(file.size / 1024).toFixed(1)} KB`} ({file.size.toLocaleString()} bytes)
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Date Added
            </span>
            <div className="flex items-center gap-1.5 text-xs text-zinc-200 font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatDate(file.addedAt)}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Project Context
            </span>
            <p className="text-xs font-medium text-zinc-200 truncate">
              {projectName}
            </p>
          </div>
        </div>

        {/* Processing & Security Pipeline Status */}
        <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Storage & Processing Pipeline</span>
            </span>
            <Badge variant="success" size="sm">
              Local Sandbox
            </Badge>
          </div>

          <div className="space-y-2 text-xs text-zinc-300">
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">File System Ingress</span>
              <span className="text-emerald-400 font-mono">Verified & Stored</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Document Parser</span>
              <span className="text-emerald-400 font-mono">Active (PDF/DOCX/PPTX/Text)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
              <span className="text-zinc-400">Project Knowledge Index</span>
              <span className="text-emerald-400 font-mono">Active (Extracted Facts)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-400">Storage Location</span>
              <span className="text-zinc-300 font-mono text-[11px]">
                {file.isDemoFile ? 'In-memory reference resource' : 'Browser Local Isolated Store'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <div className="text-[11px] text-zinc-500 font-mono">
            ID: {file.id}
          </div>
          <div className="flex items-center gap-2">
            {onOpenPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenPreview(file);
                }}
              >
                {isTextFile || file.isDemoFile ? 'Preview Content' : 'View Preview Info'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
