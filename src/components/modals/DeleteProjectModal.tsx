import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { Project } from '../../types';

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onConfirmDelete: (id: string) => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmDelete,
}) => {
  if (!project) return null;

  const isDemo = project.isDemo;

  const handleDelete = () => {
    if (isDemo) return;
    onConfirmDelete(project.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDemo ? 'Protected Demo Project' : 'Delete Project Confirmation'}
      description={
        isDemo
          ? 'The Aegis Journal demo project is built-in and protected.'
          : `Are you sure you want to delete "${project.name}"?`
      }
    >
      <div className="space-y-4">
        {isDemo ? (
          <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/60 flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">Demo Project Cannot Be Deleted</p>
              <p className="text-zinc-300">
                Aegis Journal is a permanent reference model used to demonstrate privacy architecture concepts and cross-examination setups.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-800/40 flex items-start gap-3 text-xs text-rose-300/90 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200 mb-0.5">This action cannot be undone</p>
                <p className="text-zinc-300">
                  Deleting this project will remove all local metadata, staged file references, and preparation notes from your browser storage.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
              Project ID: <span className="text-zinc-200">{project.id}</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/60">
          <Button type="button" variant="ghost" onClick={onClose}>
            {isDemo ? 'Close' : 'Cancel'}
          </Button>
          {!isDemo && (
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Project
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
