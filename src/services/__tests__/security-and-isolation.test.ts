import { describe, it, expect, beforeEach } from 'vitest';
import { PrivacyBoundary } from '../ai/privacy/PrivacyBoundary';
import {
  calculateStorageHealth,
  purgeOrphanedProjectData,
} from '../storageService';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, val: string) => storageMap.set(key, String(val)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
};

// Assign to globalThis
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Segment 12 — Security & Project Isolation Audit', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('PrivacyBoundary & Hardware Truthfulness', () => {
    it('respects explicit cloud opt-in toggle', () => {
      PrivacyBoundary.setCloudOptInAllowed(true);
      expect(PrivacyBoundary.isCloudOptInAllowed()).toBe(true);

      PrivacyBoundary.setCloudOptInAllowed(false);
      expect(PrivacyBoundary.isCloudOptInAllowed()).toBe(false);
    });

    it('returns "Unknown / unavailable" when provider is null or status is null', () => {
      const loc = PrivacyBoundary.getProcessingLocation(null, null);
      expect(loc).toBe('Unknown / unavailable');
    });

    it('returns "Not configured" when status is not configured', () => {
      const mockProvider: any = { id: 'test', capabilities: { isLocal: true } };
      const mockStatus: any = { configured: false, available: false };
      const loc = PrivacyBoundary.getProcessingLocation(mockProvider, mockStatus);
      expect(loc).toBe('Not configured');
    });

    it('accurately identifies local vs cloud processing location', () => {
      const mockLocalProvider: any = {
        id: 'local-ollama',
        capabilities: { isLocal: true },
      };
      const mockStatus: any = {
        configured: true,
        available: true,
      };

      const localLocation = PrivacyBoundary.getProcessingLocation(mockLocalProvider, mockStatus);
      expect(localLocation).toBe('Local / On-device');

      const mockCloudProvider: any = {
        id: 'gemini-provider',
        capabilities: { isLocal: false },
      };
      const cloudLocation = PrivacyBoundary.getProcessingLocation(mockCloudProvider, mockStatus);
      expect(cloudLocation).toBe('Cloud');
    });

    it('blocks dispatch to cloud provider when user has not opted in', () => {
      PrivacyBoundary.setCloudOptInAllowed(false);
      const mockCloudProvider: any = {
        id: 'gemini-provider',
        capabilities: { isLocal: false },
      };

      const result = PrivacyBoundary.canDispatchToProvider(mockCloudProvider);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Cloud AI fallback is disabled');

      // Local provider should still be allowed
      const mockLocalProvider: any = {
        id: 'local-runtime',
        capabilities: { isLocal: true },
      };
      const localResult = PrivacyBoundary.canDispatchToProvider(mockLocalProvider);
      expect(localResult.allowed).toBe(true);
    });
  });

  describe('Storage Health & Quota Isolation', () => {
    it('calculates storage health accurately', () => {
      localStorage.setItem('aegis_local_projects', JSON.stringify([{ id: 'p1', name: 'Test' }]));
      localStorage.setItem('aegis_local_project_files_p1', JSON.stringify([]));

      const report = calculateStorageHealth(['p1']);
      expect(report.itemCount).toBeGreaterThanOrEqual(2);
      expect(report.quotaWarning).toBe(false);
      expect(report.orphanedKeysCount).toBe(0);
      expect(report.categories.projects.count).toBe(1);
      expect(report.categories.files.count).toBe(1);
    });

    it('detects and purges orphaned project data', () => {
      // p1 is known, p2 is orphaned (deleted project remnant)
      localStorage.setItem('aegis_local_projects', JSON.stringify([{ id: 'p1', name: 'Active' }]));
      localStorage.setItem('aegis_local_project_files_p1', JSON.stringify([]));
      localStorage.setItem('aegis_local_project_files_p2', JSON.stringify([{ id: 'orphaned-file' }]));
      localStorage.setItem('aegis_local_judge_sessions_p2', JSON.stringify([{ id: 'orphaned-session' }]));

      const healthBefore = calculateStorageHealth(['p1']);
      expect(healthBefore.orphanedKeysCount).toBe(2);

      const purged = purgeOrphanedProjectData(['p1']);
      expect(purged).toBe(2);

      const healthAfter = calculateStorageHealth(['p1']);
      expect(healthAfter.orphanedKeysCount).toBe(0);
      expect(localStorage.getItem('aegis_local_project_files_p2')).toBeNull();
      expect(localStorage.getItem('aegis_local_judge_sessions_p2')).toBeNull();
      expect(localStorage.getItem('aegis_local_project_files_p1')).not.toBeNull();
    });
  });
});
