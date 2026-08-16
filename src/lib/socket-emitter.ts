/**
 * Helper to emit Socket.io events from anywhere in the Next.js backend (API routes/services).
 * It uses the global `io` instance attached by `server.ts`.
 */
export function emitSocketEvent(event: string, data?: any) {
  if (typeof window === "undefined") {
    // Server-side
    const io = (global as any).io;
    if (io) {
      io.emit(event, data);
      console.log(`[Socket] Emitted event: ${event}`);
    } else {
      console.warn(
        `[Socket] Failed to emit '${event}'. Socket.io not initialized on global object.`
      );
    }
  }
}
