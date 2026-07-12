"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard` },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "sans-serif", padding: 20 }}>
        <h1>Check your email 📬</h1>
        <p>We sent you a confirmation link — click it, then log in.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>🚪 Create your Doorstep account</h1>
      <form onSubmit={handleSignup} style={{ display: "grid", gap: 12 }}>
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
          minLength={6}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
        />
        {error && <p style={{ color: "#C1442D", fontSize: 13 }}>{error}</p>}
        <button
          type="submit"
          style={{ padding: 12, borderRadius: 8, background: "#B98B3E", color: "#16283D", border: "none", fontWeight: 700 }}
        >
          Sign up
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </div>
  );
}
