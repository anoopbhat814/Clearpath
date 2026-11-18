import { Injectable, Logger } from '@nestjs/common';

export interface RiskFeatures {
  age: number;
  priorAdmissions12m: number;
  openTasks: number;
  activeReferrals: number;
  deniedAuthorizations: number;
  lengthOfStayDays: number;
}

export interface RiskResult {
  score: number;
  band: 'low' | 'moderate' | 'high';
  factors: { name: string; contribution: number }[];
  source: 'analytics-service' | 'local-fallback';
}

export const bandFor = (score: number): RiskResult['band'] => (score >= 0.66 ? 'high' : score >= 0.33 ? 'moderate' : 'low');

/** Coarse local approximation used when the analytics service is unreachable. */
export function heuristicRisk(f: RiskFeatures): RiskResult {
  const parts = [
    { name: 'age', contribution: Math.min(f.age / 100, 1) * 0.25 },
    { name: 'prior_admissions', contribution: Math.min(f.priorAdmissions12m / 4, 1) * 0.35 },
    { name: 'open_tasks', contribution: Math.min(f.openTasks / 10, 1) * 0.1 },
    { name: 'denied_authorizations', contribution: Math.min(f.deniedAuthorizations / 3, 1) * 0.1 },
    { name: 'length_of_stay', contribution: Math.min(f.lengthOfStayDays / 14, 1) * 0.2 },
  ];
  const score = Math.round(Math.min(parts.reduce((s, p) => s + p.contribution, 0), 1) * 1000) / 1000;
  return { score, band: bandFor(score), factors: parts, source: 'local-fallback' };
}

@Injectable()
export class RiskClient {
  private readonly logger = new Logger(RiskClient.name);

  async score(features: RiskFeatures): Promise<RiskResult> {
    const base = process.env.ANALYTICS_URL ?? 'http://localhost:8100';
    try {
      const res = await fetch(`${base}/v1/risk/readmission`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          age: features.age,
          prior_admissions_12m: features.priorAdmissions12m,
          open_tasks: features.openTasks,
          active_referrals: features.activeReferrals,
          denied_authorizations: features.deniedAuthorizations,
          length_of_stay_days: features.lengthOfStayDays,
        }),
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) throw new Error(`analytics responded ${res.status}`);
      const body = (await res.json()) as { score: number; band: RiskResult['band']; factors: RiskResult['factors'] };
      return { ...body, source: 'analytics-service' };
    } catch (err) {
      this.logger.warn(`risk service unavailable, using fallback: ${(err as Error).message}`);
      return heuristicRisk(features);
    }
  }

  async forecastCapacity(history: { date: string; occupied: number; staffed: number }[], horizonDays: number) {
    const base = process.env.ANALYTICS_URL ?? 'http://localhost:8100';
    const res = await fetch(`${base}/v1/capacity/forecast`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ history, horizon_days: horizonDays }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`analytics responded ${res.status}`);
    return res.json();
  }
}
