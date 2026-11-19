import { PaymentMethod } from "@prisma/client";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.UPI]: "UPI",
  [PaymentMethod.CARD]: "Card",
  [PaymentMethod.WALLET]: "Wallet",
  [PaymentMethod.COMPLIMENTARY]: "Complimentary",
};

export const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod);
