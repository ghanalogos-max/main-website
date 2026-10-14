"use client";

import { ExitIcon } from "@/components/icons";

export default function SignOutButton() {
  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <button onClick={signOut} className="btn-outline">
      <ExitIcon size={16} />
      Sign out
    </button>
  );
}
