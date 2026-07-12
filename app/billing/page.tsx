"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BillingPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("status, plan, current_period_end")
        .eq("user_id", user.id)
        .single();
      setStatus(data?.status ?? "inactive");
      setLoading(false);
    })();
  }, []);

  const subscribe = async (plan: "monthly" | "annual") => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  };

  if (loading) return <p style={{ padding: 40 }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 480, margin: "60px auto", fontFamily: "sans-serif", padding: 20 }}>
      <h1>Billing</h1>
      <p style={{ margin: "12px 0 24px", color: "#555" }}>
        Current status: <strong>{status}</strong>
      </p>

      {status !== "active" && (
        <div style={{ display: "grid", gap: 12 }}>
          <button
            onClick={() => subscribe("monthly")}
            style={{ padding: 14, borderRadius: 8, background: "#16283D", color: "#fff", border: "none", fontWeight: 600 }}
          >
            Subscribe monthly — $29/mo
          </button>
          <button
            onClick={() => subscribe("annual")}
            style={{ padding: 14, borderRadius: 8, background: "#B98B3E", color: "#16283D", border: "none", fontWeight: 700 }}
          >
            Subscribe annually — $19.99/mo (save 31%)
          </button>
        </div>
      )}

      {status === "active" && (
        <p style={{ color: "#2C6E49", fontWeight: 600 }}>
          ✓ You're all set — unlimited postcards and PostGrid mailing are active.
        </p>
      )}
    </div>
  );
}
