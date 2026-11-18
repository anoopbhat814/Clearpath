import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'audit:entity';

/** Marks a controller so that the AuditInterceptor records its requests under the given entity type. */
export const Audited = (entityType: string) => SetMetadata(AUDIT_ENTITY_KEY, entityType);
