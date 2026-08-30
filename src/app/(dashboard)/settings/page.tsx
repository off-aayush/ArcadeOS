import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  const permissions = user.role.permissions;

  if (permissions.includes("MANAGE_USERS" as any)) {
    redirect("/settings/users");
  } else if (permissions.includes("MANAGE_DISCOUNTS" as any)) {
    redirect("/settings/discounts");
  } else if (permissions.includes("VIEW_AUDIT_LOGS" as any)) {
    redirect("/settings/audit-logs");
  } else if (permissions.includes("MANAGE_PARLOUR_PROFILE" as any)) {
    redirect("/settings/profile");
  } else {
    redirect("/dashboard");
  }
}
