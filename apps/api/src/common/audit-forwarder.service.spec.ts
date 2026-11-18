import { AuditForwarder } from './audit-forwarder.service';

describe('AuditForwarder', () => {
  const svc = new AuditForwarder();

  it('produces a stable hex HMAC signature', () => {
    const a = svc.sign('{"events":[]}', 'k');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(svc.sign('{"events":[]}', 'k')).toBe(a);
    expect(svc.sign('{"events":[]}', 'other')).not.toBe(a);
  });

  it('does nothing when the gateway is not configured', async () => {
    delete process.env.AUDIT_GATEWAY_URL;
    await expect(svc.forward([{ actorId: null, action: 'READ', entityType: 'Patient', entityId: null, occurredAt: 'now' }])).resolves.toBe(false);
  });
});
