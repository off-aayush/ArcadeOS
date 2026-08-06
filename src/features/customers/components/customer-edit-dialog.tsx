"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { customerUpdateSchema } from "../validators";
import { CustomerListItem, Gender } from "../types";
import { Gender as PrismaGender } from "@prisma/client";
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

interface CustomerEditDialogProps {
  customer: CustomerListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

type CustomerFormValues = {
  name: string;
  phone?: string | null;
  email?: string | null;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  notes?: string | null;
  isActive?: boolean;
};

const GENDER_LABELS: Record<PrismaGender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export function CustomerEditDialog({ customer, isOpen, onClose }: CustomerEditDialogProps) {
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
    resolver: zodResolver(customerUpdateSchema) as any,
  });

  const selectedGender = watch("gender");
  const selectedIsActive = watch("isActive");

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        gender: customer.gender || null,
        dateOfBirth: customer.dateOfBirth
          ? new Date(customer.dateOfBirth).toISOString().split("T")[0]
          : "",
        notes: customer.notes || "",
        isActive: customer.isActive,
      });
    }
  }, [customer, reset]);

  if (!customer) return null;

  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_ROUTES.customers}/${customer.id}`, {
        method: "PATCH",
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
      if (!res.ok) throw new Error(data.error || "Failed to update customer");

      toast.add({ title: "Customer Updated", description: `${values.name} has been updated.`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Edit Customer — {customer.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2 space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Full Name *</Label>
              <Input
                className="bg-surface border-surface-border text-white"
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
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-surface-muted">Gender</Label>
              <Select
                value={selectedGender || ""}
                onValueChange={(val) => setValue("gender", val ? (val as PrismaGender) : null)}
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
                {...register("notes")}
              />
            </div>

            {/* Active Toggle */}
            <div className="col-span-2 flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={selectedIsActive ?? true}
                onChange={(e) => setValue("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-surface-border bg-surface text-brand focus:ring-brand"
              />
              <Label htmlFor="isActive" className="text-sm font-medium text-surface-muted cursor-pointer">
                Active customer (visible in lists)
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-surface-border gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-transparent border-surface-border hover:bg-surface text-white"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
