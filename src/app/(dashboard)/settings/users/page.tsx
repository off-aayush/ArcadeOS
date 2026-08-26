"use client";

import { useState } from "react";
import { UserTable } from "@/features/users/components/user-table";
import { UserCreateDialog } from "@/features/users/components/user-create-dialog";
import { UserEditDialog } from "@/features/users/components/user-edit-dialog";
import { useUsers } from "@/features/users/hooks/use-users";
import { UserListItem } from "@/features/users/types";
import { useAuthContext } from "@/providers/auth-provider";
import { Loader2 } from "lucide-react";

export default function UsersSettingsPage() {
  const { data: users = [], isLoading, error } = useUsers();
  const { user: currentUser } = useAuthContext();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">System Users</h2>
          <p className="text-sm text-surface-muted mt-1">
            Manage staff accounts, assign roles, and control system access.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-brand hover:bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-brand transition-all active:scale-95"
        >
          + Add User
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center text-danger">
          Failed to load users. Please try again.
        </div>
      ) : (
        <UserTable 
          users={users} 
          onEdit={setEditingUser} 
          currentUserId={currentUser?.id} 
        />
      )}

      <UserCreateDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
      />
      
      <UserEditDialog
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}
