"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ParlourProfile } from "@prisma/client";

async function fetchProfile(): Promise<ParlourProfile> {
  const res = await fetch("/api/parlour-profile");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch parlour profile");
  return json.data;
}

async function updateProfile(input: Partial<ParlourProfile>): Promise<ParlourProfile> {
  const res = await fetch("/api/parlour-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to update parlour profile");
  return json.data;
}

export function useParlourProfile() {
  return useQuery<ParlourProfile>({
    queryKey: ["parlour-profile"],
    queryFn: fetchProfile,
  });
}

export function useUpdateParlourProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parlour-profile"] });
    },
  });
}
