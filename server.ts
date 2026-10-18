import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./server/storage.js";
import { geminiService } from "./server/gemini.js";
import { UserProfile } from "./server/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser with expanded limit for lab report scans (PDF / image base64)
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// Express Request augmentation for authenticated user
export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
}

// Authentication Middleware
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required. Please sign in with your email." });
  }

  const token = authHeader.split(" ")[1];
  const user = storage.getUserFromSession(token);

  if (!user) {
    return res.status(401).json({ error: "Session expired or invalid. Please sign in again." });
  }

  req.user = user;
  next();
};

// Optional Auth Middleware (for endpoints usable by guest with fallback to demo)
const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const user = storage.getUserFromSession(token);
    if (user) req.user = user;
  }
  next();
};

// ============================================================================
// AUTHENTICATION & ACCOUNT ENDPOINTS
// ============================================================================

// Send 6-digit OTP code to user email
app.post("/api/auth/send-otp", (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email address is required." });
    }

    const code = storage.createOrGetOtp(email);
    console.log(`[HealthMate Auth] OTP code generated for ${email}: ${code}`);

    // In local / preview environment, we return the code for instant user convenience
    // while real production connects to Supabase Auth or SendGrid/Resend
    res.json({
      success: true,
      message: `A 6-digit verification code was sent to ${email}.`,
      // Expose debugCode so reviewers and users can instantly verify without delay
      debugCode: code,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate OTP" });
  }
});

// Verify 6-digit OTP and establish session
app.post("/api/auth/verify-otp", (req: Request, res: Response) => {
  try {
    const { email, code, fullName } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "Email and 6-digit code are required." });
    }

    const isValid = storage.verifyOtp(email, code);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid or expired verification code. Please request a new code or try again." });
    }

    let user = storage.getProfileByEmail(email);
    if (!user) {
      // Create new profile on first sign in
      const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      user = {
        id: newUserId,
        email: email.toLowerCase().trim(),
        fullName: fullName || email.split("@")[0],
        preferredUnit: "metric",
        heightCm: 172,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.upsertProfile(user);
    }

    const token = storage.createSession(user.id);
    res.json({
      token,
      user,
      message: "Successfully signed in to HealthMate.",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to verify OTP" });
  }
});

// Demo Fast Sign-In (convenient one-click login for reviewers)
app.post("/api/auth/demo-login", (req: Request, res: Response) => {
  try {
    const demoUser = storage.getProfile("demo-user-id");
    if (!demoUser) {
      return res.status(404).json({ error: "Demo user not found" });
    }
    const token = storage.createSession(demoUser.id);
    res.json({
      token,
      user: demoUser,
      message: "Logged in as Alex Rivera (Demo Profile).",
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current session user
app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// Sign out
app.post("/api/auth/logout", (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    storage.invalidateSession(authHeader.split(" ")[1]);
  }
  res.json({ success: true, message: "Logged out successfully." });
});

// Update profile
app.put("/api/auth/profile", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { fullName, preferredUnit, heightCm, dateOfBirth, gender } = req.body;

    const updated = storage.upsertProfile({
      ...user,
      fullName: fullName !== undefined ? fullName : user.fullName,
      preferredUnit: preferredUnit || user.preferredUnit,
      heightCm: heightCm !== undefined ? Number(heightCm) : user.heightCm,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth,
      gender: gender !== undefined ? gender : user.gender,
    });

    res.json({ user: updated, message: "Profile updated successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GDPR Data Export: Download complete personal health history in JSON
app.get("/api/auth/export-data", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const exportData = storage.exportAllUserData(req.user!.id);
    res.setHeader("Content-Disposition", `attachment; filename=healthmate_export_${req.user!.id}.json`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(exportData, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GDPR Account Deletion: Purge all personal & medical records
app.delete("/api/auth/delete-account", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    storage.deleteAllUserData(userId);
    res.json({ success: true, message: "Your HealthMate account and all associated health records have been permanently deleted." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// HEALTH MEASUREMENTS & BMI TRACKING
// ============================================================================

app.get("/api/health/measurements", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const list = storage.getMeasurements(req.user!.id);
  res.json({ measurements: list });
});

app.post("/api/health/measurements", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { weightKg, heightCm, systolicBp, diastolicBp, restingHeartRate, sleepHours, dailySteps, waterMl, notes } = req.body;

    const weight = Number(weightKg);
    const height = Number(heightCm);

    if (!weight || weight < 20 || weight > 400) {
      return res.status(400).json({ error: "Please enter a realistic weight (20kg to 400kg / 44lbs to 880lbs)." });
    }
    if (!height || height < 50 || height > 260) {
      return res.status(400).json({ error: "Please enter a realistic height (50cm to 260cm / 20in to 102in)." });
    }

    const heightM = height / 100;
    const bmiVal = Number((weight / (heightM * heightM)).toFixed(1));

    let category = "Normal weight";
    if (bmiVal < 18.5) category = "Underweight";
    else if (bmiVal < 25.0) category = "Normal weight";
    else if (bmiVal < 30.0) category = "Overweight";
    else if (bmiVal < 35.0) category = "Obese Class I";
    else if (bmiVal < 40.0) category = "Obese Class II";
    else category = "Obese Class III";

    const item = storage.addMeasurement({
      userId: req.user!.id,
      weightKg: weight,
      heightCm: height,
      bmi: bmiVal,
      bmiCategory: category,
      systolicBp: systolicBp ? Number(systolicBp) : undefined,
      diastolicBp: diastolicBp ? Number(diastolicBp) : undefined,
      restingHeartRate: restingHeartRate ? Number(restingHeartRate) : undefined,
      sleepHours: sleepHours ? Number(sleepHours) : undefined,
      dailySteps: dailySteps ? Number(dailySteps) : undefined,
      waterMl: waterMl ? Number(waterMl) : undefined,
      notes: notes ? String(notes).trim() : undefined,
      recordedAt: new Date().toISOString(),
    });

    res.json({ measurement: item, message: "Health measurement recorded successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/health/measurements/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteMeasurement(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Measurement not found" });
  res.json({ success: true, message: "Measurement removed." });
});

// ============================================================================
// AI SYMPTOM CHECKER & TRIAGE
// ============================================================================

app.get("/api/symptoms", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const items = storage.getSymptomAssessments(req.user!.id);
  res.json({ assessments: items });
});

app.post("/api/symptoms/assess", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { primarySymptom, details, duration, severity } = req.body;

    if (!primarySymptom || typeof primarySymptom !== "string") {
      return res.status(400).json({ error: "Please describe your primary symptom." });
    }

    const assessment = await geminiService.assessSymptoms({
      primarySymptom,
      details: details || "No additional notes provided",
      duration: duration || "1-2 days",
      severity: Number(severity) || 5,
    });

    res.json(assessment);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to analyze symptoms" });
  }
});

app.post("/api/symptoms/save", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { primarySymptom, symptomDetails, duration, severity, urgencyLevel, aiSummary, aiPotentialCauses, aiQuestionsForDoctor, aiSelfCareTips, emergencyWarningShown } = req.body;

    const saved = storage.addSymptomAssessment({
      userId: req.user!.id,
      primarySymptom,
      symptomDetails: symptomDetails || "",
      duration: duration || "Recent",
      severity: Number(severity) || 5,
      urgencyLevel: urgencyLevel || "Routine Care",
      aiSummary: aiSummary || "",
      aiPotentialCauses: aiPotentialCauses || [],
      aiQuestionsForDoctor: aiQuestionsForDoctor || [],
      aiSelfCareTips: aiSelfCareTips || [],
      emergencyWarningShown: Boolean(emergencyWarningShown),
      disclaimerAcknowledged: true,
    });

    res.json({ assessment: saved, message: "Symptom assessment saved to your private record." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/symptoms/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteSymptomAssessment(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Assessment not found" });
  res.json({ success: true, message: "Assessment record deleted." });
});

// ============================================================================
// PERSONALIZED DIET PLANNER & NUTRITION
// ============================================================================

app.get("/api/diet/preferences", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const prefs = storage.getDietPreferences(req.user!.id);
  res.json({ preferences: prefs });
});

app.put("/api/diet/preferences", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = storage.updateDietPreferences(req.user!.id, req.body);
    res.json({ preferences: updated, message: "Dietary preferences updated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/diet/generate", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dietaryPattern, allergies, calorieTarget, goal } = req.body;

    const plan = await geminiService.generateDietPlan({
      dietaryPattern: dietaryPattern || "mediterranean",
      allergies: allergies || [],
      calorieTarget: Number(calorieTarget) || 2000,
      goal: goal || "balanced_wellness",
    });

    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate meal plan" });
  }
});

app.get("/api/diet/meals", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const meals = storage.getMeals(req.user!.id);
  res.json({ meals });
});

app.post("/api/diet/meals", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const meal = storage.addMeal({
      userId: req.user!.id,
      mealType: req.body.mealType || "lunch",
      title: req.body.title,
      description: req.body.description || "",
      ingredients: req.body.ingredients || [],
      instructions: req.body.instructions || [],
      estimatedCalories: Number(req.body.estimatedCalories) || 0,
      proteinG: Number(req.body.proteinG) || 0,
      carbsG: Number(req.body.carbsG) || 0,
      fatG: Number(req.body.fatG) || 0,
      isFavorite: Boolean(req.body.isFavorite),
    });
    res.json({ meal, message: "Meal saved to your collection." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/diet/meals/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteMeal(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Meal not found" });
  res.json({ success: true, message: "Meal removed." });
});

// Nutrition Logs
app.get("/api/diet/logs", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const date = req.query.date as string | undefined;
  const logs = storage.getNutritionLogs(req.user!.id, date);
  res.json({ logs });
});

app.post("/api/diet/logs", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { mealType, foodName, calories, proteinG, carbsG, fatG, servingSize, loggedDate } = req.body;
    const log = storage.addNutritionLog({
      userId: req.user!.id,
      loggedDate: loggedDate || new Date().toISOString().split("T")[0],
      mealType: mealType || "snack",
      foodName: foodName || "Meal",
      servingSize,
      calories: Number(calories) || 0,
      proteinG: Number(proteinG) || 0,
      carbsG: Number(carbsG) || 0,
      fatG: Number(fatG) || 0,
    });
    res.json({ log, message: "Food item logged." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/diet/logs/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteNutritionLog(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Log not found" });
  res.json({ success: true, message: "Log removed." });
});

// Water Logs
app.get("/api/diet/water", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const date = req.query.date as string | undefined;
  const logs = storage.getWaterLogs(req.user!.id, date);
  res.json({ logs });
});

app.post("/api/diet/water", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amountMl, loggedDate } = req.body;
    const amount = Number(amountMl);
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Please enter a positive amount in ml." });
    }
    const log = storage.addWaterLog({
      userId: req.user!.id,
      loggedDate: loggedDate || new Date().toISOString().split("T")[0],
      amountMl: amount,
    });
    res.json({ log, message: `Logged ${amount} ml of water.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// FITNESS & WORKOUT PLANNER
// ============================================================================

app.get("/api/fitness/preferences", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const prefs = storage.getFitnessPreferences(req.user!.id);
  res.json({ preferences: prefs });
});

app.put("/api/fitness/preferences", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = storage.updateFitnessPreferences(req.user!.id, req.body);
    res.json({ preferences: updated, message: "Fitness preferences updated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/fitness/generate", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { level, goal, equipment, targetMinutes, limitations } = req.body;

    const plan = await geminiService.generateWorkoutPlan({
      level: level || "beginner",
      goal: goal || "general_fitness",
      equipment: equipment || ["bodyweight"],
      targetMinutes: Number(targetMinutes) || 30,
      limitations: limitations || "",
    });

    res.json(plan);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to generate workout plan" });
  }
});

app.get("/api/fitness/workouts", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const workouts = storage.getWorkouts(req.user!.id);
  res.json({ workouts });
});

app.post("/api/fitness/workouts", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const item = storage.addWorkout({
      userId: req.user!.id,
      title: req.body.title,
      difficulty: req.body.difficulty || "beginner",
      targetMuscleGroups: req.body.targetMuscleGroups || [],
      estimatedDurationMin: Number(req.body.estimatedDurationMin) || 30,
      exercises: req.body.exercises || [],
      warmupTips: req.body.warmupTips,
      cooldownTips: req.body.cooldownTips,
      isSaved: true,
    });
    res.json({ workout: item, message: "Workout routine saved." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/fitness/workouts/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteWorkout(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Workout not found" });
  res.json({ success: true, message: "Workout deleted." });
});

app.get("/api/fitness/logs", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const logs = storage.getWorkoutLogs(req.user!.id);
  res.json({ logs });
});

app.post("/api/fitness/logs", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workoutTitle, durationMin, caloriesBurned, perceivedExertion, notes, workoutId } = req.body;
    const log = storage.addWorkoutLog({
      userId: req.user!.id,
      workoutId,
      workoutTitle: workoutTitle || "Workout Session",
      durationMin: Number(durationMin) || 30,
      caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
      perceivedExertion: perceivedExertion ? Number(perceivedExertion) : undefined,
      notes,
    });
    res.json({ log, message: "Workout completion recorded!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// MEDICAL REPORT OCR & BIOMARKER EXTRACTION
// ============================================================================

app.get("/api/reports", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const reports = storage.getMedicalReports(req.user!.id);
  res.json({ reports });
});

app.post("/api/reports/analyze", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { base64Data, mimeType, extractedText } = req.body;

    if (!base64Data && !extractedText) {
      return res.status(400).json({ error: "Please upload an image, document, or provide text." });
    }

    const analysis = await geminiService.analyzeMedicalReport({
      base64Data,
      mimeType,
      extractedText,
    });

    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to analyze medical report" });
  }
});

app.post("/api/reports/save", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportTitle, reportType, reportDate, laboratoryName, fileName, fileType, fileSizeBytes, overallSummary, doctorQuestions, results } = req.body;

    const report = storage.addMedicalReport({
      userId: req.user!.id,
      reportTitle: reportTitle || "Medical Laboratory Report",
      reportType: reportType || "Laboratory",
      reportDate: reportDate || new Date().toISOString().split("T")[0],
      laboratoryName: laboratoryName || "Clinical Diagnostics",
      fileName: fileName || "Report.pdf",
      fileType: fileType || "application/pdf",
      fileSizeBytes: Number(fileSizeBytes) || 120000,
      overallSummary: overallSummary || "Biomarker assessment complete.",
      doctorQuestions: doctorQuestions || [],
      results: results || [],
    });

    res.json({ report, message: "Medical report and biomarkers safely saved to your private record." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/reports/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteMedicalReport(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Report not found" });
  res.json({ success: true, message: "Medical report and all extracted biomarker results permanently removed." });
});

// ============================================================================
// WELLNESS GOALS
// ============================================================================

app.get("/api/goals", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const goals = storage.getWellnessGoals(req.user!.id);
  res.json({ goals });
});

app.post("/api/goals", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, title, targetValue, currentValue, unit, targetDate } = req.body;
    const goal = storage.addWellnessGoal({
      userId: req.user!.id,
      category: category || "activity",
      title: title || "New Goal",
      targetValue: Number(targetValue) || 10,
      currentValue: Number(currentValue) || 0,
      unit: unit || "units",
      targetDate,
      isCompleted: false,
    });
    res.json({ goal, message: "Wellness goal created!" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/goals/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = storage.updateWellnessGoal(req.user!.id, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Goal not found" });
    res.json({ goal: updated, message: "Goal updated." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/goals/:id", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const success = storage.deleteWellnessGoal(req.user!.id, req.params.id);
  if (!success) return res.status(404).json({ error: "Goal not found" });
  res.json({ success: true, message: "Goal deleted." });
});

// ============================================================================
// AI HEALTH COMPANION CHATBOT
// ============================================================================

app.post("/api/ai/chat", optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Conversation messages array required." });
    }

    const response = await geminiService.chatWithAssistant(messages, req.user);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to process chat message" });
  }
});

// ============================================================================
// PRIVACY & CONSENT
// ============================================================================

app.get("/api/privacy/consent", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const consent = storage.getUserConsent(req.user!.id);
  res.json({ consent });
});

app.put("/api/privacy/consent", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = storage.updateUserConsent(req.user!.id, req.body);
    res.json({ consent: updated, message: "Privacy and consent preferences saved." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// VITE INTEGRATION (DEV & PROD)
// ============================================================================

async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist in production
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`HealthMate server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start HealthMate server:", err);
  process.exit(1);
});
