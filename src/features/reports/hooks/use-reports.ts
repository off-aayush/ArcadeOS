import { useQuery } from "@tanstack/react-query";
import { ReportData, ReportQueryParams } from "../types";
import { API_ROUTES, REPORT_STALE_TIME } from "@/lib/constants";
import { ApiResponse } from "@/types";

async function fetchReports(params: ReportQueryParams): Promise<ReportData> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const queryStr = searchParams.toString();
  const url = `${API_ROUTES.reports}${queryStr ? `?${queryStr}` : ""}`;

  const response = await fetch(url);
  const data: ApiResponse<ReportData> = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch report data");
  }

  return data.data;
}

export function useReports(params: ReportQueryParams = {}) {
  return useQuery({
    queryKey: ["reports", params],
    queryFn: () => fetchReports(params),
    staleTime: REPORT_STALE_TIME,
  });
}
