import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types';

export const CurrentUser = createParamDecorator((field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
  const user: AuthUser = ctx.switchToHttp().getRequest().user;
  return field ? user?.[field] : user;
});
