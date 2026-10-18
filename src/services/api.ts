import {
  UserProfile,
  HealthMeasurement,
  SymptomAssessment,
  MedicalReport,
  DietPreferences,
  Meal,
  NutritionLog,
  WaterLog,
  FitnessPreferences,
  Workout,
  WorkoutLog,
  WellnessGoal,
  UserConsent,
} from "../types";

const TOKEN_KEY = "healthmate_session_token";

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    sendOtp: (email: string) =>
      request<{ success: boolean; message: string; debugCode?: string }>("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    verifyOtp: (email: string, code: string, fullName?: string) =>
      request<{ token: string; user: UserProfile; message: string }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code, fullName }),
      }),

    demoLogin: () =>
      request<{ token: string; user: UserProfile; message: string }>("/api/auth/demo-login", {
        method: "POST",
      }),

    getMe: () => request<{ user: UserProfile }>("/api/auth/me"),

    logout: () =>
      request<{ success: boolean; message: string }>("/api/auth/logout", {
        method: "POST",
      }),

    updateProfile: (data: Partial<UserProfile>) =>
      request<{ user: UserProfile; message: string }>("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    exportData: async () => {
      const token = getToken();
      const res = await fetch("/api/auth/export-data", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to export data");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `healthmate_backup_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },

    deleteAccount: () =>
      request<{ success: boolean; message: string }>("/api/auth/delete-account", {
        method: "DELETE",
      }),
  },

  health: {
    getMeasurements: () =>
      request<{ measurements: HealthMeasurement[] }>("/api/health/measurements"),

    addMeasurement: (data: {
      weightKg: number;
      heightCm: number;
      systolicBp?: number;
      diastolicBp?: number;
      restingHeartRate?: number;
      sleepHours?: number;
      dailySteps?: number;
      waterMl?: number;
      notes?: string;
    }) =>
      request<{ measurement: HealthMeasurement; message: string }>("/api/health/measurements", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    deleteMeasurement: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/health/measurements/${id}`, {
        method: "DELETE",
      }),
  },

  symptoms: {
    getAssessments: () =>
      request<{ assessments: SymptomAssessment[] }>("/api/symptoms"),

    assess: (data: {
      primarySymptom: string;
      details?: string;
      duration?: string;
      severity: number;
      ageGroup?: string;
    }) =>
      request<{
        urgencyLevel: 'Emergency' | 'Urgent Care' | 'Routine Care' | 'Self-Care';
        emergencyWarning: boolean;
        summary: string;
        potentialCauses: string[];
        questionsForDoctor: string[];
        selfCareTips: string[];
        disclaimer: string;
      }>("/api/symptoms/assess", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    saveAssessment: (data: any) =>
      request<{ assessment: SymptomAssessment; message: string }>("/api/symptoms/save", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    deleteAssessment: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/symptoms/delete/${id}`, {
        method: "DELETE",
      }),
  },

  diet: {
    getPreferences: () =>
      request<{ preferences: DietPreferences }>("/api/diet/preferences"),

    updatePreferences: (data: Partial<DietPreferences>) =>
      request<{ preferences: DietPreferences; message: string }>("/api/diet/preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    generatePlan: (data: {
      dietaryPattern: string;
      allergies: string[];
      calorieTarget: number;
      goal: string;
    }) =>
      request<{
        meals: Meal[];
        dailyTotalCalories: number;
        dailyTotalProtein: number;
        dailyTotalCarbs: number;
        dailyTotalFat: number;
        nutritionAdvice: string;
      }>("/api/diet/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getMeals: () => request<{ meals: Meal[] }>("/api/diet/meals"),

    addMeal: (meal: Partial<Meal>) =>
      request<{ meal: Meal; message: string }>("/api/diet/meals", {
        method: "POST",
        body: JSON.stringify(meal),
      }),

    deleteMeal: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/diet/meals/${id}`, {
        method: "DELETE",
      }),

    getLogs: (date?: string) =>
      request<{ logs: NutritionLog[] }>(`/api/diet/logs${date ? `?date=${date}` : ""}`),

    addLog: (log: Partial<NutritionLog>) =>
      request<{ log: NutritionLog; message: string }>("/api/diet/logs", {
        method: "POST",
        body: JSON.stringify(log),
      }),

    deleteLog: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/diet/logs/${id}`, {
        method: "DELETE",
      }),

    getWater: (date?: string) =>
      request<{ logs: WaterLog[] }>(`/api/diet/water${date ? `?date=${date}` : ""}`),

    addWater: (amountMl: number, loggedDate?: string) =>
      request<{ log: WaterLog; message: string }>("/api/diet/water", {
        method: "POST",
        body: JSON.stringify({ amountMl, loggedDate }),
      }),
  },

  fitness: {
    getPreferences: () =>
      request<{ preferences: FitnessPreferences }>("/api/fitness/preferences"),

    updatePreferences: (data: Partial<FitnessPreferences>) =>
      request<{ preferences: FitnessPreferences; message: string }>("/api/fitness/preferences", {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    generatePlan: (data: {
      level: string;
      goal: string;
      equipment: string[];
      targetMinutes: number;
      limitations?: string;
    }) =>
      request<{
        title: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        targetMuscleGroups: string[];
        estimatedDurationMin: number;
        exercises: any[];
        warmupTips: string;
        cooldownTips: string;
      }>("/api/fitness/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getWorkouts: () => request<{ workouts: Workout[] }>("/api/fitness/workouts"),

    addWorkout: (workout: Partial<Workout>) =>
      request<{ workout: Workout; message: string }>("/api/fitness/workouts", {
        method: "POST",
        body: JSON.stringify(workout),
      }),

    deleteWorkout: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/fitness/workouts/${id}`, {
        method: "DELETE",
      }),

    getLogs: () => request<{ logs: WorkoutLog[] }>("/api/fitness/logs"),

    addLog: (log: Partial<WorkoutLog>) =>
      request<{ log: WorkoutLog; message: string }>("/api/fitness/logs", {
        method: "POST",
        body: JSON.stringify(log),
      }),
  },

  reports: {
    getReports: () => request<{ reports: MedicalReport[] }>("/api/reports"),

    analyzeReport: (data: { base64Data?: string; mimeType?: string; extractedText?: string }) =>
      request<{
        reportTitle: string;
        laboratoryName: string;
        reportDate: string;
        overallSummary: string;
        doctorQuestions: string[];
        results: any[];
      }>("/api/reports/analyze", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    saveReport: (report: any) =>
      request<{ report: MedicalReport; message: string }>("/api/reports/save", {
        method: "POST",
        body: JSON.stringify(report),
      }),

    deleteReport: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/reports/${id}`, {
        method: "DELETE",
      }),
  },

  goals: {
    getGoals: () => request<{ goals: WellnessGoal[] }>("/api/goals"),

    addGoal: (goal: Partial<WellnessGoal>) =>
      request<{ goal: WellnessGoal; message: string }>("/api/goals", {
        method: "POST",
        body: JSON.stringify(goal),
      }),

    updateGoal: (id: string, updates: Partial<WellnessGoal>) =>
      request<{ goal: WellnessGoal; message: string }>(`/api/goals/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      }),

    deleteGoal: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/goals/${id}`, {
        method: "DELETE",
      }),
  },

  ai: {
    chat: (messages: { role: string; content: string }[]) =>
      request<{ reply: string }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({ messages }),
      }),
  },

  privacy: {
    getConsent: () => request<{ consent: UserConsent }>("/api/privacy/consent"),

    updateConsent: (data: Partial<UserConsent>) =>
      request<{ consent: UserConsent; message: string }>("/api/privacy/consent", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};
