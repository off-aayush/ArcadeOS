"use client";

import { useQuery } from "@tanstack/react-query";
import { AuditLogResponse } from "../types";
import { AuditAction } from "@prisma/client";

export interface UseAuditLogsParams {
  page?: number;
  pageSize?: number;
  action?: AuditAction | "ALL";
  userId?: string | "ALL";
  entityType?: string;
}

export function useAuditLogs(params: UseAuditLogsParams) {
  return useQuery<AuditLogResponse>({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.page) search.set("page", params.page.toString());
      if (params.pageSize) search.set("pageSize", params.pageSize.toString());
      if (params.action && params.action !== "ALL") search.set("action", params.action);
      if (params.userId && params.userId !== "ALL") search.set("userId", params.userId);
      if (params.entityType) search.set("entityType", params.entityType);

      const res = await fetch(`/api/audit-logs?${search.toString()}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to fetch audit logs");
      return json.data;
    },
  });
}
