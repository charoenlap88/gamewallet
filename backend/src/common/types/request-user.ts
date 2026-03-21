import { UserRole, UserStatus } from '@prisma/client';

export class RequestUser {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
