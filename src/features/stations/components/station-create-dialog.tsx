"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stationCreateSchema } from "../../validators";
import { StationType, PricingModel } from "@prisma/client";
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
import { useToast } from "@/hooks/use-toast";

interface StationCreateDialogProps {
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
};

export function StationCreateDialog({
  isOpen,
  onClose,
  onSuccess,
}: StationCreateDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<StationFormValues>({
    resolver: zodResolver(stationCreateSchema),
    defaultValues: {
      name: "",
      type: StationType.PS5,
      pricingModel: PricingModel.PER_HOUR,
      ratePerHour: 100,
      ratePerMinute: null,
      maxPlayers: 2,
      description: "",
      location: "",
      imageUrl: "",
    },
  });

  const selectedType = watch("type");
  const selectedPricingModel = watch("pricingModel");

  const onSubmit = async (values: StationFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stations", {
        method: "POST",
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
        throw new Error(data.error || "Failed to create station");
      }

      toast({
        title: "Success",
        description: "Station created successfully",
      });
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Create Station</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Station Name */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium text-surface-muted">Station Name</Label>
              <Input
                id="name"
                className="bg-surface border-surface-border text-white"
                placeholder="e.g. PS5 - Station 04"
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

            {/* Location */}
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="location" className="text-sm font-medium text-surface-muted">Location in Lounge</Label>
              <Input
                id="location"
                className="bg-surface border-surface-border text-white"
                placeholder="e.g. Zone A - Row 1"
                {...register("location")}
              />
              {errors.location && (
                <p className="text-xs text-danger">{errors.location.message}</p>
              )}
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
              {isSubmitting ? "Creating..." : "Create Station"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
