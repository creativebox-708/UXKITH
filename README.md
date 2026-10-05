# UXKITH

A mobile-first web app for Config India 2026 (Bangalore, 15 October). Invitees sign in with
LinkedIn, find the people they actually came to meet, tap **Interested to meet**, and get a chat
once the interest runs both ways. On the day, one tap says **I'm here**.

No phone number is collected or shared anywhere in the app.

---

## Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel |
| Backend | Supabase — Postgres, Auth, Realtime, RLS, Edge Functions |
| Auth | Supabase Auth, LinkedIn (OIDC) provider — the only sign-in method |
| Email | Resend, from two Supabase Edge Functions |

The UI is dark-only and designed at 380px first. The design tokens live in
[`app/globals.css`](app/globals.css) under `@theme`.

---

## Getting it running

### 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://ypwolsbxtikuhwetzmig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key from Supabase → Settings → API>
APP_URL=http://localhost:3000
EVENT_DAY_ENABLED=false
```

`SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` are **not** read by the Next app. They belong to
the Edge Functions only (see below). Nothing server-side in this repo ever needs the service role.

### 2. Turn on the LinkedIn provider

This is the one step that cannot be done from code, and nobody can sign in until it is done.

1. Create an app at <https://www.linkedin.com/developers/apps> and add the **Sign In with LinkedIn
   using OpenID Connect** product. Request the `openid`, `profile` and `email` scopes.
2. In Supabase → Authentication → Providers → **LinkedIn (OIDC)**: enable it and paste the client
   ID and client secret.
3. Copy the callback URL Supabase shows you
   (`https://ypwolsbxtikuhwetzmig.supabase.co/auth/v1/callback`) into the LinkedIn app's
   **Authorized redirect URLs**.
4. In Supabase → Authentication → URL Configuration, set the Site URL to your deployed origin and
   add `http://localhost:3000/**` plus `https://<your-domain>/**` to the redirect allow-list.

### 3. Run it

```bash
npm run dev
```

### 4. Deploy

Push to GitHub, import the repo on Vercel, and set `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `APP_URL` and `EVENT_DAY_ENABLED` as project environment
variables. On the morning of the event, flip `EVENT_DAY_ENABLED` to `true` and redeploy to reveal
the "I'm here" button.

---

## Database

The schema, RLS policies, triggers and RPCs are in [`supabase/migrations`](supabase/migrations) and
are already applied to the project. They are the source of truth — if you change something in the
dashboard, write a migration for it too.

```bash
npx supabase link --project-ref ypwolsbxtikuhwetzmig
npx supabase db push
```

### How the data model holds together

- **`profiles`** — one row per auth user, created by the `handle_new_user` trigger from the
  LinkedIn OIDC claims. The email address stays in `auth.users` and is never copied here.
  `onboarded_at` records that the invite question has been answered; `has_invite` records the
  answer.
- **`interests`** — one row per `(from_user, to_user)` pair. Insert = tagged, delete = undo.
- **`matches`** — written only by triggers, never by the client. `on_interest_insert` creates or
  reactivates the ordered pair when the reverse interest exists; `on_interest_delete` sets
  `active = false` and keeps the messages.
- **`blocks`** — `on_block_insert` deletes the interests both ways and deactivates the match. The
  two people then disappear from each other everywhere, chat included.

### How reads are shaped

Everything the UI renders comes back as one composite type, `profile_card`, built by
`cards_for(uuid[])`. The public inbound counter needs a count of rows the viewer is not allowed to
select, so these are `security definer` functions that re-apply the visibility rules themselves,
rather than raw selects:

| Function | Used by |
| --- | --- |
| `suggested_profiles(limit)` | `/home` — daily-seeded shuffle, biased toward people with fewer inbound interests |
| `browse_profiles(search, role, city, company, limit, offset)` | `/browse` |
| `my_outgoing()` / `my_inbound()` | the my-list modal's two tabs |
| `attendee_count()` / `inbound_count()` | the top bar and the inbound banner |
| `interest_counts(uuid[])` | reconciling the counter after an optimistic tap |
| `match_partner(match_id)` | the chat header |
| `filter_options()` | the city and company chips |
| `delete_my_account()` | Settings → delete, cascades everything |

Execute is revoked from `anon` and `public` on everything in the `public` schema; only the
functions above are granted to `authenticated`.

---

## Edge Functions (email)

Two functions, both deployed and both requiring a valid JWT. They re-check the caller's claim
against the database before sending anything, and they no-op with a log line if `RESEND_API_KEY` is
not set — so email can never fail a tap.

| Function | Sends |
| --- | --- |
| `notify-interest` | "Someone at Config wants to meet you", to the person who was tagged |
| `notify-here` | "[Name] is at Config now", to that person's active mutual matches |

Set their secrets once:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="UXKITH <hello@yourdomain.com>" APP_URL=https://your-domain.com
```

Until you verify a domain in Resend, leave `EMAIL_FROM` unset and it falls back to Resend's
`onboarding@resend.dev` sandbox sender, which only delivers to your own Resend account address.
**Verify a domain before testing with real people**, and check that the first sends do not land in
spam.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

---

## Deliberately not built

Group chat, a forum, photo sharing, a live map, QR check-ins, travel or stay matching, payments, a
"most wanted" leaderboard, a native app, push notifications, and any sign-in method other than
LinkedIn. The `/quiz` route and its `quiz_scores` table are specced but not implemented — that was
always conditional on everything else being solid and tested first.

## Before you go live

- [ ] LinkedIn OIDC provider configured, and a real end-to-end sign-in tested on an Android phone and an iPhone
- [ ] Resend domain verified, `EMAIL_FROM` set, and a test email checked against spam filters
- [ ] Both names and LinkedIn URLs filled in at [`lib/builders.ts`](lib/builders.ts)
- [ ] `APP_URL` set on Vercel and in the Edge Function secrets, so email links point at production
