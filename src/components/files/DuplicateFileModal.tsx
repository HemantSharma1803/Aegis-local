import React from 'react';
import { Copy, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { DuplicateFileConflict, DuplicateResolutionAction } from '../../types/file';
import { formatBytes } from '../../services/storageService';

interface DuplicateFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: DuplicateFileConflict | null;
  onResolve: (action: DuplicateResolutionAction) => void;
}

export const DuplicateFileModal: React.FC<DuplicateFileModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  if (!conflict) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Duplicate Filename Detected"
      description="A file with this name already exists in the active project."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300">
          <p className="font-semibold text-amber-200">
            &quot;{conflict.file.name}&quot; already exists.
          </p>
          <p className="text-zinc-400 mt-1 leading-relaxed">
            Choose how you would like to handle this file in the local project workspace.
          </p>
        </div>

        {/* Comparison card */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Existing in Project
            </span>
            <p className="font-semibold text-zinc-200 truncate">{conflict.existingFile.name}</p>
            <p className="text-[11px] text-zinc-400 font-mono">
              {conflict.existingFile.formattedSize || formatBytes(conflict.existingFile.size)}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              New File Being Imported
            </span>
            <p className="font-semibold text-emerald-400 truncate">{conflict.file.name}</p>
            <p className="text-[11px] text-zinc-400 font-mono">
              {formatBytes(conflict.file.size)}
            </p>
          </div>
        </div>

        {/* Action Choices */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={() => onResolve('keep_both')}
            className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 flex-shrink-0 mt-0.5">
                <Copy className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100">
                  Keep both
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Save the new file with a numbered suffix (e.g. &quot;{conflict.file.name.replace(/(\.[^.]+)$/, ' (1)$1')}&quot;).
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onResolve('replace_existing')}
            className="w-full p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-amber-400 flex-shrink-0 mt-0.5">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200 group-hover:text-zinc-100">
                  Replace existing
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Overwrite the existing entry in the project manifest with the new file.
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel Import
          </Button>
        </div>
      </div>
    </Modal>
  );
};
