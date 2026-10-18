-- HealthMate Production Database Schema & Row Level Security (RLS) Migrations
-- Target: Supabase / PostgreSQL 15+

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    date_of_birth DATE,
    gender TEXT, -- 'male', 'female', 'other', 'prefer_not_to_say'
    preferred_unit TEXT NOT NULL DEFAULT 'metric', -- 'metric' (kg/cm) or 'imperial' (lbs/in)
    height_cm NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Health & BMI Measurements Table
CREATE TABLE IF NOT EXISTS public.health_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2) NOT NULL,
    height_cm NUMERIC(5,2) NOT NULL,
    bmi NUMERIC(4,1) NOT NULL,
    bmi_category TEXT NOT NULL, -- 'Underweight', 'Normal weight', 'Overweight', 'Obese Class I', 'Obese Class II', 'Obese Class III'
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    resting_heart_rate INTEGER,
    sleep_hours NUMERIC(3,1),
    daily_steps INTEGER,
    water_ml INTEGER,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Symptom Assessments Table
CREATE TABLE IF NOT EXISTS public.symptom_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    primary_symptom TEXT NOT NULL,
    symptom_details TEXT NOT NULL,
    duration TEXT,
    severity INTEGER CHECK (severity >= 1 AND severity <= 10),
    urgency_level TEXT NOT NULL, -- 'Emergency', 'Urgent Care', 'Routine Care', 'Self-Care'
    ai_summary TEXT NOT NULL,
    ai_potential_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_questions_for_doctor JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_self_care_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
    emergency_warning_shown BOOLEAN NOT NULL DEFAULT false,
    disclaimer_acknowledged BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Medical Reports Table
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_title TEXT NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'Laboratory', -- 'Laboratory', 'Radiology', 'Prescription', 'General'
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    laboratory_name TEXT,
    file_path TEXT, -- storage path in private 'medical-reports' bucket
    file_name TEXT,
    file_type TEXT, -- 'application/pdf', 'image/png', 'image/jpeg'
    file_size_bytes BIGINT,
    overall_summary TEXT,
    doctor_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Medical Report Biomarker Results Table (Structured lab values)
CREATE TABLE IF NOT EXISTS public.medical_report_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    measured_value TEXT NOT NULL,
    numeric_value NUMERIC(10,3),
    unit TEXT,
    reference_range TEXT,
    flag TEXT NOT NULL DEFAULT 'Normal', -- 'Normal', 'High', 'Low', 'Critical', 'Uncertain'
    clinical_note TEXT,
    requires_manual_verification BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Dietary Preferences & Allergies Table
CREATE TABLE IF NOT EXISTS public.diet_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    dietary_pattern TEXT NOT NULL DEFAULT 'omnivorous', -- 'omnivorous', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'mediterranean', 'low-carb'
    allergies JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['nuts', 'dairy', 'gluten', 'shellfish', etc.]
    disliked_foods JSONB NOT NULL DEFAULT '[]'::jsonb,
    daily_calorie_target INTEGER DEFAULT 2000,
    daily_water_target_ml INTEGER DEFAULT 2500,
    daily_protein_target_g INTEGER DEFAULT 100,
    daily_carbs_target_g INTEGER DEFAULT 220,
    daily_fat_target_g INTEGER DEFAULT 65,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Meals and Recipes Table
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    title TEXT NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_calories INTEGER,
    protein_g NUMERIC(5,1),
    carbs_g NUMERIC(5,1),
    fat_g NUMERIC(5,1),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Daily Nutrition Logs
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT NOT NULL,
    food_name TEXT NOT NULL,
    serving_size TEXT,
    calories INTEGER NOT NULL DEFAULT 0,
    protein_g NUMERIC(5,1) DEFAULT 0,
    carbs_g NUMERIC(5,1) DEFAULT 0,
    fat_g NUMERIC(5,1) DEFAULT 0,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Water Logs
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ml INTEGER NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Fitness Preferences Table
CREATE TABLE IF NOT EXISTS public.fitness_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    experience_level TEXT NOT NULL DEFAULT 'beginner', -- 'beginner', 'intermediate', 'advanced'
    primary_goal TEXT NOT NULL DEFAULT 'general_fitness', -- 'weight_loss', 'muscle_gain', 'endurance', 'mobility', 'general_fitness'
    available_equipment JSONB NOT NULL DEFAULT '["bodyweight"]'::jsonb,
    weekly_frequency_days INTEGER NOT NULL DEFAULT 3,
    physical_limitations TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Workouts Table
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'beginner',
    target_muscle_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_duration_min INTEGER NOT NULL DEFAULT 30,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{name, sets, reps, duration_sec, rest_sec, instructions, modification}]
    warmup_tips TEXT,
    cooldown_tips TEXT,
    is_saved BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. Workout Logs (completion tracking)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
    workout_title TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    calories_burned INTEGER,
    perceived_exertion INTEGER CHECK (perceived_exertion >= 1 AND perceived_exertion <= 10),
    notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. Wellness Goals Table
CREATE TABLE IF NOT EXISTS public.wellness_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'weight', 'water', 'activity', 'sleep', 'nutrition'
    title TEXT NOT NULL,
    target_value NUMERIC(8,2) NOT NULL,
    current_value NUMERIC(8,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    target_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. User Consents & Privacy Settings
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    ai_processing_consented BOOLEAN NOT NULL DEFAULT true,
    report_ocr_consented BOOLEAN NOT NULL DEFAULT true,
    analytics_consented BOOLEAN NOT NULL DEFAULT false,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_health_measurements_user_date ON public.health_measurements(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_date ON public.symptom_assessments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_date ON public.medical_reports(user_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_medical_report_results_report ON public.medical_report_results(report_id);
CREATE INDEX IF NOT EXISTS idx_medical_report_results_user_test ON public.medical_report_results(user_id, test_name);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON public.water_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON public.workout_logs(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_goals_user ON public.wellness_goals(user_id, is_completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: Users can ONLY access their own rows!
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_report_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Health Measurements
CREATE POLICY "Users view own measurements" ON public.health_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own measurements" ON public.health_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own measurements" ON public.health_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own measurements" ON public.health_measurements FOR DELETE USING (auth.uid() = user_id);

-- 3. Symptom Assessments
CREATE POLICY "Users view own symptoms" ON public.symptom_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own symptoms" ON public.symptom_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own symptoms" ON public.symptom_assessments FOR DELETE USING (auth.uid() = user_id);

-- 4. Medical Reports
CREATE POLICY "Users view own reports" ON public.medical_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own reports" ON public.medical_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reports" ON public.medical_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own reports" ON public.medical_reports FOR DELETE USING (auth.uid() = user_id);

-- 5. Medical Report Results
CREATE POLICY "Users view own report results" ON public.medical_report_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own report results" ON public.medical_report_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own report results" ON public.medical_report_results FOR DELETE USING (auth.uid() = user_id);

-- 6. Diet Preferences
CREATE POLICY "Users view own diet prefs" ON public.diet_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diet prefs" ON public.diet_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diet prefs" ON public.diet_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own diet prefs" ON public.diet_preferences FOR DELETE USING (auth.uid() = user_id);

-- 7. Meals
CREATE POLICY "Users view own meals" ON public.meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own meals" ON public.meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own meals" ON public.meals FOR DELETE USING (auth.uid() = user_id);

-- 8. Nutrition Logs
CREATE POLICY "Users view own nutrition logs" ON public.nutrition_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own nutrition logs" ON public.nutrition_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own nutrition logs" ON public.nutrition_logs FOR DELETE USING (auth.uid() = user_id);

-- 9. Water Logs
CREATE POLICY "Users view own water logs" ON public.water_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own water logs" ON public.water_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own water logs" ON public.water_logs FOR DELETE USING (auth.uid() = user_id);

-- 10. Fitness Preferences
CREATE POLICY "Users view own fitness prefs" ON public.fitness_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own fitness prefs" ON public.fitness_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own fitness prefs" ON public.fitness_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own fitness prefs" ON public.fitness_preferences FOR DELETE USING (auth.uid() = user_id);

-- 11. Workouts
CREATE POLICY "Users view own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);

-- 12. Workout Logs
CREATE POLICY "Users view own workout logs" ON public.workout_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own workout logs" ON public.workout_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own workout logs" ON public.workout_logs FOR DELETE USING (auth.uid() = user_id);

-- 13. Wellness Goals
CREATE POLICY "Users view own goals" ON public.wellness_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own goals" ON public.wellness_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own goals" ON public.wellness_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own goals" ON public.wellness_goals FOR DELETE USING (auth.uid() = user_id);

-- 14. User Consents
CREATE POLICY "Users view own consent" ON public.user_consents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own consent" ON public.user_consents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own consent" ON public.user_consents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own consent" ON public.user_consents FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKET CONFIGURATION (Private Medical Reports)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-reports',
    'medical-reports',
    false, -- STRICTLY PRIVATE
    15728640, -- 15MB limit
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only upload, read, and delete their own files
-- Objects must be saved under the path pattern: `${userId}/${fileId}.${ext}`
CREATE POLICY "Users can upload their own medical reports"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own medical reports"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own medical reports"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'medical-reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
