import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { FolderPlus, ShieldCheck } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, goal: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project Name is required');
      return;
    }
    onSubmit(trimmedName, description.trim(), goal.trim());
    setName('');
    setDescription('');
    setGoal('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setGoal('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Project"
      description="Initialize an isolated on-device workspace for your presentation preparation."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Name *"
          placeholder="My AI Project"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
        />

        <Textarea
          label="Short Description"
          placeholder="What does this project do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <Input
          label="Project Goal"
          placeholder="What do I want to prepare for?"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            All context is stored locally on this machine. No project data or files are sent to remote servers without permission.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/60">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<FolderPlus className="w-4 h-4" />}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
