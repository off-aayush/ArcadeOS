"use client";

import { useEffect, useState } from "react";
import { ParlourProfile } from "@prisma/client";
import { useParlourProfile, useUpdateParlourProfile } from "@/features/parlour-profile/hooks/use-parlour-profile";
import { toast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Phone, Mail, MapPin, Receipt, Globe, Loader2 } from "lucide-react";

type ProfileForm = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  receiptFooter: string;
  currencySymbol: string;
  timezone: string;
};

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-6 space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand/10 border border-brand/20">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-surface-muted">{label}</Label>
      {children}
    </div>
  );
}

export default function ParlourProfilePage() {
  const { data: profile, isLoading } = useParlourProfile();
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateParlourProfile();

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    tagline: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    receiptFooter: "",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        tagline: profile.tagline || "",
        phone: profile.phone || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
        gstin: profile.gstin || "",
        receiptFooter: profile.receiptFooter || "",
        currencySymbol: profile.currencySymbol || "₹",
        timezone: profile.timezone || "Asia/Kolkata",
      });
    }
  }, [profile]);

  const set = (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateProfile({
        name: form.name.trim() || undefined,
        tagline: form.tagline.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        gstin: form.gstin.trim().toUpperCase() || null,
        receiptFooter: form.receiptFooter.trim() || null,
        currencySymbol: form.currencySymbol.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
      });
      toast.add({ title: "Saved", description: "Parlour profile updated successfully.", type: "success" });
    } catch (err: any) {
      toast.add({ title: "Error", description: err.message || "Failed to save profile.", type: "error" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Parlour Profile</h2>
          <p className="text-sm text-surface-muted mt-1">
            Business information shown on invoices, receipts, and reports.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand"
        >
          {isSaving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
          ) : "Save Changes"}
        </Button>
      </div>

      {/* Business Identity */}
      <Section title="Business Identity" icon={Building2}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="name" label="Parlour / Business Name *">
              <Input
                id="name"
                placeholder="e.g. Galaxy Arcade"
                value={form.name}
                onChange={set("name")}
                className="bg-surface border-surface-border text-white"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field id="tagline" label="Tagline / Slogan">
              <Input
                id="tagline"
                placeholder="e.g. Play. Win. Repeat."
                value={form.tagline}
                onChange={set("tagline")}
                className="bg-surface border-surface-border text-white"
              />
            </Field>
          </div>
          <Field id="gstin" label="GSTIN">
            <Input
              id="gstin"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={form.gstin}
              onChange={set("gstin")}
              className="bg-surface border-surface-border text-white font-mono uppercase"
              maxLength={15}
            />
          </Field>
          <Field id="currencySymbol" label="Currency Symbol">
            <Input
              id="currencySymbol"
              placeholder="₹"
              value={form.currencySymbol}
              onChange={set("currencySymbol")}
              className="bg-surface border-surface-border text-white"
              maxLength={5}
            />
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section title="Contact Details" icon={Phone}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="phone" label="Phone Number">
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={form.phone}
              onChange={set("phone")}
              className="bg-surface border-surface-border text-white"
            />
          </Field>
          <Field id="email" label="Email Address">
            <Input
              id="email"
              type="email"
              placeholder="e.g. hello@myarcade.in"
              value={form.email}
              onChange={set("email")}
              className="bg-surface border-surface-border text-white"
            />
          </Field>
        </div>
      </Section>

      {/* Address */}
      <Section title="Address" icon={MapPin}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="address" label="Street Address">
              <Input
                id="address"
                placeholder="e.g. 12, MG Road, 2nd Floor"
                value={form.address}
                onChange={set("address")}
                className="bg-surface border-surface-border text-white"
              />
            </Field>
          </div>
          <Field id="city" label="City">
            <Input
              id="city"
              placeholder="e.g. Pune"
              value={form.city}
              onChange={set("city")}
              className="bg-surface border-surface-border text-white"
            />
          </Field>
          <Field id="state" label="State">
            <Input
              id="state"
              placeholder="e.g. Maharashtra"
              value={form.state}
              onChange={set("state")}
              className="bg-surface border-surface-border text-white"
            />
          </Field>
          <Field id="pincode" label="PIN Code">
            <Input
              id="pincode"
              placeholder="e.g. 411001"
              value={form.pincode}
              onChange={set("pincode")}
              className="bg-surface border-surface-border text-white"
              maxLength={10}
            />
          </Field>
          <Field id="timezone" label="Timezone">
            <Input
              id="timezone"
              placeholder="e.g. Asia/Kolkata"
              value={form.timezone}
              onChange={set("timezone")}
              className="bg-surface border-surface-border text-white"
            />
          </Field>
        </div>
      </Section>

      {/* Receipt Footer */}
      <Section title="Receipt & Billing" icon={Receipt}>
        <Field id="receiptFooter" label="Receipt Footer Text">
          <textarea
            id="receiptFooter"
            rows={3}
            placeholder="e.g. Thank you for playing! Visit us again. | GST applicable as per government norms."
            value={form.receiptFooter}
            onChange={set("receiptFooter")}
            maxLength={500}
            className="w-full rounded-lg bg-surface border border-surface-border text-white px-3 py-2 text-sm placeholder:text-surface-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-brand/40"
          />
          <p className="text-[11px] text-surface-muted text-right">{form.receiptFooter.length}/500</p>
        </Field>
      </Section>

      {/* Sticky Save bar for mobile */}
      <div className="flex justify-end pt-2 pb-8">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand hover:bg-brand-600 text-white font-semibold shadow-glow-brand"
        >
          {isSaving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
