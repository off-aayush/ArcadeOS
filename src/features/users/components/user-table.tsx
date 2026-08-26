"use client";

import { formatDistanceToNow } from "date-fns";
import { UserListItem } from "../types";
import { User, Shield, ShieldAlert, BadgeCheck, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  users: UserListItem[];
  onEdit: (user: UserListItem) => void;
  currentUserId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
};

export function UserTable({ users, onEdit, currentUserId }: Props) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border py-12 text-center">
        <User className="h-10 w-10 text-surface-muted mb-4" />
        <h3 className="text-lg font-semibold text-white">No users found</h3>
        <p className="text-sm text-surface-muted max-w-sm mt-1">
          Get started by creating a new user account.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border bg-surface/50">
            <tr>
              <th className="px-6 py-4 font-medium text-surface-muted">User</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Role</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Status</th>
              <th className="px-6 py-4 font-medium text-surface-muted">Last Login</th>
              <th className="px-6 py-4 font-medium text-surface-muted text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {users.map((user) => {
              const isSuperAdmin = user.role.name === "SUPER_ADMIN";
              const isSelf = currentUserId === user.id;

              return (
                <tr key={user.id} className="group hover:bg-surface-hover/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 border border-brand/20 text-brand font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.name}</p>
                          {isSelf && (
                            <span className="rounded-full bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand tracking-wide">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-muted">{user.email}</p>
                        {user.phone && <p className="text-[10px] text-surface-muted/70 mt-0.5">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {isSuperAdmin ? (
                        <ShieldAlert className="h-4 w-4 text-warning" />
                      ) : user.role.name === "ADMIN" ? (
                        <Shield className="h-4 w-4 text-brand" />
                      ) : (
                        <BadgeCheck className="h-4 w-4 text-surface-muted" />
                      )}
                      <span className={`font-medium ${
                        isSuperAdmin ? "text-warning" : "text-white"
                      }`}>
                        {ROLE_LABELS[user.role.name] ?? user.role.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success border border-success/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger border border-danger/20">
                        <XCircle className="h-3.5 w-3.5" />
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-surface-muted">
                    {user.lastLoginAt ? (
                      formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })
                    ) : (
                      <span className="text-surface-muted/50">Never</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit(user)}
                      className="rounded-lg bg-surface hover:bg-brand hover:text-white border border-surface-border px-3 py-1.5 text-xs font-medium text-white transition-colors"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
