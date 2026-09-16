"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutUser } from "@/lib/actions/auth";

export function LogoutButton({
  className = "text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-60",
  label = "Se déconnecter",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    const result = await logoutUser();
    setPending(false);
    router.push(result.ok ? result.redirectTo : "/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className={className}
    >
      {pending ? "Déconnexion…" : label}
    </button>
  );
}
