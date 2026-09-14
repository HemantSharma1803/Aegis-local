import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Trash2,
  Info,
  ExternalLink,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';
import { ProjectFile } from '../../types/file';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileIcon, FileStatusBadge } from './FileIcon';

interface FileListProps {
  files: ProjectFile[];
  onOpenPreview: (file: ProjectFile) => void;
  onViewDetails: (file: ProjectFile) => void;
  onRequestRemove: (file: ProjectFile) => void;
  isDemoProject?: boolean;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onOpenPreview,
  onViewDetails,
  onRequestRemove,
  isDemoProject = false,
}) => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 divide-y divide-zinc-800/60 border border-zinc-800/80 rounded-xl bg-zinc-950/40 overflow-hidden">
        {files.map((file) => {
          const isTextLike = file.extension === 'txt' || file.extension === 'md' || file.isDemoFile;

          return (
            <div
              key={file.id}
              className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors group"
            >
              {/* Left: Icon + File Details */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:border-zinc-700 transition-colors">
                  <FileIcon extension={file.extension} className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1 truncate">
                  <div className="flex items-center gap-2 truncate flex-wrap">
                    <button
                      type="button"
                      onClick={() => onViewDetails(file)}
                      className="font-medium text-xs sm:text-sm text-zinc-200 hover:text-emerald-400 truncate text-left transition-colors cursor-pointer"
                    >
                      {file.name}
                    </button>

                    {file.isDemoFile ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/70 text-sky-400 border border-sky-800/40 flex-shrink-0">
                        DEMO CONTENT
                      </span>
                    ) : (
                      <FileStatusBadge status={file.status} size="sm" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
                    <span>{file.type}</span>
                    <span>·</span>
                    <span className="text-zinc-400">{file.formattedSize || `${(file.size / 1024).toFixed(1)} KB`}</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto pl-12 sm:pl-0">
                {/* Preview action */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenPreview(file)}
                  className="text-xs h-7 px-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  title={isTextLike ? 'Preview file contents' : 'View file information'}
                >
                  <span className="hidden md:inline">
                    {isTextLike ? 'Preview' : 'Info'}
                  </span>
                </Button>

                {/* Details action */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(file)}
                  className="text-xs h-7 px-2.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                  icon={<Info className="w-3.5 h-3.5" />}
                  title="View complete metadata"
                >
                  <span className="hidden md:inline">Details</span>
                </Button>

                {/* Remove action - protected for demo files */}
                {!file.isDemoFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRequestRemove(file)}
                    className="text-xs h-7 px-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    title="Remove file from project"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
