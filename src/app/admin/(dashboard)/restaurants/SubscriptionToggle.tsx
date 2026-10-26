"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { setSubscriptionAction } from "@/app/actions/admin";
import { dict, type Lang } from "@/lib/i18n";

type Props = {
  tenantId: string;
  status: "active" | "frozen";
  lang: Lang;
};

export default function SubscriptionToggle({ tenantId, status, lang }: Props) {
  const t = dict[lang];
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const nextStatus = status === "active" ? "frozen" : "active";

  function toggle() {
    startTransition(async () => {
      await setSubscriptionAction(tenantId, nextStatus);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
        status === "active"
          ? "border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
          : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
      }`}
    >
      {pending
        ? "..."
        : status === "active"
          ? `❄️ ${t["admin.freeze"]}`
          : `✨ ${t["admin.unfreeze"]}`}
    </button>
  );
}
