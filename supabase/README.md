# HealthMate Supabase & Deployment Documentation

This document provides step-by-step instructions to configure Supabase Auth, PostgreSQL with Row Level Security (RLS), private Supabase Storage, and deployment for HealthMate.

---

## 1. Supabase Project Setup

1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Name your project (e.g. `healthmate-prod`), select a secure database password, and pick the region closest to your users.
3. Once initialized, navigate to **Project Settings > API**:
   - Copy the **Project URL** (`https://<project-id>.supabase.co`) -> `SUPABASE_URL`
   - Copy the **anon public** key -> `SUPABASE_ANON_KEY`
   - Copy the **service_role secret** key (keep this secret!) -> `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Apply Database Migrations & RLS Policies

1. Open your project dashboard in Supabase and select **SQL Editor** from the left navigation.
2. Click **New Query**.
3. Open `supabase/migrations/20250101000000_healthmate_schema.sql` and paste the entire script into the query editor.
4. Click **Run**.
5. This creates all 14 core tables:
   - `profiles`: User information, height, unit preferences.
   - `health_measurements`: BMI, weight, blood pressure, heart rate, sleep, steps, water.
   - `symptom_assessments`: Natural language symptoms, severity, urgency triage, AI doctor questions.
   - `medical_reports`: Metadata for lab and radiology reports.
   - `medical_report_results`: Individual extracted biomarker rows (test name, value, unit, reference range, out-of-range flag).
   - `diet_preferences`: Calories, allergies, food preferences, macros.
   - `meals`: Custom recipe and meal ideas with instructions.
   - `nutrition_logs`: Daily food consumption tracking.
   - `water_logs`: Daily hydration log.
   - `fitness_preferences`: Experience level, equipment, limitations, target frequency.
   - `workouts`: Structured exercise routines with set/rep/rest breakdowns.
   - `workout_logs`: Completed sessions and perceived exertion.
   - `wellness_goals`: Target progress tracking.
   - `user_consents`: GDPR/HIPAA-aligned user consent records.
6. Verify that **Row Level Security (RLS)** is enabled on all tables under **Authentication > Policies**. Every query is scoped to `auth.uid() = user_id`.

---

## 3. Email-Based Sign-In with One-Time Password (OTP)

HealthMate uses passwordless 6-digit Email OTP:

1. In the Supabase Dashboard, navigate to **Authentication > Providers > Email**.
2. Ensure **Email** is **Enabled**.
3. Under **Confirm email**, ensure it is toggled on.
4. Navigate to **Authentication > Email Templates**:
   - Select **Magic Link / OTP** or **Confirmation**.
   - Set the email subject to: `Your HealthMate Verification Code`.
   - In the email body, provide the 6-digit token variable:
     ```html
     <h2>HealthMate Secure Login</h2>
     <p>Your one-time verification code is:</p>
     <h1 style="font-size: 32px; letter-spacing: 6px; color: #0d9488; font-family: monospace;">{{ .Token }}</h1>
     <p>This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
     ```
5. Save changes.

---

## 4. Private Storage for Medical Reports

1. The SQL migration creates a private storage bucket named `medical-reports` (15MB file size limit, restricted to PDF, PNG, JPG).
2. To verify in the Supabase Dashboard:
   - Navigate to **Storage > Buckets**.
   - Check that `medical-reports` is marked **Private** (Public bucket = OFF).
   - Check the **Policies** tab: policies ensure users can only upload/read/delete files in paths prefixed with their own user ID (`${userId}/${fileId}.${ext}`).

---

## 5. Gemini AI Configuration

1. HealthMate uses Google GenAI with the `gemini-3.8-flash` model for:
   - Guided Symptom Checker with emergency warning detection
   - Multimodal OCR & Lab Biomarker Extraction from PDF and image files
   - Personalized Diet & Meal Planning
   - Customized Fitness & Workout Planning
   - Interactive Health Assistant
2. On Google AI Studio / Cloud Run, the `GEMINI_API_KEY` is automatically injected via the system environment.
3. For local or self-hosted deployment, set `GEMINI_API_KEY="your-key-here"` in your `.env`.

---

## 6. Running Locally & Testing

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the fullstack development server (Node Express + Vite):
   ```bash
   npm run dev
   ```
   Server will start on port `3000`.
3. Build for production:
   ```bash
   npm run build
   ```
4. Run production server:
   ```bash
   npm start
   ```

---

## 7. Security & HIPAA/GDPR Compliance Guidelines

- **Zero Client Keys**: Neither the Supabase `service_role` key nor the `GEMINI_API_KEY` are ever exposed to the client. All AI and storage mutations flow through authenticated server endpoints.
- **Data Export & Deletion**: Under **Profile & Settings > Privacy**, users can export all personal and medical records as structured JSON or delete their account and associated data immediately.
- **Clinical Disclaimer**: AI analysis does not constitute medical diagnosis or treatment. Emergency red flags trigger an immediate banner directing the user to local emergency medical services.
