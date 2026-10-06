# Solution

The solution is a student-friendly web application that allows hostel residents to report maintenance and safety issues in a structured, quick, and anonymous-friendly manner.

## Key Features

- Google-based registration and login
- Student dashboard for submitting complaints
- Text-based issue reporting
- Image upload or photo evidence attachment
- Category-based complaint types
- Hostel/location tagging
- Complaint status tracking
- Complaint history and resolution updates
- Supabase-powered data storage

## Why this works

The platform reduces friction in complaint reporting by moving it from informal conversations to a trusted digital channel. Students can upload evidence, describe the issue clearly, and keep a record that management can access and act upon.

This makes it easier for institutions to monitor recurring problems, assign resolution duties, and maintain accountability for repairs and facility issues.

## Technical Approach

- Frontend: Next.js app
- Database: Supabase PostgreSQL
- Authentication: Google OAuth via Supabase Auth
- Storage: complaint images stored as text URLs or Supabase Storage-ready files
- Reporting process: complaint form -> validation -> save in database -> dashboard tracking

## Expected Outcome

The app creates a more transparent complaint mechanism, reduces delays, and helps college or school administrators manage hostel infrastructure and student concerns more effectively.
