import { ProjectFile } from '../types/file';

/**
 * Isolated representative demo files for the Aegis Journal reference model.
 * These are completely separated from real user project storage.
 * Clearly designated as representative demo resources.
 */
export const DEMO_PROJECT_FILES: ProjectFile[] = [
  {
    id: 'demo-file-1',
    projectId: 'demo-aegis-journal',
    name: 'README.md',
    type: 'Markdown Documentation',
    extension: 'md',
    size: 4300,
    formattedSize: '4.2 KB',
    path: '/docs/README.md',
    addedAt: '2026-09-10T09:00:00.000Z',
    status: 'ready',
    isDemoFile: true,
  },
  {
    id: 'demo-file-2',
    projectId: 'demo-aegis-journal',
    name: 'architecture.md',
    type: 'Markdown Documentation',
    extension: 'md',
    size: 13107,
    formattedSize: '12.8 KB',
    path: '/docs/architecture.md',
    addedAt: '2026-09-10T09:15:00.000Z',
    status: 'ready',
    isDemoFile: true,
  },
  {
    id: 'demo-file-3',
    projectId: 'demo-aegis-journal',
    name: 'security-notes.md',
    type: 'Markdown Documentation',
    extension: 'md',
    size: 6656,
    formattedSize: '6.5 KB',
    path: '/docs/security-notes.md',
    addedAt: '2026-09-11T14:20:00.000Z',
    status: 'ready',
    isDemoFile: true,
  },
];
