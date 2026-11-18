import { RiskClient, bandFor, heuristicRisk } from './risk-client';

const features = { age: 80, priorAdmissions12m: 3, openTasks: 5, activeReferrals: 1, deniedAuthorizations: 1, lengthOfStayDays: 9 };

describe('risk client', () => {
  afterEach(() => jest.restoreAllMocks());

  it('maps scores to bands', () => {
    expect(bandFor(0.1)).toBe('low');
    expect(bandFor(0.4)).toBe('moderate');
    expect(bandFor(0.8)).toBe('high');
  });

  it('keeps heuristic scores inside 0..1 and explains them', () => {
    const r = heuristicRisk({ ...features, age: 400, priorAdmissions12m: 99, openTasks: 99, deniedAuthorizations: 99, lengthOfStayDays: 99 });
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.factors).toHaveLength(5);
    expect(r.source).toBe('local-fallback');
  });

  it('uses the analytics service when it responds', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ score: 0.71, band: 'high', factors: [] }),
    } as Response);
    await expect(new RiskClient().score(features)).resolves.toMatchObject({ score: 0.71, source: 'analytics-service' });
  });

  it('falls back when the service is down', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const r = await new RiskClient().score(features);
    expect(r.source).toBe('local-fallback');
  });
});
