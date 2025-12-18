"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const signIn = async () => {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMsg(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Times Travel CRM</h1>
        <p className="text-sm text-gray-600 mt-1">Login to continue</p>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl border p-3"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={signIn}
            className="w-full rounded-xl bg-black text-white p-3"
          >
            Sign In
          </button>

          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
