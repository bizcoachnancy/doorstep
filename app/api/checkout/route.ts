import { NextRequest, NextResponse } from "next/server";
import { stripe, PRICE_IDS } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { plan } = await req.json(); // "monthly" | "annual"
  if (plan !== "monthly" && plan !== "annual") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email!,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing?canceled=true`,
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
