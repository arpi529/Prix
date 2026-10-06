# User Flow

## 1. Landing Page
The user lands on the homepage, which explains the purpose of the platform and presents a call to action such as "Continue with Google".

## 2. Registration / Login
The student signs up using their Google account. This creates a secure identity tied to their account and reduces friction for first-time users.

## 3. Dashboard Access
Once authenticated, the student is redirected to the dashboard where they can see complaint actions and previous reports.

## 4. Complaint Submission
The student fills out a complaint form with:
- title
- category
- hostel/location
- description
- severity
- image attachment

## 5. Data Storage
The complaint is saved to Supabase, including text details and image data or image URL.

## 6. Tracking and Follow-up
The student can revisit their dashboard to check status, find relevant updates, and review the complaint history.

## 7. Admin Action
An administrator or manager can review complaints, assign tasks, and update the resolution status.

## 8. Resolution
Once a complaint is fixed, the issue status is updated so the student can see that action has been taken.
