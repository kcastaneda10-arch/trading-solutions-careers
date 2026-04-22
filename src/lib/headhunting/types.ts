// ─── Headhunting Module Types ─────────────────────────────────────

export interface HtClient {
  id: string;
  name: string;
  industry: string;
  contact_name: string;
  contact_email: string;
  sender_email: string;
  logo_url: string | null;
  primary_color: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CompetencyDimension {
  name: string;
  key: string;
  weight: number;
  competencies: Competency[];
}

export interface Competency {
  key: string;
  label: string;
  mandate: string;
  target_columns: string[];
}

export interface HtCompetencyModel {
  id: string;
  client_id: string;
  name: string;
  dimensions: CompetencyDimension[];
  benchmark_profiles: BenchmarkProfile[];
  scoring_config: ScoringConfig;
  is_active: boolean;
}

export interface ScoringConfig {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface BenchmarkProfile {
  name: string;
  position: string;
  area: string;
  position_level: string;
  scores: ProfileScores;
}

export interface ProfileScores {
  D: number;
  I: number;
  S: number;
  C: number;
  IQ: number;
  'Verbal Comprehension': number;
  'Attention and Memory': number;
  'Perceptual Speed': number;
  'Nonverbal Reasoning': number;
  Agreeableness: number;
  Openness: number;
  Extraversion: number;
  Conscientiousness: number;
  Neuroticism: number;
  'Fi Score': number;
  'Bi Score': number;
  'Bd Score': number;
  'Fd Score': number;
  Logros_media: number;
  'Afiliación_media': number;
  Poder_media: number;
  [key: string]: number;
}

export interface IdealProfile {
  [column: string]: {
    min: number;
    max: number;
    weight: number;
  };
}

export interface HtVacancy {
  id: string;
  client_id: string;
  model_id: string;
  title: string;
  description: string;
  area: string;
  position_level: string;
  ideal_profile: IdealProfile;
  competency_weights: Record<string, number>;
  status: 'open' | 'closed' | 'paused';
}

export interface HtCandidate {
  id: string;
  client_id: string;
  vacancy_id: string;
  name: string;
  email: string;
  phone: string | null;
  cv_url: string | null;
  status: 'pending' | 'invited' | 'in_progress' | 'completed' | 'expired' | 'withdrawn';
  assessment_token: string | null;
  token_expires_at: string | null;
  invited_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface HtScenario {
  id: string;
  model_id: string;
  block: 'cognitivo' | 'comportamental' | 'caracter' | 'bienestar_trayectoria';
  competency_key: string;
  competency_label: string;
  scenario_type: 'role_play' | 'numerical' | 'english' | 'likert' | 'checklist' | 'creative' | 'role_play_mc';
  scenario_text: string;
  options?: string[];
  scoring_rubric: ScoringRubric;
  target_columns: string[];
  time_limit_seconds: number;
  order_index: number;
}

export interface OptionWeight {
  maps: Record<string, number>;
  profile: string;
}

export interface ScoringRubric {
  instructions: string;
  option_weights?: OptionWeight[];
  indicators: ScoringIndicator[];
}

export interface ScoringIndicator {
  name: string;
  description: string;
  maps_to: string;
  weight: number;
  high_signal: string;
  low_signal: string;
}

export interface HtResponse {
  id: string;
  candidate_id: string;
  scenario_id: string;
  response_text: string;
  response_data: Record<string, unknown> | null;
  time_spent_seconds: number;
  is_final: boolean;
  ai_analysis: AIAnalysis | null;
  ai_scores: Record<string, number> | null;
  scored_at: string | null;
}

export interface AIAnalysis {
  summary: string;
  indicators_detected: {
    indicator: string;
    evidence: string;
    strength: 'strong' | 'moderate' | 'weak' | 'absent';
  }[];
  behavioral_patterns: string[];
  red_flags: string[];
}

export interface HtResult {
  id: string;
  candidate_id: string;
  vacancy_id: string;
  profile_scores: ProfileScores;
  dimension_scores: Record<string, number>;
  match_percentage: number;
  match_breakdown: Record<string, { score: number; ideal_min: number; ideal_max: number; match: number }>;
  benchmark_comparison: {
    vs_mean: Record<string, number>;
    percentile_rank: number;
  };
  red_flags: string[];
  recommendation: 'AVANZA' | 'EN ESPERA' | 'NO AVANZA' | 'PENDIENTE';
  recommendation_reason: string;
  total_time_seconds: number;
}

// Block metadata for the assessment UI
export interface AssessmentBlock {
  key: string;
  label: string;
  description: string;
  icon: string;
  time_minutes: number;
  scenarios: HtScenario[];
}

// Real-time save payload
export interface SaveResponsePayload {
  candidate_id: string;
  scenario_id: string;
  response_text: string;
  response_data?: Record<string, unknown>;
  time_spent_seconds: number;
  is_final: boolean;
}
