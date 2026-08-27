"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Discount } from "@prisma/client";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchAllDiscounts(): Promise<Discount[]> {
  const res = await fetch("/api/discounts?all=true");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch discounts");
  return json.data;
}

async function createDiscount(input: any): Promise<Discount> {
  const res = await fetch("/api/discounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to create discount");
  return json.data;
}

async function updateDiscount({ id, data }: { id: string; data: any }): Promise<Discount> {
  const res = await fetch(`/api/discounts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to update discount");
  return json.data;
}

async function deleteDiscount(id: string): Promise<void> {
  const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to delete discount");
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useAllDiscounts() {
  return useQuery({ queryKey: ["discounts", "all"], queryFn: fetchAllDiscounts });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDiscount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

export function useUpdateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDiscount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discounts"] });
    },
  });
}
