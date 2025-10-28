export type TrainingExperience = 'novice' | 'intermediate' | 'advanced';
export type Goal = 'hypertrophy' | 'strength' | 'fat_loss' | 'endurance' | 'power' | 'general_health' | 'rehab';
export type Strictness = 'conservative' | 'balanced' | 'aggressive';
export type RecommendedAction = 'proceed' | 'proceed_with_cues' | 'regress_and_retest' | 'stop_and_seek_physio';
export type ErrorSeverity = 'minor' | 'moderate' | 'major';
export type PrimaryCause = 'setup' | 'mobility' | 'strength' | 'coordination' | 'equipment_misuse' | 'camera_issue';

export interface UserProfile {
  id: string;
  age: number;
  sex: string;
  height_cm?: number;
  weight_kg?: number;
  training_experience: TrainingExperience;
  injuries_or_limitations?: string;
  sleep_hours?: number;
  dietary_notes?: string;
  resting_heart_rate?: number;
  timezone?: string;
}

export interface UserInput {
  user_id?: string;
  age: number;
  sex: string;
  height_cm?: number;
  weight_kg?: number;
  training_experience: TrainingExperience;
  days_per_week: number;
  minutes_per_session: number;
  goal: Goal;
  primary_equipment: string[];
  injuries_or_limitations?: string;
  sleep_hours?: number;
  dietary_notes?: string;
  preferences?: string;
  starting_1RM_estimates?: Record<string, number>;
  resting_heart_rate?: number;
  timezone?: string;
  strictness: Strictness;
  goal_deadline?: string;
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment: string[];
  cues: string[];
  regressions: ExerciseVariation[];
  progressions: ExerciseVariation[];
  duration_min_estimate: number;
  video_url?: string;
}

export interface ExerciseVariation {
  name: string;
  reason: string;
}

export interface SessionBlock {
  type: 'warmup' | 'main' | 'accessory' | 'conditioning' | 'cooldown';
  exercises: SessionExercise[];
}

export interface SessionExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  intensity: string;
  rest_seconds: number;
  notes?: string;
}

export interface WeeklySession {
  day_index: number;
  duration_min: number;
  title: string;
  focus: string;
  session_blocks: SessionBlock[];
}

export interface ProgressionRule {
  method: string;
  load_increase_percent: number;
  autoregulation_rules: string[];
  deload_cadence_weeks: number;
}

export interface SafetyMods {
  injury_substitutions: Record<string, string[]>;
  warmup_protocols: string[];
  red_flags: string[];
}

export interface NutritionBrief {
  calorie_direction?: string;
  protein_g_per_kg_range: [number, number];
  notes?: string;
}

export interface Milestone {
  description: string;
  timeline_weeks: number;
}

export interface FitnessPlan {
  user_id: string;
  created_at: string;
  plan_version: number;
  training_focus: string;
  confidence: number;
  weekly_structure: WeeklySession[];
  exercise_library: Exercise[];
  progression_rules: ProgressionRule;
  safety_and_mods: SafetyMods;
  nutrition_brief: NutritionBrief;
  tracking_recommendations: string[];
  sample_week: {
    week_index: number;
    sessions: WeeklySession[];
  };
  estimated_milestones: Milestone[];
  form_analysis_summary?: FormAnalysis;
}

export interface VideoInput {
  video_id: string;
  exercise_id: string;
  camera_angle: string;
  frame_rate?: number;
  resolution?: string;
  recording_conditions?: {
    lighting?: boolean;
    background?: boolean;
    equipment_visible?: boolean;
  };
  anthropometrics?: Record<string, number>;
  equipment_setup?: Record<string, any>;
  consent_confirmed: boolean;
}

export interface Landmark {
  landmark: string;
  frame: number;
  x: number;
  y: number;
  confidence?: number;
}

export interface FormError {
  id: string;
  description: string;
  severity: ErrorSeverity;
  frames: [number, number];
  confidence: number;
  coaching_cue: string;
  primary_cause: PrimaryCause;
}

export interface ROMMetric {
  metric_name: string;
  measured_deg: number;
  expected_range: [number, number];
  deviation_percent?: number;
}

export interface SymmetryMetric {
  metric_name: string;
  left_value: number;
  right_value: number;
  asymmetry_percent: number;
}

export interface TimestampedCue {
  time_s: string;
  cue: string;
}

export interface FormAnalysis {
  form_analysis_summary: string;
  overall_confidence: number;
  key_landmarks_detected?: Landmark[];
  errors: FormError[];
  range_of_motion_metrics?: ROMMetric[];
  symmetry_metrics?: SymmetryMetric[];
  recommended_action: RecommendedAction;
  exercise_substitutions: {
    regressions: ExerciseVariation[];
    progressions: ExerciseVariation[];
  };
  visual_overlay_instructions: string[];
  video_quality_flags: string[];
  timestamped_coaching_queue: TimestampedCue[];
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id?: string;
  session_date: string;
  duration_min: number;
  rpe?: number;
  soreness?: number;
  pain_notes?: string;
  exercises_completed: any[];
  bodyweight_kg?: number;
  notes?: string;
}
