import { AuditLog, AuditAction } from "@prisma/client";

export type AuditLogWithUser = AuditLog & {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export interface AuditLogResponse {
  data: AuditLogWithUser[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
