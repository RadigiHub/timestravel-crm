export const dynamic = "force-dynamic";
export const revalidate = 0;
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  if (data?.user) redirect("/dashboard");
  redirect("/login");
}
