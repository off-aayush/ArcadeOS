"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema } from "../validators";
import { useCreateUser, useRoles } from "../hooks/use-users";
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
import { Eye, EyeOff, UserPlus } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type FormValues = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  RECEPTIONIST: "Receptionist",
};

export function UserCreateDialog({ isOpen, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const { mutateAsync: createUser, isPending } = useCreateUser();
  const { data: roles = [] } = useRoles();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(createUserSchema) as any,
    defaultValues: { name: "", email: "", password: "", roleId: "", phone: "" },
  });

  const selectedRoleId = watch("roleId");

  const handleClose = () => { reset(); onClose(); };

  const onSubmit = async (values: FormValues) => {
    try {
      await createUser(values);
      toast.add({ title: "Success", description: "User created successfully", type: "success" });
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to create user", type: "error" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <UserPlus className="h-5 w-5 text-brand" />
            Create User
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Full Name</Label>
            <Input id="create-name" placeholder="e.g. Jane Smith" {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email Address</Label>
            <Input id="create-email" type="email" placeholder="jane@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="create-phone">Phone <span className="text-surface-muted">(optional)</span></Label>
            <Input id="create-phone" placeholder="+91 98765 43210" {...register("phone")} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="create-password">Password</Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                {...register("password")}
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
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={selectedRoleId} onValueChange={(v) => setValue("roleId", v as string)}>
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
            {errors.roleId && <p className="text-xs text-danger">{errors.roleId.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" className="bg-transparent border-surface-border hover:bg-surface text-white" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand" disabled={isPending}>
              {isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
