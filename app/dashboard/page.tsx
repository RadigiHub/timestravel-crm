import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

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
