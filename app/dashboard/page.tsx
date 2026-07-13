"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TEMPLATES: Record<string, { label: string; color: string; stamp: string }> = {
  listed: { label: "Just Listed", color: "#B98B3E", stamp: "LISTED" },
  sold: { label: "Just Sold", color: "#C1442D", stamp: "SOLD" },
  openhouse: { label: "Open House", color: "#2C6E49", stamp: "OPEN HOUSE" },
  networking: { label: "Nice to Meet You", color: "#16283D", stamp: "HELLO" },
  keepsake: { label: "Keepsake", color: "#2C6E49", stamp: "HOME" },
};

export default function Dashboard() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState("listed");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [signedBy, setSignedBy] = useState("");
  const [recipient, setRecipient] = useState({ name: "", street: "", apt: "", city: "", state: "", zip: "" });
  const [saved, setSaved] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [subActive, setSubActive] = useState(false);

  useEffect(() => {
    loadPostcards();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();
    setSubActive(data?.status === "active");
  };

  const loadPostcards = async () => {
    const res = await fetch("/api/postcards");
    const { postcards } = await res.json();
    setSaved(postcards || []);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user!.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("postcard-photos").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("postcard-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const canSave = photoFile && (recipient.name || recipient.street);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const photoUrl = await uploadPhoto(photoFile!);
      await fetch("/api/postcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          photo_url: photoUrl,
          message,
          signed_by: signedBy,
          recipient_name: recipient.name,
          street: recipient.street,
          apt: recipient.apt,
          city: recipient.city,
          state: recipient.state,
          zip: recipient.zip,
        }),
      });
      setMessage("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setRecipient({ name: "", street: "", apt: "", city: "", state: "", zip: "" });
      await loadPostcards();
    } catch (err) {
      alert("Something went wrong saving that postcard. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleMail = async (postcardId: string) => {
    const res = await fetch("/api/postgrid/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postcardId }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Could not send that postcard.");
      return;
    }
    await loadPostcards();
  };

  const t = TEMPLATES[template];

  return (
    <div style={{ background: "#F2F0EC", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ background: "#16283D", padding: "20px 24px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>🚪 Doorstep</div>
        {!subActive && (
          <a href="/billing" style={{ color: "#B98B3E", fontSize: 13, fontWeight: 600 }}>
            Subscribe to unlock mailing →
          </a>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 60px" }}>
        <Card title="1 · Photo">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: 14, borderRadius: 8, border: "none", background: "#16283D", color: "#fff", fontWeight: 600 }}
          >
            📸 Take or Choose Photo
          </button>
          {photoPreview && <img src={photoPreview} style={{ width: "100%", marginTop: 10, borderRadius: 8, maxHeight: 160, objectFit: "cover" }} />}
        </Card>

        <Card title="2 · Type of Card">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {Object.entries(TEMPLATES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                style={{
                  padding: "10px", borderRadius: 8,
                  border: template === key ? `2px solid ${val.color}` : "1px solid #ddd",
                  background: template === key ? `${val.color}14` : "#fff",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                {val.label}
              </button>
            ))}
          </div>
        </Card>

        <Card title="3 · Message">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your message..."
            style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: 10, boxSizing: "border-box" }}
          />
          <input
            value={signedBy}
            onChange={(e) => setSignedBy(e.target.value)}
            placeholder="Signed by"
            style={{ width: "100%", marginTop: 8, border: "1px solid #ddd", borderRadius: 8, padding: 10, boxSizing: "border-box" }}
          />
        </Card>

        <Card title="4 · Send To">
          <div style={{ display: "grid", gap: 8 }}>
            <Input placeholder="Recipient Name" value={recipient.name} onChange={(v) => setRecipient({ ...recipient, name: v })} />
            <Input placeholder="Street Address" value={recipient.street} onChange={(v) => setRecipient({ ...recipient, street: v })} />
            <Input placeholder="Apt / Unit (optional)" value={recipient.apt} onChange={(v) => setRecipient({ ...recipient, apt: v })} />
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
              <Input placeholder="City" value={recipient.city} onChange={(v) => setRecipient({ ...recipient, city: v })} />
              <Input placeholder="ST" value={recipient.state} onChange={(v) => setRecipient({ ...recipient, state: v })} />
              <Input placeholder="ZIP" value={recipient.zip} onChange={(v) => setRecipient({ ...recipient, zip: v })} />
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{ width: "100%", marginTop: 14, padding: 14, borderRadius: 8, border: "none", background: canSave ? "#B98B3E" : "#ddd", color: canSave ? "#16283D" : "#999", fontWeight: 700 }}
          >
            {saving ? "Saving..." : "Save Postcard"}
          </button>
        </Card>

        {saved.length > 0 && (
          <Card title={`Saved Postcards (${saved.length})`}>
            <div style={{ display: "grid", gap: 12 }}>
              {saved.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={p.photo_url} style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.recipient_name || p.street}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{TEMPLATES[p.template]?.label} · {p.fulfillment_status}</div>
                  </div>
                  {p.fulfillment_status === "draft" && (
                    <button
                      onClick={() => handleMail(p.id)}
                      disabled={!subActive}
                      style={{ fontSize: 12, padding: "6px 10px", borderRadius: 6, border: "none", background: subActive ? "#16283D" : "#ddd", color: subActive ? "#fff" : "#999" }}
                    >
                      Mail it
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 14, border: "1px solid #e7e2d6" }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: 10, boxSizing: "border-box" }}
    />
  );
}
        
