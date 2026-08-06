"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationUpdateSchema } from "../validators";
import { StationListItem } from "../types";
import { StationType, PricingModel, StationStatus } from "@prisma/client";
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
import { STATION_TYPE_LABELS } from "@/lib/constants";
import { toast } from "@/components/ui/toast";

interface StationEditDialogProps {
  station: StationListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type StationFormValues = {
  name: string;
  type: StationType;
  pricingModel: PricingModel;
  ratePerHour: number;
  ratePerMinute: number | null;
  maxPlayers: number;
  description: string;
  location: string;
  imageUrl: string;
  status: StationStatus;
  isActive: boolean;
};

export function StationEditDialog({
  station,
  isOpen,
  onClose,
  onSuccess,
}: StationEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationUpdateSchema) as any,
  });

  const selectedType = watch("type");
  const selectedPricingModel = watch("pricingModel");
  const selectedStatus = watch("status");
  const selectedIsActive = watch("isActive");

  // Reset form when active station shifts
  useEffect(() => {
    if (station) {
      reset({
        name: station.name,
        type: station.type,
        pricingModel: station.pricingModel,
        ratePerHour: Number(station.ratePerHour),
        ratePerMinute: station.ratePerMinute ? Number(station.ratePerMinute) : null,
        maxPlayers: station.maxPlayers,
        description: station.description || "",
        location: station.location || "",
        imageUrl: station.imageUrl || "",
        status: station.status,
        isActive: station.isActive,
      });
    }
  }, [station, reset]);

  if (!station) return null;

  const hasActiveSession = station.sessions.length > 0;

  const onSubmit = async (values: StationFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ratePerHour: Number(values.ratePerHour),
          ratePerMinute: values.ratePerMinute ? Number(values.ratePerMinute) : null,
          maxPlayers: Number(values.maxPlayers),
          description: values.description || null,
          location: values.location || null,
          imageUrl: values.imageUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update station");
      }

      toast.add({
        title: "Success",
        description: "Station updated successfully",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.add({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Edit Station — {station.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Station Name */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-surface-muted">Station Name</Label>
              <Input
                id="name"
                className="bg-surface border-surface-border text-white"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-danger">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-sm font-medium text-surface-muted">Hardware Type</Label>
              <Select
                value={selectedType}
                onValueChange={(val) => setValue("type", val as StationType)}
              >
                <SelectTrigger className="bg-surface border-surface-border text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-surface-border text-white">
                  {Object.entries(STATION_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="focus:bg-surface-hover focus:text-white">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Max Players */}
            <div className="space-y-1.5">
              <Label htmlFor="maxPlayers" className="text-sm font-medium text-surface-muted">Max Players</Label>
              <Input
                id="maxPlayers"
                type="number"
                className="bg-surface border-surface-border text-white"
                {...register("maxPlayers", { valueAsNumber: true })}
              />
              {errors.maxPlayers && (
                <p className="text-xs text-danger">{errors.maxPlayers.message}</p>
              )}
            </div>

            {/* Pricing Model */}
            <div className="space-y-1.5">
              <Label htmlFor="pricingModel" className="text-sm font-medium text-surface-muted">Pricing Model</Label>
              <Select
                value={selectedPricingModel}
                onValueChange={(val) => setValue("pricingModel", val as PricingModel)}
              >
                <SelectTrigger className="bg-surface border-surface-border text-white">
                  <SelectValue placeholder="Select pricing model" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-surface-border text-white">
                  <SelectItem value={PricingModel.PER_HOUR} className="focus:bg-surface-hover focus:text-white">
                    Per Hour
                  </SelectItem>
                  <SelectItem value={PricingModel.PER_MINUTE} className="focus:bg-surface-hover focus:text-white">
                    Per Minute
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rate Per Hour */}
            <div className="space-y-1.5">
              <Label htmlFor="ratePerHour" className="text-sm font-medium text-surface-muted">Rate Per Hour (₹)</Label>
              <Input
                id="ratePerHour"
                type="number"
                className="bg-surface border-surface-border text-white"
                {...register("ratePerHour", { valueAsNumber: true })}
              />
              {errors.ratePerHour && (
                <p className="text-xs text-danger">{errors.ratePerHour.message}</p>
              )}
            </div>

            {/* Station Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-sm font-medium text-surface-muted">Lounge Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(val) => setValue("status", val as StationStatus)}
                disabled={hasActiveSession}
              >
                <SelectTrigger className="bg-surface border-surface-border text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card border-surface-border text-white">
                  {Object.values(StationStatus).map((statusVal) => (
                    <SelectItem key={statusVal} value={statusVal} className="focus:bg-surface-hover focus:text-white">
                      {statusVal.charAt(0) + statusVal.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveSession && (
                <p className="text-[10px] text-surface-muted">Status locked during active session</p>
              )}
            </div>

            {/* Is Active Toggle */}
            <div className="space-y-1.5 flex flex-col justify-end pb-1.5">
              <div className="flex items-center gap-3">
                <Label htmlFor="isActive" className="text-sm font-medium text-surface-muted">Show on Grid</Label>
                <input
                  id="isActive"
                  type="checkbox"
                  checked={selectedIsActive}
                  onChange={(e) => setValue("isActive", e.target.checked)}
                  disabled={hasActiveSession}
                  className="rounded border-surface-border bg-surface text-brand focus:ring-brand h-4 w-4"
                />
              </div>
              {hasActiveSession && (
                <p className="text-[10px] text-surface-muted">Grid visibility locked during active session</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="location" className="text-sm font-medium text-surface-muted">Location in Lounge</Label>
              <Input
                id="location"
                className="bg-surface border-surface-border text-white"
                placeholder="e.g. Zone A - Row 1"
                {...register("location")}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="description" className="text-sm font-medium text-surface-muted">Description / Notes</Label>
              <Input
                id="description"
                className="bg-surface border-surface-border text-white"
                placeholder="Hardware specs, controller notes etc."
                {...register("description")}
              />
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
              {isSubmitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
