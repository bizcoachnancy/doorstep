# Doorstep — deployment guide

This is a complete, ready-to-deploy Next.js app: accounts/login, the postcard
tool, Stripe subscription billing, and PostGrid drop-ship mailing. Follow
these steps in order — same general shape as however the nursing-home app
went live, but this is a **brand-new, separate Supabase + Vercel project**.

## 0. Prerequisites
- A Vercel account
- A **new** Supabase project (do not reuse the nursing-home one)
- A Stripe account
- A PostGrid account (you already have one — reuse the same account, just
  create a new API key if you want to keep usage separate for tracking)

## 1. Supabase setup
1. Create a new project at supabase.com — name it something like `doorstep-prod`.
2. Go to the SQL editor, paste in the contents of `supabase/schema.sql`, and run it.
3. Go to Storage → Create a new bucket called `postcard-photos`. Set it to
   **public** (simplest for now — the photos aren't sensitive) or private with
   signed URLs if you'd rather lock it down later.
4. Go to Project Settings → API. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to Authentication → Providers, make sure Email is enabled. Under
   Authentication → URL Configuration, set the Site URL to your future
   Vercel URL once you have it (you can update this after step 4 below).

## 2. Stripe setup
1. In the Stripe Dashboard, create a Product called "Doorstep."
2. Add two Prices to it:
   - Recurring, monthly, $29.00 → copy its Price ID to `STRIPE_PRICE_MONTHLY`
   - Recurring, yearly, $239.88 ($19.99/mo equivalent) → copy its Price ID to
     `STRIPE_PRICE_ANNUAL`
3. Go to Developers → API keys → copy the Secret key to `STRIPE_SECRET_KEY`.
4. You'll set up the webhook (`STRIPE_WEBHOOK_SECRET`) in step 4, after you
   have a live URL to point it at.

## 3. PostGrid setup
1. In your PostGrid dashboard, grab your API key (start with the **test**
   key while you're setting things up) → `POSTGRID_API_KEY`.
2. Set `DEFAULT_RETURN_NAME`, `DEFAULT_RETURN_ADDRESS1`, `DEFAULT_RETURN_CITY`,
   `DEFAULT_RETURN_STATE`, `DEFAULT_RETURN_ZIP` to whatever return address you
   want printed on the postcards for now (your business address, or a PO box).
3. Note: PostGrid's exact API field names can change over time — before
   sending real mail, open `lib/postgrid.ts` and compare the request body
   against PostGrid's current docs at documentation.postgrid.com.

## 4. Deploy to Vercel
1. Push this project to a new GitHub repo (keep it separate from the
   nursing-home repo).
2. Import that repo into Vercel.
3. In Vercel's Environment Variables settings, add every variable from
   `.env.example` with the real values from steps 1–3.
4. Deploy. Copy your live URL (e.g. `https://doorstep-app.vercel.app`) into
   `NEXT_PUBLIC_SITE_URL` in Vercel's env settings, then redeploy.
5. Back in Supabase → Authentication → URL Configuration, update the Site URL
   to match your real Vercel URL.
6. Back in Stripe → Developers → Webhooks → Add endpoint:
   `https://your-vercel-url.vercel.app/api/webhook/stripe`
   Select events: `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_failed`.
   Copy the signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel, redeploy.

## 5. Test the whole flow
1. Visit `/signup`, create a test account, confirm the email.
2. Log in, go to `/dashboard`, create a test postcard (a photo + your own
   address works fine for testing).
3. Go to `/billing`, subscribe using a Stripe test card (4242 4242 4242 4242,
   any future date/CVC).
4. Back on `/dashboard`, hit "Mail it" on your test postcard — check
   PostGrid's dashboard to confirm it was received (use PostGrid's test mode
   so you don't actually spend money mailing yourself a postcard).
5. Once everything checks out, swap the Stripe and PostGrid keys from test
   to live mode.

## What's intentionally left for later
- Per-user return address (currently one shared default address for all users)
- Bulk/farm-list sending (the prototype supports it in the UI; the backend
  here saves postcards one at a time — batching many inserts + PostGrid
  sends is a straightforward next step)
- Password reset flow, account settings page
- Email receipts / notifications when a postcard is mailed
