"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Only connect on the client side
    // If NEXT_PUBLIC_APP_URL is not set, we pass empty string so Socket.IO defaults to window.location.origin
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const socketInstance = io(siteUrl, {
      path: "/socket.io",
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("[Socket.io] Connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("[Socket.io] Disconnected");
    });

    // ── Global Event Listeners ───────────────────────────────────────────────

    socketInstance.on("invalidate_stations", () => {
      console.log("[Socket.io] Re-fetching stations...");
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    });

    socketInstance.on("invalidate_sessions", () => {
      console.log("[Socket.io] Re-fetching sessions...");
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    });

    socketInstance.on("invalidate_bills", () => {
      console.log("[Socket.io] Re-fetching bills...");
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
