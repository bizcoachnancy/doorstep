import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPostcardViaPostGrid } from "@/lib/postgrid";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  // Require an active subscription before allowing fulfillment
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (!sub || sub.status !== "active") {
    return NextResponse.json(
      { error: "An active subscription is required to mail postcards." },
      { status: 402 }
    );
  }

  const { postcardId } = await req.json();
  const { data: postcard, error } = await supabase
    .from("postcards")
    .select("*")
    .eq("id", postcardId)
    .eq("user_id", user.id)
    .single();

  if (error || !postcard) {
    return NextResponse.json({ error: "Postcard not found" }, { status: 404 });
  }

  try {
    const result = await sendPostcardViaPostGrid(postcard);
    await supabase
      .from("postcards")
      .update({ fulfillment_status: "queued", postgrid_id: result.id })
      .eq("id", postcardId);
    return NextResponse.json({ success: true, postgrid: result });
  } catch (err: any) {
    await supabase
      .from("postcards")
      .update({ fulfillment_status: "failed" })
      .eq("id", postcardId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
