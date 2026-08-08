"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { FoodDetail } from "../types";
import { foodItemSchema } from "../validators";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { FoodCategory } from "@prisma/client";

interface FoodFormDialogProps {
  item: FoodDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FoodFormDialog({ item, isOpen, onClose }: FoodFormDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(item ? foodItemSchema.partial() : foodItemSchema),
    defaultValues: {
      name: "",
      category: "SNACKS" as FoodCategory,
      price: 0,
      description: "",
      stock: 0,
      minStock: 0,
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (item) {
        reset({
          name: item.name,
          category: item.category,
          price: Number(item.price),
          description: item.description || "",
          stock: item.stock,
          minStock: item.minStock,
          isAvailable: item.isAvailable,
        });
      } else {
        reset({
          name: "",
          category: "SNACKS",
          price: 0,
          description: "",
          stock: 0,
          minStock: 0,
          isAvailable: true,
        });
      }
    }
  }, [isOpen, item, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const url = item ? `/api/food/${item.id}` : "/api/food";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save product");

      toast.add({ title: "Success", description: `Product ${item ? "updated" : "added"} successfully.`, type: "success" });
      queryClient.invalidateQueries({ queryKey: ["food"] });
      onClose();
    } catch (error: any) {
      toast.add({ title: "Error", description: error.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{item ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-surface-muted">Name</Label>
            <Input {...register("name")} className="bg-surface border-surface-border text-white" placeholder="e.g. Coca-Cola 330ml" />
            {errors.name && <p className="text-xs text-danger">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-surface-muted">Category</Label>
              <select {...register("category")} className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-sm text-white focus:border-brand">
                {Object.keys(FoodCategory).map(c => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-surface-muted">Price</Label>
              <Input type="number" step="0.01" {...register("price")} className="bg-surface border-surface-border text-white" />
              {errors.price && <p className="text-xs text-danger">{errors.price.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label className="text-surface-muted">Initial Stock</Label>
              <Input type="number" disabled={!!item} {...register("stock")} className="bg-surface border-surface-border text-white disabled:opacity-50" />
              {item && <p className="text-[10px] text-surface-muted">Use Adjust Stock to modify</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-surface-muted">Min Stock Alert</Label>
              <Input type="number" {...register("minStock")} className="bg-surface border-surface-border text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-surface-muted">Description (optional)</Label>
            <Input {...register("description")} className="bg-surface border-surface-border text-white" />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isAvailable" {...register("isAvailable")} className="rounded border-surface-border bg-surface text-brand" />
            <Label htmlFor="isAvailable" className="text-surface-muted cursor-pointer">Available for sale</Label>
          </div>

          <DialogFooter className="border-t border-surface-border pt-4">
             <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="bg-transparent border-surface-border text-white hover:bg-surface">
              Cancel
             </Button>
             <Button type="submit" disabled={isSubmitting} className="bg-brand hover:bg-brand-hover text-white font-semibold">
              {isSubmitting ? "Saving..." : "Save Product"}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
