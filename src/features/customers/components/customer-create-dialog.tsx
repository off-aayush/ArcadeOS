"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { customerCreateSchema } from "../validators";
import { Gender } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_ROUTES } from "@/lib/constants";
import { toast } from "@/components/ui/toast";

interface CustomerCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer: any) => void;
}

type CustomerFormValues = {
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  notes?: string | null;
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export function CustomerCreateDialog({ isOpen, onClose, onSuccess }: CustomerCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerCreateSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      gender: null,
      dateOfBirth: "",
      notes: "",
    },
  });

  const selectedGender = watch("gender");

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(API_ROUTES.customers, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phone: values.phone || null,
          email: values.email || null,
          dateOfBirth: values.dateOfBirth || null,
          notes: values.notes || null,
          gender: values.gender || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create customer");

      toast.add({ title: "Customer Added", description: `${values.name} has been registered.`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      
      if (onSuccess) {
        onSuccess(data.data);
      }
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Register Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Full Name *</Label>
              <Input
                className="bg-surface border-surface-border text-white"
                placeholder="e.g. Rahul Sharma"
                {...register("name")}
              />
              {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Phone</Label>
              <Input
                type="tel"
                className="bg-surface border-surface-border text-white"
                placeholder="9876543210"
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Email</Label>
              <Input
                type="email"
                className="bg-surface border-surface-border text-white"
                placeholder="example@mail.com"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Gender</Label>
              <Select
                value={selectedGender || ""}
                onValueChange={(val) => setValue("gender", val ? (val as Gender) : null)}
              >
                <SelectTrigger className="bg-surface border-surface-border text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-surface-border text-white">
                  {Object.entries(GENDER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="focus:bg-surface-hover focus:text-white">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Date of Birth</Label>
              <Input
                type="date"
                className="bg-surface border-surface-border text-white [color-scheme:dark]"
                {...register("dateOfBirth")}
              />
            </div>

            {/* Notes */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Notes</Label>
              <Input
                className="bg-surface border-surface-border text-white"
                placeholder="Any additional notes..."
                {...register("notes")}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-surface-border gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent border-surface-border hover:bg-surface text-white"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registering..." : "Register Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
