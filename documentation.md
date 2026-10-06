# Project Documentation

## Project name
Hostel Complaint Tracker

## Purpose
A website where students living in hostels can report issues related to infrastructure, hygiene, safety, and management without hesitation.

## Core modules
- Authentication
- Dashboard
- Complaint form
- Complaint history
- Supabase integration
- Admin tracking support

## Tech stack
- Next.js
- TypeScript
- Supabase
- Google OAuth
- CSS modules / custom styling

## Local setup
1. Navigate to the app directory.
2. Install dependencies with npm install.
3. Create a .env.local file based on .env.example.
4. Add Supabase URL and anon key.
5. Run npm run dev.

## Environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

## Database idea
Use a complaints table with the following fields:
- id
- user_id
- full_name
- email
- title
- description
- category
- location
- severity
- image_url
- status
- created_at

## Notes
This application is designed to be a practical starter for hostel complaint management and can be extended with admin dashboards, notifications, and approval workflows.
