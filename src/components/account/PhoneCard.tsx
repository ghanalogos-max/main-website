"use client";

import { useState } from "react";
import { CheckIcon, PhoneIcon } from "@/components/icons";
import PhoneVerification from "./PhoneVerification";

export default function PhoneCard({ phone, verified }: { phone: string | null; verified: boolean }) {
  const [changing, setChanging] = useState(false);

  if (!verified || changing) {
    return (
      <PhoneVerification
        current={changing ? null : phone}
        title={changing ? "Change your phone number" : undefined}
        description={
          changing
            ? "We'll text a code to the new number. Contributor payouts will go to the new number, so you'll confirm your wallet details again."
            : undefined
        }
        onCancel={changing ? () => setChanging(false) : undefined}
      />
    );
  }

  return (
    <section className="panel flex flex-wrap items-center justify-between gap-3 p-6">
      <div>
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <PhoneIcon size={20} />
          Phone number
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-gh-black/60 dark:text-white/50">
          {phone}
          <span className="inline-flex items-center gap-1 rounded-full bg-gh-green/10 px-2 py-0.5 text-xs font-semibold text-gh-green">
            <CheckIcon size={12} /> Verified
          </span>
        </p>
      </div>
      <button onClick={() => setChanging(true)} className="btn-outline">
        Change number
      </button>
    </section>
  );
}
