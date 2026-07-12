"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>🚪 Log in to Doorstep</h1>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
        />
        {error && <p style={{ color: "#C1442D", fontSize: 13 }}>{error}</p>}
        <button
          type="submit"
          style={{ padding: 12, borderRadius: 8, background: "#16283D", color: "#fff", border: "none", fontWeight: 600 }}
        >
          Log in
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        No account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
