import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Project } from '../../types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSave: (id: string, updates: Partial<Project>) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || project.title || '');
      setDescription(project.description || '');
      setGoal(project.goal || '');
      setError('');
    }
  }, [project, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Project Name cannot be empty');
      return;
    }

    onSave(project.id, {
      name: trimmedName,
      description: description.trim(),
      goal: goal.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project Details"
      description="Update project identity, goals, and presentation scope."
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

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800/60">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
