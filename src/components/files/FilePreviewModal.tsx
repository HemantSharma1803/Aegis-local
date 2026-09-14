import React, { useEffect, useState } from 'react';
import {
  FileText,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Code,
  Info,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProjectFile } from '../../types/file';
import { fileRepository } from '../../services/fileRepository';
import { FileIcon } from './FileIcon';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: ProjectFile | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !file) {
      setContent(null);
      setUnsupportedReason(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fileRepository
      .getFilePreviewContent(file)
      .then((res) => {
        if (!isMounted) return;
        if (res.hasPreview && res.content !== undefined) {
          setContent(res.content);
          setUnsupportedReason(null);
        } else {
          setContent(null);
          setUnsupportedReason(res.reason || 'Preview is not supported for this file format yet.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setContent(null);
        setUnsupportedReason('Failed to load file preview.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  if (!file) return null;

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="File Preview"
      description={file.name}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <FileIcon extension={file.extension} className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold text-zinc-200 truncate">{file.name}</span>
            <span className="text-zinc-500 font-mono">
              ({file.formattedSize || `${(file.size / 1024).toFixed(1)} KB`})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {file.isDemoFile && (
              <Badge variant="info" size="sm">
                DEMO CONTENT
              </Badge>
            )}
            {content && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-16 text-center text-zinc-500 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono">Reading local file contents...</p>
          </div>
        ) : content !== null ? (
          <div className="space-y-2">
            <div className="max-h-96 overflow-y-auto p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/90 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap selection:bg-emerald-950 selection:text-emerald-200">
              {content}
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
              <span>Plaintext / Markdown Reader</span>
              <span>{content.length.toLocaleString()} characters</span>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-zinc-950/40 border border-zinc-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
              <Info className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">
                In-App Preview Unavailable
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                {unsupportedReason}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-zinc-800">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
