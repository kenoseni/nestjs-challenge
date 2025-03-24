import { SetMetadata } from '@nestjs/common';

// SetMetadata attaches metadata to route handlers
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
