import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  FileCheck,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { SUPPORTED_EXTENSIONS, SupportedFileExtension } from '../../types/file';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
  className?: string;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isProcessing = false,
  className = '',
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isProcessing) return;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isProcessing) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      onFilesSelected(selectedFiles);
      // Reset value so identical selection triggers onChange
      e.target.value = '';
    }
  };

  const triggerPicker = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerPicker}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerPicker();
        }
      }}
      className={`relative group border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        isDragOver
          ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
          : disabled
          ? 'border-zinc-800/60 bg-zinc-950/20 cursor-not-allowed opacity-60'
          : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950/70'
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        className="hidden"
        accept=".pdf,.pptx,.docx,.txt,.md"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
            isDragOver
              ? 'bg-emerald-900/40 border-emerald-600 text-emerald-400 scale-105'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-700'
          }`}
        >
          <UploadCloud className="w-6 h-6 transition-transform" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-200 tracking-tight">
            Drop project files here
          </p>
          <p className="text-xs text-zinc-400">
            PDF, PPTX, DOCX, TXT or Markdown
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
          {SUPPORTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase"
            >
              .{ext}
            </span>
          ))}
          <span className="text-[11px] text-zinc-500 font-mono pl-1">
            (Up to 50 MB)
          </span>
        </div>
      </div>
    </div>
  );
};
