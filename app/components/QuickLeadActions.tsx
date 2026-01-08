"use client";

import Link from "next/link";
import { telLink, waLink } from "@/lib/leadLinks";
import type { Lead } from "@/app/leads/actions";

export default function QuickLeadActions({
  lead,
  openHref,
  onSnoozeTomorrow,
}: {
  lead: Lead;
  openHref: string;
  onSnoozeTomorrow: () => void;
}) {
  const phone = lead.phone || "";
  const name = lead.full_name || "there";

  const msg = `Hi ${name}! Times Travel CRM follow-up — just checking in about your trip. What dates are you considering?`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={waLink(phone, msg)}
        target="_blank"
        rel="noreferrer"
        className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        WhatsApp
      </a>

      <a
        href={telLink(phone)}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Call
      </a>

      <Link
        href={openHref}
        className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
      >
        Open
      </Link>

      <button
        onClick={onSnoozeTomorrow}
        className="rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
      >
        Snooze to Tomorrow
      </button>
    </div>
  );
}
