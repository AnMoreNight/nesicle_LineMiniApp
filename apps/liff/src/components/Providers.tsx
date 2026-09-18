"use client";

import { useEffect, type ReactNode } from "react";
import { SessionProvider } from "@/lib/session";
import { useCartStore } from "@/lib/cartStore";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
