"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserListItem } from "../types";
import { CreateUserInput, UpdateUserInput } from "../validators";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchUsers(): Promise<UserListItem[]> {
  const res = await fetch("/api/users");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch users");
  return json.data;
}

async function fetchRoles() {
  const res = await fetch("/api/users/roles");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch roles");
  return json.data as { id: string; name: string; description: string | null; permissions: string[] }[];
}

async function createUser(input: CreateUserInput): Promise<UserListItem> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to create user");
  return json.data;
}

async function updateUser({ id, data }: { id: string; data: UpdateUserInput }): Promise<UserListItem> {
  const res = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to update user");
  return json.data;
}

async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to delete user");
}

async function changePassword({ id, newPassword }: { id: string; newPassword: string }): Promise<void> {
  const res = await fetch(`/api/users/${id}/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to change password");
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
}

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}
