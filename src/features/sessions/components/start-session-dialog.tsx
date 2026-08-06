"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StationListItem } from "@/features/stations/types";
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
import { toast } from "@/components/ui/toast";
import { STATION_TYPE_LABELS, API_ROUTES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { Gamepad2, Users, MapPin, DollarSign, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse } from "@/types";
import { CustomerListItem } from "@/features/customers/types";
import { cn } from "@/lib/utils";

interface StartSessionDialogProps {
  station: StationListItem;
  isOpen: boolean;
  onClose: () => void;
}

type CustomerResult = { customers: CustomerListItem[]; total: number };

export function StartSessionDialog({ station, isOpen, onClose }: StartSessionDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerCount, setPlayerCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | null>(null);

  // Debounced customer search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const handleSearchChange = (val: string) => {
    setCustomerSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const { data: customerData, isLoading: isSearching } = useQuery<ApiResponse<CustomerResult>>({
    queryKey: ["customers-search", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "active" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${API_ROUTES.customers}?${params}`);
      return res.json();
    },
    enabled: isOpen,
  });

  const customers = customerData?.success ? customerData.data.customers : [];

  const handleClose = () => {
    setPlayerCount(1);
    setNotes("");
    setCustomerSearch("");
    setDebouncedSearch("");
    setSelectedCustomer(null);
    onClose();
  };

  const handleStart = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(API_ROUTES.sessions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationId: station.id,
          customerId: selectedCustomer?.id || null,
          playerCount,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session");

      toast.add({
        title: "Session Started",
        description: `${station.name} is now active${selectedCustomer ? ` for ${selectedCustomer.name}` : ""}.`,
        type: "success",
      });

      // Invalidate station list to reflect OCCUPIED status + refresh timer
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      handleClose();
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] bg-surface-card border-surface-border text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Start Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Station Info Card */}
          <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-brand" />
              <span className="font-semibold text-white">{station.name}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-surface-muted">
              <span>{STATION_TYPE_LABELS[station.type as keyof typeof STATION_TYPE_LABELS]}</span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatCurrency(Number(station.ratePerHour))}/hr
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Max {station.maxPlayers}
              </span>
              {station.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {station.location}
                </span>
              )}
            </div>
          </div>

          {/* Customer Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-surface-muted">Customer (optional — leave blank for walk-in)</Label>

            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-success/40 bg-success/10 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-white">{selectedCustomer.name}</p>
                  {selectedCustomer.phone && (
                    <p className="text-xs text-surface-muted">{selectedCustomer.phone}</p>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); setDebouncedSearch(""); }}
                  className="text-xs text-surface-muted hover:text-danger transition-colors"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-muted" />
                  <input
                    type="text"
                    placeholder="Search by name, phone..."
                    value={customerSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-4 py-2 text-sm text-white placeholder:text-surface-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                {customerSearch && (
                  <div className="rounded-lg border border-surface-border bg-surface-card max-h-40 overflow-y-auto divide-y divide-surface-border/50">
                    {isSearching ? (
                      <p className="px-4 py-3 text-sm text-surface-muted">Searching...</p>
                    ) : customers.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-surface-muted">No customers found</p>
                    ) : (
                      customers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setDebouncedSearch(""); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                        >
                          <span className="text-sm font-medium text-white">{c.name}</span>
                          <span className="text-xs text-surface-muted">{c.phone || c.email || ""}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Player Count */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-surface-muted">Number of Players</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlayerCount(Math.max(1, playerCount - 1))}
                className="h-9 w-9 rounded-lg border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors text-lg font-bold"
              >
                −
              </button>
              <span className="w-12 text-center text-lg font-bold text-white">{playerCount}</span>
              <button
                type="button"
                onClick={() => setPlayerCount(Math.min(station.maxPlayers, playerCount + 1))}
                className="h-9 w-9 rounded-lg border border-surface-border bg-surface text-white hover:bg-surface-hover transition-colors text-lg font-bold"
              >
                +
              </button>
              <span className="text-xs text-surface-muted">(max {station.maxPlayers})</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-surface-muted">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Birthday party, tournament round..."
              className="bg-surface border-surface-border text-white"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-surface-border gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="bg-transparent border-surface-border hover:bg-surface text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isSubmitting}
            className="bg-success hover:bg-success/80 text-white font-semibold"
          >
            {isSubmitting ? "Starting..." : "▶ Start Session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
