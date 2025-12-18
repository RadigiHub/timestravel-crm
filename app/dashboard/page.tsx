export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
<a
  href="/leads"
  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100"
>
  Open Leads Board
</a>

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <LogoutButton />
      </div>
      
      <div className="mt-6 rounded-2xl border p-5">
        <p className="text-sm text-gray-600">Logged in as</p>
        <p className="text-lg font-medium">{data.user?.email}</p>
      </div>
    </div>
  );
}
