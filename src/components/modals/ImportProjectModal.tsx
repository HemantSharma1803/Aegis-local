import React, { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  UploadCloud,
  FileText,
  Info,
  ShieldCheck,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';
import { validateFile, formatBytes } from '../../services/storageService';
import { SUPPORTED_EXTENSIONS } from '../../types/file';
import { FileIcon } from '../files/FileIcon';

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: File[]) => void;
  targetProjectName?: string;
}

export const ImportProjectModal: React.FC<ImportProjectModalProps> = ({
  isOpen,
  onClose,
  onImport,
  targetProjectName,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processIncomingFiles = (files: File[]) => {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const res = validateFile(file);
      if (res.valid) {
        // Prevent adding exact duplicate file in current staged list
        if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
          valid.push(file);
        }
      } else if (res.error) {
        errors.push(res.error);
      }
    }

    if (errors.length > 0) {
      setValidationErrors((prev) => [...prev, ...errors]);
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportSubmit = () => {
    if (selectedFiles.length === 0) return;
    onImport(selectedFiles);
    setSelectedFiles([]);
    setValidationErrors([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setValidationErrors([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Project Files"
      description={
        targetProjectName
          ? `Add source files to "${targetProjectName}". Files are isolated in your local workspace.`
          : 'Add source files into your local project workspace.'
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-amber-200">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>File Validation Notice</span>
              </span>
              <button
                type="button"
                onClick={() => setValidationErrors([])}
                className="text-[11px] text-amber-400 hover:text-amber-200 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] max-h-24 overflow-y-auto">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-emerald-500/90 bg-emerald-950/20 shadow-md shadow-emerald-950/30'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/70'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleChange}
            className="hidden"
            accept=".pdf,.pptx,.docx,.txt,.md"
          />

          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-2.5 shadow-inner group-hover:text-zinc-200">
            <UploadCloud className="w-5 h-5 text-zinc-300" />
          </div>

          <p className="text-xs font-medium text-zinc-200">
            Drop project files here, or click to browse
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Supported: PDF, PPTX, DOCX, TXT or Markdown (Up to 50 MB)
          </p>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span className="font-mono text-[11px]">
                {selectedFiles.length} file(s) ready to import
              </span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-zinc-500 hover:text-zinc-300 text-[11px] cursor-pointer"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80">
              {selectedFiles.map((file, idx) => {
                const ext = file.name.slice(file.name.lastIndexOf('.') + 1);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded bg-zinc-900/60 border border-zinc-800 text-zinc-300"
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <FileIcon extension={ext} className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate font-medium text-zinc-200">
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 font-mono text-[11px] text-zinc-400">
                      <span>{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelected(idx);
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                        title="Remove from selection"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local file isolation</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={selectedFiles.length === 0}
              onClick={handleImportSubmit}
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Import {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''} Files
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
