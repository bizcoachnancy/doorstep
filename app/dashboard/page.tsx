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
        
