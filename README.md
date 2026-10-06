# SafeHost Campus

SafeHost Campus is a hostel complaint tracker for students to report maintenance, hygiene, safety, infrastructure, and management issues. Reports can include a description and photo, and administrators can review their status.

## Features

- Student registration and login with email and password; the current form accepts Gmail addresses only.
- Supabase Auth email confirmation, with a resend-confirmation action.
- Complaint submission with category, location, severity, description, and optional image.
- Student complaint history and status summaries.
- A separate admin route for reviewing complaints and marking them resolved.
- Browser-local fallback for development when Supabase environment variables are not set.

## Technology

- Next.js App Router, React, TypeScript
- Supabase Auth, Postgres, and Storage
- Custom CSS

The Next.js application is in [`app/`](app/). Product and design notes are in [`documentation.md`](documentation.md), [`idea-origin.md`](idea-origin.md), [`solution.md`](solution.md), and [`userflow.md`](userflow.md).

## Requirements

- Node.js 20.9 or newer; Node.js 22 is recommended.
- npm
- A Supabase project for persistent authentication, complaint data, and image uploads.

## Run locally

From the repository root:

```powershell
Set-Location app
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Set the real values in `app/.env.local` before using Supabase features:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use a Supabase publishable/anon key only. Never put a Supabase `service_role` key or other server secret in a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git; do not commit it.

If the Supabase variables are absent, student accounts and complaints use browser `localStorage`. This is a demo fallback, not secure authentication or shared persistence. Data in that mode exists only in that browser.

## Configure Supabase

1. Create a Supabase project and set its URL and publishable/anon key in `app/.env.local`.
2. In the Supabase SQL Editor, run [`supabase-schema.sql`](supabase-schema.sql) to create the complaints table and its initial row-level security policies.
3. Create a Storage bucket named `complaints`. The app obtains public image URLs from this bucket. Configure Storage access policies appropriate to your project before accepting real uploads; making a bucket public means its images can be viewed by anyone with the URL.
4. In Supabase Auth settings, configure the site URL and allowed redirect URLs for local development and each deployed app origin. For local development, use `http://localhost:3000`.
5. Enable email/password authentication. Students must confirm the message sent by Supabase before their first login when email confirmation is enabled. If the email is delayed or blocked by Supabase's sending limit, wait before requesting another message or configure a custom SMTP provider.

The supplied SQL policies are a starting point, not a complete production authorization design. In particular, the admin interface requests all complaints and updates complaint status, while the sample policies are user-oriented. Define and test a secure admin role and corresponding database policies before relying on admin operations with Supabase.

## Routes

- `/` - student login and registration
- `/dashboard` - student complaint dashboard (also the main app entry)
- `/admin` - administrator login and complaint review

## Admin access

Open `/admin` and use these prototype credentials:

- Admin ID: `arpithimanshu277`
- Password: `290306ar`

These credentials are hard-coded in the client application and visible in this public repository. They are not secure; replace them with server-verified admin authentication before public deployment.

## Commands

Run these from `app/`:

```powershell
npm run dev       # Start the development server
npm run build     # Create a production build
npm run start     # Start the production server
npm run lint      # Run ESLint
```

## Deploy with Firebase App Hosting

Firebase App Hosting supports Next.js, but requires a Firebase project on the Blaze (pay-as-you-go) plan. The Firebase CLI must be version 14.4.0 or newer. Use Node.js 20, 22, or 24 for the CLI; Node.js 22 is recommended.

1. Install or invoke the Firebase CLI and sign in with `firebase login`.
2. From the repository root, run `firebase init apphosting` and select the Firebase project and backend. Set the app root directory to `app` when prompted.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the App Hosting backend's environment configuration. Add the deployed app URL to Supabase Auth's allowed redirect URLs.
4. Deploy with `firebase deploy` from the directory containing the generated Firebase configuration.

See the [Firebase App Hosting guide](https://firebase.google.com/docs/app-hosting/get-started) and [source deployment instructions](https://firebase.google.com/docs/app-hosting/alt-deploy) for current setup requirements. Do not commit `.env.local` or store private keys in client-visible environment variables.

## Security notes

The current admin ID and password are hard-coded in the client application, so they are visible to anyone who can inspect the site bundle or repository. This is suitable only for a prototype; replace it with server-verified admin authentication before public deployment. Local fallback passwords are also stored in browser storage and must not be used for real accounts.
