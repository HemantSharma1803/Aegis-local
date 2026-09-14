import { Project } from '../types';
import { DEMO_PROJECT_FILES } from './demoFiles';

export const AEGIS_JOURNAL_DEMO: Project = {
  id: 'demo-aegis-journal',
  name: 'Aegis Journal',
  category: 'Privacy-focused AI application',
  description:
    'Zero-knowledge encrypted personal journaling companion powered by Gemini AI.',
  goal:
    'Demonstrate how a privacy-focused AI application can analyze personal journal content while protecting sensitive information.',
  createdAt: '2026-09-10T09:00:00.000Z',
  updatedAt: '2026-09-12T10:30:00.000Z',
  isDemo: true,

  // Demo Project Facts
  problem:
    'Personal journaling applications often store private thoughts in ways users cannot fully control.',
  solution:
    'A client-side privacy architecture protects sensitive journal content before AI-assisted analysis.',
  technologies: [
    'React',
    'TypeScript',
    'Firebase',
    'Gemini API',
    'AES-GCM',
    'PBKDF2',
  ],
  architectureConcepts: [
    'Client-side privacy protection',
    'Encrypted storage',
    'AI-assisted mood analysis',
    'User-isolated data',
    'Secure authentication',
  ],
  potentialTopics: [
    'Why encryption is performed before storage',
    'Why AES-GCM is used',
    'Why PBKDF2 is used',
    'How user isolation works',
    'Where AI processing occurs',
    'Privacy vs AI functionality trade-offs',
  ],

  // Realistic representative demo files (explicitly marked as demo content)
  files: DEMO_PROJECT_FILES,

  // Compatibility aliases
  title: 'Aegis Journal',
  tagline: 'Privacy-focused AI application',
  summary:
    'A client-side privacy architecture protecting sensitive journal content before AI-assisted mood analysis, utilizing AES-GCM and PBKDF2 cryptography with zero-knowledge encrypted cloud storage.',
  keyConcepts: [
    'Client-side privacy protection',
    'Encrypted storage',
    'AI-assisted mood analysis',
    'User-isolated data',
    'Secure authentication',
  ],
  architectureNotes:
    'Zero-Knowledge Client Pipeline: Plaintext journal entries are encrypted in-memory using AES-GCM (256-bit) with keys derived client-side via PBKDF2. Only ciphertext envelopes reach storage. When AI-assisted mood analysis is requested, token extraction occurs within an isolated sandbox perimeter.',
  potentialQuestions: [
    'Why is encryption performed before storage rather than at rest on the server?',
    'Why is AES-GCM chosen over standard CBC mode?',
    'How does PBKDF2 key derivation resist dictionary and GPU-based brute force attempts?',
    'How does user isolation prevent cross-tenant vector leakage in multi-user environments?',
    'Where exactly does AI processing occur, and what payloads cross the perimeter?',
    'What are the engineering trade-offs between zero-knowledge privacy and rich AI summarization?',
  ],
};

// Backwards compatibility export
export const DEMO_PROJECT = AEGIS_JOURNAL_DEMO;

