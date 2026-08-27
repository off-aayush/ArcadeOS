"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserSchema } from "../validators";
import { useUpdateUser, useRoles, useChangePassword, useDeleteUser } from "../hooks/use-users";
import { UserListItem } from "../types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Edit2, ShieldAlert, Key, Eye, EyeOff, AlertTriangle } from "lucide-react";

interface Props {
  user: UserListItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string; // To prevent self-deactivation/role change in UI
}

type FormValues = {
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  isActive: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
};

export function UserEditDialog({ user, isOpen, onClose, currentUserId }: Props) {
  const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { mutateAsync: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { data: roles = [] } = useRoles();

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(updateUserSchema) as any,
    defaultValues: { name: "", email: "", phone: "", roleId: "", isActive: true },
  });

  const selectedRoleId = watch("roleId");
  const isActive = watch("isActive");

  // Load user data when dialog opens
  useEffect(() => {
    if (user && isOpen) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        roleId: user.role.id,
        isActive: user.isActive,
      });
      setActiveTab("profile");
      setNewPassword("");
      setShowPassword(false);
      setShowDeleteConfirm(false);
    }
  }, [user, isOpen, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onProfileSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      await updateUser({ id: user.id, data: values });
      toast.add({ title: "Success", description: "User updated successfully", type: "success" });
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to update user", type: "error" });
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (newPassword.length < 8) {
      toast.add({ title: "Error", description: "Password must be at least 8 characters", type: "error" });
      return;
    }
    try {
      await changePassword({ id: user.id, newPassword });
      toast.add({ title: "Success", description: "Password updated successfully", type: "success" });
      setNewPassword("");
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to update password", type: "error" });
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteUser(user.id);
      toast.add({ title: "Success", description: "User deleted successfully", type: "success" });
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to delete user", type: "error" });
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  const isSelf = currentUserId === user.id;
  const isSuperAdmin = user.role.name === "SUPER_ADMIN";
  const canModifyCriticalSettings = !isSelf; // Cannot change own role/status safely here

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Edit2 className="h-5 w-5 text-brand" />
            Edit User: {user.name}
          </DialogTitle>
        </DialogHeader>

        {/* Custom Tabs */}
        <div className="flex gap-4 border-b border-surface-border mt-2 mb-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "profile" ? "border-brand text-brand" : "border-transparent text-surface-muted hover:text-white"
            }`}
          >
            Profile & Role
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "security" ? "border-brand text-brand" : "border-transparent text-surface-muted hover:text-white"
            }`}
          >
            Security & Danger
          </button>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input id="edit-name" {...register("name")} />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input id="edit-email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" {...register("phone")} />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={selectedRoleId}
                onValueChange={(v) => setValue("roleId", v as string)}
                disabled={!canModifyCriticalSettings}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role…" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {ROLE_LABELS[role.name] ?? role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canModifyCriticalSettings && (
                <p className="text-xs text-surface-muted mt-1">
                  You cannot change your own role. Ask another admin.
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2 pt-2 border-t border-surface-border">
              <Label>Account Status</Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={!canModifyCriticalSettings}
                  onClick={() => setValue("isActive", true)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-surface-card text-surface-muted border border-surface-border hover:text-white"
                  } ${!canModifyCriticalSettings && "opacity-50 cursor-not-allowed"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  disabled={!canModifyCriticalSettings}
                  onClick={() => setValue("isActive", false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !isActive
                      ? "bg-danger/20 text-danger border border-danger/30"
                      : "bg-surface-card text-surface-muted border border-surface-border hover:text-white"
                  } ${!canModifyCriticalSettings && "opacity-50 cursor-not-allowed"}`}
                >
                  Deactivated
                </button>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-surface-border gap-2">
              <Button type="button" variant="outline" className="bg-transparent border-surface-border hover:bg-surface text-white" onClick={handleClose} disabled={isUpdating}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand" disabled={isUpdating}>
                {isUpdating ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Change Password */}
            <div className="space-y-3 rounded-xl border border-surface-border bg-surface p-4">
              <div className="flex items-center gap-2 text-brand">
                <Key className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Reset Password</h3>
              </div>
              <p className="text-xs text-surface-muted">
                Set a new password for this user. They can change it themselves later.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-muted hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || newPassword.length < 8}
                >
                  {isChangingPassword ? "Updating…" : "Update"}
                </Button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="space-y-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
              <div className="flex items-center gap-2 text-danger">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="font-semibold text-sm">Danger Zone</h3>
              </div>
              
              {isSelf ? (
                <p className="text-xs text-danger/80">You cannot delete your own account.</p>
              ) : (
                <>
                  <p className="text-xs text-danger/80">
                    Deleting a user is permanent and cannot be undone. Their past actions remain in the audit log.
                  </p>
                  
                  {showDeleteConfirm ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Are you absolutely sure?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting…" : "Yes, Delete User"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete User
                    </Button>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="bg-transparent border-surface-border hover:bg-surface text-white" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
