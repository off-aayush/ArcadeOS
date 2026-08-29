import { prisma } from "@/lib/prisma";
import { ParlourProfile } from "@prisma/client";

export interface UpdateParlourProfileInput {
  name?: string;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  receiptFooter?: string | null;
  logoUrl?: string | null;
  currencySymbol?: string;
  timezone?: string;
}

export class ParlourProfileService {
  private static readonly SINGLETON_ID = "singleton";

  /**
   * Always returns the single parlour profile row.
   * If it doesn't exist yet, creates it with defaults.
   */
  static async get(): Promise<ParlourProfile> {
    return prisma.parlourProfile.upsert({
      where: { id: this.SINGLETON_ID },
      update: {},
      create: { id: this.SINGLETON_ID },
    });
  }

  /**
   * Update (partial) the singleton parlour profile.
   */
  static async update(input: UpdateParlourProfileInput): Promise<ParlourProfile> {
    return prisma.parlourProfile.upsert({
      where: { id: this.SINGLETON_ID },
      update: input,
      create: { id: this.SINGLETON_ID, ...input },
    });
  }
}
