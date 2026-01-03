"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/dashboard/logout-button";

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

export default function TopNav() {
  const pathname = usePathname();

  // Login page pe navbar hide
  if (pathname?.startsWith("/login")) return null;

  const isDashboard = pathname === "/dashboard";
  const isLeads = pathname?.startsWith("/leads");
  const isReports = pathname?.startsWith("/reports");

  return (
    <div className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            TimesTravel CRM
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink href="/dashboard" label="Dashboard" active={isDashboard} />
            <NavLink href="/leads" label="Leads Board" active={isLeads} />
            <NavLink
              href="/reports/agents"
              label="Reports"
              active={isReports}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Link
              href="/leads"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Leads
            </Link>
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
