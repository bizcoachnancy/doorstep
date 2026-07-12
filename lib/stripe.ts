import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Set these to the Price IDs you create in the Stripe Dashboard
// (Products > Doorstep > Pricing). See README for exact steps.
export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ANNUAL!,
};
