# SafeHost Campus: Project Documentation

## Overview

SafeHost Campus is a web application for students living in hostels to submit and track maintenance, hygiene, safety, infrastructure, and management complaints. A complaint can include a title, description, category, hostel location, severity, and optional image.

The application is built with Next.js App Router, React, and TypeScript. Supabase provides email/password authentication, Postgres storage for complaints, and Storage for uploaded images when configured.

## User roles and routes

### Students

- `/` provides student registration and login.
- `/dashboard` shows complaint counts, a new complaint form, and the student's recent reports.
- The email form currently accepts Gmail addresses only.
- When Supabase email confirmation is enabled, students must confirm their address before signing in. The login form provides a resend-confirmation action for unconfirmed accounts.

### Administrators

- `/admin` provides a separate admin login and complaint review panel.
- The panel can list complaints and mark them resolved when the configured data permissions allow it.
- The current admin credentials are fixed in client-side code and documented in the root README. They are not suitable for production use.

## Development setup

### Requirements

- Node.js 20.9 or newer; Node.js 22 is recommended.
- npm.

### Start the application

From the repository root, run:

```powershell
Set-Location app
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

### Environment configuration

Set the following values in `app/.env.local` for Supabase-backed features:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use only a Supabase publishable/anon key in `NEXT_PUBLIC_` variables. Never expose a Supabase `service_role` key or another private server key to the browser. The `.env.local` file is git-ignored and must not be committed.

When the Supabase URL or key is absent, the app uses browser `localStorage` for a development fallback. This mode is not secure, has no shared database, and stores account data in the user's browser.

## Supabase setup

1. Create a Supabase project and configure the environment values above.
2. Run [`supabase-schema.sql`](supabase-schema.sql) in the Supabase SQL Editor. It creates `public.complaints` and enables row-level security with starter policies.
3. Create a Storage bucket named `complaints`. The app uploads issue images there and renders public URLs. Configure bucket visibility and Storage policies according to your privacy requirements; public buckets allow anyone with an image URL to view it.
4. Enable email/password authentication in Supabase Auth. Configure the site URL and allowed redirect URLs for local development and each deployed origin. Add `http://localhost:3000` for local testing.
5. Verify that the signup/confirmation email arrives before testing first login. Supabase's default email service can rate-limit repeated requests; use custom SMTP for sustained use.

The supplied SQL policies are a starting point, not a finished production access model. The admin panel requests all complaints and updates statuses, but the sample policies are user-oriented. Before public deployment, implement a server-verified admin role and database policies that grant only the intended administrative access.

## Complaint data

The complaints table defined in `supabase-schema.sql` contains:

| Column | Purpose |
| --- | --- |
| `id` | Unique complaint ID |
| `user_id` | Supabase user ID, when available |
| `full_name` | Student display name, when provided |
| `email` | Student email address |
| `title` | Short issue summary |
| `description` | Details of the issue |
| `category` | Issue classification |
| `location` | Hostel block, floor, or location |
| `severity` | Reported urgency |
| `image_url` | Optional image URL |
| `status` | Complaint state, initially `Open` |
| `created_at` | Submission timestamp |

## Common commands

Run from `app/`:

```powershell
npm run dev
npm run build
npm run start
npm run lint
```

## Security and production readiness

- The admin ID/password are embedded in client-side code and are visible in the public repository and browser bundle. Anyone with access to the app can inspect them. Replace this with server-side authentication before deployment to real users.
- The local fallback is for development only and must not be treated as secure authentication or durable storage.
- Review and test complaint-table RLS and Storage policies, including administrator access, before using real student data.
- Never put private keys in client-visible environment variables or commit `.env.local`.

For the concise project setup and Firebase App Hosting instructions, see the [root README](README.md).
