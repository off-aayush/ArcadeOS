"use client";

import { useQuery } from "@tanstack/react-query";
import { AuthUser } from "../types";
import { ApiResponse } from "@/types";

async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch("/api/auth/me");
    const data: ApiResponse<AuthUser> = await res.json();
    if (!data.success) return null;
    return data.data;
  } catch {
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  };
}
