export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import FollowupsClient from "./ui/FollowupsClient";
import { listFollowupsDueAction } from "./actions";

export default async function FollowupsPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login");

  const res = await listFollowupsDueAction();
  if (!res.ok) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="text-lg font-semibold text-zinc-900">Follow-ups Error</div>
          <div className="mt-2 text-sm text-zinc-600">{res.error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <FollowupsClient initial={res.data} />
    </div>
  );
}
