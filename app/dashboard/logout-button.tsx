"use client";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LogoutButton() {
  const supabase = supabaseBrowser();

  return (
    <button
      className="rounded-xl border px-4 py-2"
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
    >
      Logout
    </button>
  );
}
