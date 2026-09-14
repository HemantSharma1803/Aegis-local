import { PreparationPlan } from '../../types/prepare';

const PREPARATION_PLAN_PREFIX = 'aegis_local_prep_plans_';

export class PreparationPlanRepository {
  private getKey(projectId: string): string {
    return `${PREPARATION_PLAN_PREFIX}${projectId}`;
  }

  getPlans(projectId: string): PreparationPlan[] {
    try {
      const raw = localStorage.getItem(this.getKey(projectId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('[PreparationPlanRepository] Failed to read plans:', err);
      return [];
    }
  }

  getLatestPlan(projectId: string): PreparationPlan | null {
    const plans = this.getPlans(projectId);
    return plans.length > 0 ? plans[0] : null;
  }

  savePlan(plan: PreparationPlan): void {
    try {
      const plans = this.getPlans(plan.projectId);
      // Prepend to history, keeping max 10 plans
      const updated = [plan, ...plans.filter((p) => p.id !== plan.id)].slice(0, 10);
      localStorage.setItem(this.getKey(plan.projectId), JSON.stringify(updated));
    } catch (err) {
      console.error('[PreparationPlanRepository] Failed to save plan:', err);
    }
  }

  updatePlan(plan: PreparationPlan): void {
    try {
      const plans = this.getPlans(plan.projectId);
      const updated = plans.map((p) => (p.id === plan.id ? plan : p));
      localStorage.setItem(this.getKey(plan.projectId), JSON.stringify(updated));
    } catch (err) {
      console.error('[PreparationPlanRepository] Failed to update plan:', err);
    }
  }

  deletePlan(projectId: string, planId: string): void {
    try {
      const plans = this.getPlans(projectId);
      const filtered = plans.filter((p) => p.id !== planId);
      localStorage.setItem(this.getKey(projectId), JSON.stringify(filtered));
    } catch (err) {
      console.error('[PreparationPlanRepository] Failed to delete plan:', err);
    }
  }

  clearPlans(projectId: string): void {
    try {
      localStorage.removeItem(this.getKey(projectId));
    } catch (err) {
      console.warn('[PreparationPlanRepository] Failed to clear plans:', err);
    }
  }
}

export const preparationPlanRepository = new PreparationPlanRepository();
