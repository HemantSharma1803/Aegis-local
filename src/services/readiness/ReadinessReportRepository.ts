import { ReadinessReport } from '../../types/readiness';

const READINESS_REPORT_PREFIX = 'aegis_local_readiness_reports_';

export class ReadinessReportRepository {
  private getKey(projectId: string): string {
    return `${READINESS_REPORT_PREFIX}${projectId}`;
  }

  getReports(projectId: string): ReadinessReport[] {
    try {
      const raw = localStorage.getItem(this.getKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[ReadinessReportRepository] Failed to read reports:', err);
      return [];
    }
  }

  getLatestReport(projectId: string): ReadinessReport | null {
    const reports = this.getReports(projectId);
    return reports.length > 0 ? reports[0] : null;
  }

  saveReport(report: ReadinessReport): void {
    try {
      const reports = this.getReports(report.projectId);
      const existingIdx = reports.findIndex((r) => r.id === report.id);
      let updated: ReadinessReport[];
      if (existingIdx >= 0) {
        updated = [...reports];
        updated[existingIdx] = report;
      } else {
        updated = [report, ...reports].slice(0, 15); // Keep last 15 reports
      }
      localStorage.setItem(this.getKey(report.projectId), JSON.stringify(updated));
    } catch (err) {
      console.error('[ReadinessReportRepository] Failed to save report:', err);
    }
  }

  deleteReport(projectId: string, reportId: string): void {
    try {
      const reports = this.getReports(projectId);
      const filtered = reports.filter((r) => r.id !== reportId);
      localStorage.setItem(this.getKey(projectId), JSON.stringify(filtered));
    } catch (err) {
      console.error('[ReadinessReportRepository] Failed to delete report:', err);
    }
  }

  clearReports(projectId: string): void {
    try {
      localStorage.removeItem(this.getKey(projectId));
    } catch (err) {
      console.warn('[ReadinessReportRepository] Failed to clear reports:', err);
    }
  }
}

export const readinessReportRepository = new ReadinessReportRepository();
