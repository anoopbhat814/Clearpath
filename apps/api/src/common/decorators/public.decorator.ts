import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:public';

/** Skips the global JWT guard for a route (login, refresh, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
