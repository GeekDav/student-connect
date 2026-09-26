"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getUnreadMessageCount } from "@/lib/actions/messages";

const POLL_MS = 10_000;

type MessagesUnreadContextValue = {
  unread: number;
  setUnread: (n: number) => void;
  refreshUnread: () => Promise<void>;
};

const MessagesUnreadContext = createContext<MessagesUnreadContextValue | null>(
  null,
);

export function MessagesUnreadProvider({
  children,
  enabled,
  initialUnread = 0,
}: {
  children: ReactNode;
  enabled: boolean;
  initialUnread?: number;
}) {
  const [unread, setUnread] = useState(initialUnread);

  const refreshUnread = useCallback(async () => {
    if (!enabled) return;
    try {
      const n = await getUnreadMessageCount();
      setUnread(n);
    } catch {
      /* ignore transient poll errors */
    }
  }, [enabled]);

  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  useEffect(() => {
    if (!enabled) return;

    void refreshUnread();

    const tick = () => {
      if (document.visibilityState === "visible") void refreshUnread();
    };

    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled, refreshUnread]);

  const value = useMemo(
    () => ({ unread, setUnread, refreshUnread }),
    [unread, refreshUnread],
  );

  return (
    <MessagesUnreadContext.Provider value={value}>
      {children}
    </MessagesUnreadContext.Provider>
  );
}

export function useMessagesUnread() {
  const ctx = useContext(MessagesUnreadContext);
  if (!ctx) {
    return {
      unread: 0,
      setUnread: (_n: number) => {},
      refreshUnread: async () => {},
    };
  }
  return ctx;
}

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white"
      aria-label={`${count} message${count > 1 ? "s" : ""} non lu${count > 1 ? "s" : ""}`}
    >
      {label}
    </span>
  );
}
