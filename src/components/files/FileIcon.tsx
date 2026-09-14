import React from 'react';
import {
  FileText,
  FileCode,
  Presentation,
  FileCheck,
  FileQuestion,
} from 'lucide-react';
import { ProjectFile } from '../../types/file';
import { Badge } from '../ui/Badge';

export interface FileIconProps {
  extension: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ extension, className = 'w-4 h-4' }) => {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return <FileText className={`${className} text-rose-400`} />;
    case 'pptx':
      return <Presentation className={`${className} text-amber-400`} />;
    case 'docx':
      return <FileText className={`${className} text-sky-400`} />;
    case 'txt':
      return <FileCode className={`${className} text-zinc-300`} />;
    case 'md':
      return <FileCode className={`${className} text-emerald-400`} />;
    default:
      return <FileQuestion className={`${className} text-zinc-400`} />;
  }
};

export interface FileStatusBadgeProps {
  status: ProjectFile['status'];
  size?: 'sm' | 'md';
}

export const FileStatusBadge: React.FC<FileStatusBadgeProps> = ({ status, size = 'sm' }) => {
  switch (status) {
    case 'ready':
      return (
        <Badge variant="success" size={size} dot title="File is saved in local project sandbox">
          Ready
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="warning" size={size} dot title="Processing in progress">
          Processing
        </Badge>
      );
    case 'needs_attention':
      return (
        <Badge variant="warning" size={size} dot title="Needs user attention">
          Needs Attention
        </Badge>
      );
    case 'error':
      return (
        <Badge variant="warning" size={size} dot title="File error encountered">
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="neutral" size={size}>
          {status}
        </Badge>
      );
  }
};
