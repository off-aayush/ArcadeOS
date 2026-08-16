"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Root Providers — combines all context providers in one place.
// App Router pattern: all "use client" providers are composed here,
// so the root layout stays a React Server Component.
// ─────────────────────────────────────────────────────────────────────────────

import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { SocketProvider } from "@/providers/socket-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SocketProvider>
          {children}
        </SocketProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
