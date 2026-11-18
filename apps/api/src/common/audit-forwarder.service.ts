import { Injectable, Logger } from '@nestjs/common';
import { createHmac } from 'crypto';

export interface AuditEnvelope {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  requestId?: string;
  occurredAt: string;
}

/** Signs and forwards audit events to the Go audit gateway (best effort). */
@Injectable()
export class AuditForwarder {
  private readonly logger = new Logger(AuditForwarder.name);

  sign(body: string, key: string): string {
    return createHmac('sha256', key).update(body).digest('hex');
  }

  async forward(events: AuditEnvelope[]): Promise<boolean> {
    const url = process.env.AUDIT_GATEWAY_URL;
    const key = process.env.AUDIT_GATEWAY_SIGNING_KEY;
    if (!url || !key || events.length === 0) return false;
    const body = JSON.stringify({ events });
    try {
      const res = await fetch(`${url}/v1/events/batch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-clearpath-signature': this.sign(body, key) },
        body,
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`audit gateway unreachable: ${(err as Error).message}`);
      return false;
    }
  }
}
