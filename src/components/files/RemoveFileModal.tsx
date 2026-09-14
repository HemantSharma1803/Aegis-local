import React from 'react';
import { Trash2, AlertTriangle, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProjectFile } from '../../types/file';
import { FileIcon } from './FileIcon';

interface RemoveFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile | null;
  onConfirmRemove: (fileId: string) => void;
}

export const RemoveFileModal: React.FC<RemoveFileModalProps> = ({
  isOpen,
  onClose,
  file,
  onConfirmRemove,
}) => {
  if (!file) return null;

  const handleConfirm = () => {
    onConfirmRemove(file.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove File"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-200">
              Remove this file from the project?
            </p>
            <p className="text-zinc-400 leading-relaxed">
              This file will be removed from your project workspace and its local metadata deleted. Your original physical file on your disk is never touched.
            </p>
          </div>
        </div>

        {/* File being removed */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs">
          <FileIcon extension={file.extension} className="w-4 h-4 flex-shrink-0" />
          <div className="min-w-0 flex-1 truncate">
            <span className="font-semibold text-zinc-200 block truncate">
              {file.name}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">
              {file.formattedSize || `${(file.size / 1024).toFixed(1)} KB`} · {file.type}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Remove File
          </Button>
        </div>
      </div>
    </Modal>
  );
};
