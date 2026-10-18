export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferredUnit: 'metric' | 'imperial';
  heightCm?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HealthMeasurement {
  id: string;
  userId: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: string;
  systolicBp?: number;
  diastolicBp?: number;
  restingHeartRate?: number;
  sleepHours?: number;
  dailySteps?: number;
  waterMl?: number;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

export interface SymptomAssessment {
  id: string;
  userId: string;
  primarySymptom: string;
  symptomDetails: string;
  duration: string;
  severity: number;
  urgencyLevel: 'Emergency' | 'Urgent Care' | 'Routine Care' | 'Self-Care';
  aiSummary: string;
  aiPotentialCauses: string[];
  aiQuestionsForDoctor: string[];
  aiSelfCareTips: string[];
  emergencyWarningShown: boolean;
  disclaimerAcknowledged: boolean;
  createdAt: string;
}

export interface MedicalReportResult {
  id?: string;
  reportId?: string;
  userId?: string;
  testName: string;
  measuredValue: string;
  numericValue?: number | null;
  unit: string;
  referenceRange: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical' | 'Uncertain';
  clinicalNote: string;
  requiresManualVerification?: boolean;
}

export interface MedicalReport {
  id: string;
  userId: string;
  reportTitle: string;
  reportType: 'Laboratory' | 'Radiology' | 'Prescription' | 'General';
  reportDate: string;
  laboratoryName: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  overallSummary: string;
  doctorQuestions: string[];
  results: MedicalReportResult[];
  createdAt: string;
  updatedAt: string;
}

export interface DietPreferences {
  id?: string;
  userId: string;
  dietaryPattern: string;
  allergies: string[];
  dislikedFoods: string[];
  dailyCalorieTarget: number;
  dailyWaterTargetMl: number;
  dailyProteinTargetG: number;
  dailyCarbsTargetG: number;
  dailyFatTargetG: number;
  updatedAt?: string;
}

export interface Meal {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  estimatedCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isFavorite: boolean;
  createdAt?: string;
}

export interface NutritionLog {
  id: string;
  userId: string;
  loggedDate: string;
  mealType: string;
  foodName: string;
  servingSize?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  loggedDate: string;
  amountMl: number;
  loggedAt: string;
}

export interface FitnessPreferences {
  id?: string;
  userId: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal: 'weight_loss' | 'muscle_gain' | 'endurance' | 'mobility' | 'general_fitness';
  availableEquipment: string[];
  weeklyFrequencyDays: number;
  physicalLimitations?: string;
  updatedAt?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps?: string;
  durationSec?: number;
  restSec: number;
  instructions: string;
  modification?: string;
}

export interface Workout {
  id: string;
  userId: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetMuscleGroups: string[];
  estimatedDurationMin: number;
  exercises: Exercise[];
  warmupTips?: string;
  cooldownTips?: string;
  isSaved: boolean;
  createdAt?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  workoutId?: string;
  workoutTitle: string;
  durationMin: number;
  caloriesBurned?: number;
  perceivedExertion?: number;
  notes?: string;
  completedAt: string;
}

export interface WellnessGoal {
  id: string;
  userId: string;
  category: 'weight' | 'water' | 'activity' | 'sleep' | 'nutrition';
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate?: string;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserConsent {
  id?: string;
  userId: string;
  aiProcessingConsented: boolean;
  reportOcrConsented: boolean;
  analyticsConsented: boolean;
  consentedAt?: string;
  updatedAt?: string;
}
