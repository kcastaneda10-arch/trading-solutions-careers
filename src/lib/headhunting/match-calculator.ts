// ─── Match Calculator: Compare candidate profile vs ideal profile ──
// Deterministic calculation (no AI needed for basic match)
// AI is used for final recommendation and nuanced analysis

import { TS_BENCHMARK_STATS } from './calibration-data';
import type { ProfileScores, IdealProfile } from './types';

// Calculate match for a single metric
function metricMatch(score: number, ideal: { min: number; max: number }): number {
  if (score >= ideal.min && score <= ideal.max) return 100;
  if (score < ideal.min) {
    const distance = ideal.min - score;
    const range = ideal.max - ideal.min || 1;
    return Math.max(0, 100 - (distance / range) * 100);
  }
  // score > ideal.max
  const distance = score - ideal.max;
  const range = ideal.max - ideal.min || 1;
  return Math.max(0, 100 - (distance / range) * 50); // Less penalty for exceeding max
}

// Calculate overall match percentage
export function calculateMatchPercentage(
  candidateProfile: ProfileScores,
  idealProfile: IdealProfile
): {
  overall: number;
  breakdown: Record<string, { score: number; ideal_min: number; ideal_max: number; match: number; weight: number }>;
} {
  const breakdown: Record<string, { score: number; ideal_min: number; ideal_max: number; match: number; weight: number }> = {};
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [col, ideal] of Object.entries(idealProfile)) {
    const score = candidateProfile[col] ?? TS_BENCHMARK_STATS[col]?.mean ?? 50;
    const match = metricMatch(score, ideal);
    const weight = ideal.weight || 1;

    breakdown[col] = {
      score: Math.round(score * 10) / 10,
      ideal_min: ideal.min,
      ideal_max: ideal.max,
      match: Math.round(match * 10) / 10,
      weight,
    };

    weightedSum += match * weight;
    totalWeight += weight;
  }

  return {
    overall: totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0,
    breakdown,
  };
}

// Compare candidate vs benchmark mean
export function compareToBenchmark(
  candidateProfile: ProfileScores
): { vs_mean: Record<string, number>; percentile_rank: number } {
  const vs_mean: Record<string, number> = {};
  let totalDeviation = 0;
  let metricCount = 0;

  for (const [col, stats] of Object.entries(TS_BENCHMARK_STATS)) {
    const candidateScore = candidateProfile[col];
    if (candidateScore !== undefined && stats.std > 0) {
      const diff = Math.round((candidateScore - stats.mean) * 10) / 10;
      vs_mean[col] = diff;
      totalDeviation += (candidateScore - stats.mean) / stats.std;
      metricCount++;
    }
  }

  // Rough percentile estimate based on average z-score
  const avgZ = metricCount > 0 ? totalDeviation / metricCount : 0;
  // Convert z-score to approximate percentile (simplified normal CDF)
  const percentile = Math.round(50 + avgZ * 20); // Rough linear approximation
  const clampedPercentile = Math.max(1, Math.min(99, percentile));

  return { vs_mean, percentile_rank: clampedPercentile };
}

// Detect red flags
export function detectRedFlags(
  candidateProfile: ProfileScores
): string[] {
  const flags: string[] = [];

  for (const [col, stats] of Object.entries(TS_BENCHMARK_STATS)) {
    const score = candidateProfile[col];
    if (score === undefined) continue;

    const threshold = stats.mean - 1.5 * stats.std;
    if (score < threshold) {
      flags.push(`${col} muy por debajo del benchmark (${score} vs mean ${stats.mean}, umbral ${Math.round(threshold)})`);
    }
  }

  // Specific TS DNA checks
  if ((candidateProfile.IQ ?? 0) < 105) flags.push('IQ por debajo del mínimo histórico de top performers (105)');
  if ((candidateProfile.Conscientiousness ?? 0) < 50) flags.push('Conscientiousness bajo — riesgo de falta de disciplina');
  if ((candidateProfile.Neuroticism ?? 0) > 65) flags.push('Neuroticism alto — riesgo de inestabilidad emocional');
  if ((candidateProfile['Fi Score'] ?? 0) < 60) flags.push('Fi Score bajo — puede tener dificultad con análisis lógico');

  return flags;
}

// Generate ideal profiles for TS vacancies based on benchmark data
export const TS_IDEAL_PROFILES: Record<string, { ideal: IdealProfile; weights: Record<string, number> }> = {
  'Pricing Junior': {
    ideal: {
      D: { min: 25, max: 70, weight: 1.0 },
      I: { min: 15, max: 80, weight: 0.8 },
      S: { min: 30, max: 80, weight: 0.8 },
      C: { min: 50, max: 96, weight: 1.3 },
      IQ: { min: 110, max: 140, weight: 1.5 },
      'Verbal Comprehension': { min: 60, max: 100, weight: 1.0 },
      'Attention and Memory': { min: 80, max: 100, weight: 1.2 },
      'Perceptual Speed': { min: 80, max: 100, weight: 1.3 },
      Conscientiousness: { min: 70, max: 100, weight: 1.4 },
      Neuroticism: { min: 5, max: 40, weight: 1.2 },
      'Fi Score': { min: 75, max: 120, weight: 1.3 },
      Logros_media: { min: 4.0, max: 5.0, weight: 1.1 },
    },
    weights: {
      razonamiento_numerico: 1.5,
      english: 1.2,
      accountability: 1.3,
      autogestion: 1.2,
      etica_trabajo: 1.3,
      competitividad: 0.8,
      instinto_comercial: 0.5,
    },
  },
  'Pricing Senior': {
    ideal: {
      D: { min: 35, max: 80, weight: 1.2 },
      I: { min: 15, max: 70, weight: 0.8 },
      S: { min: 30, max: 70, weight: 0.8 },
      C: { min: 60, max: 96, weight: 1.4 },
      IQ: { min: 115, max: 140, weight: 1.5 },
      'Attention and Memory': { min: 85, max: 100, weight: 1.3 },
      'Perceptual Speed': { min: 85, max: 100, weight: 1.3 },
      Conscientiousness: { min: 75, max: 100, weight: 1.5 },
      Neuroticism: { min: 5, max: 35, weight: 1.3 },
      'Fi Score': { min: 85, max: 120, weight: 1.5 },
      Logros_media: { min: 4.3, max: 5.0, weight: 1.2 },
      Poder_media: { min: 4.0, max: 5.0, weight: 1.0 },
    },
    weights: {
      razonamiento_numerico: 1.5,
      english: 1.3,
      accountability: 1.4,
      autogestion: 1.5,
      etica_trabajo: 1.3,
      competitividad: 1.0,
      instinto_comercial: 0.6,
    },
  },
  'Customer Documentation': {
    ideal: {
      D: { min: 15, max: 60, weight: 0.8 },
      I: { min: 30, max: 85, weight: 1.0 },
      S: { min: 40, max: 90, weight: 1.1 },
      C: { min: 60, max: 96, weight: 1.5 },
      IQ: { min: 110, max: 140, weight: 1.2 },
      'Verbal Comprehension': { min: 65, max: 100, weight: 1.4 },
      'Attention and Memory': { min: 85, max: 100, weight: 1.5 },
      Conscientiousness: { min: 75, max: 100, weight: 1.5 },
      Neuroticism: { min: 5, max: 35, weight: 1.2 },
      'Fi Score': { min: 70, max: 120, weight: 1.2 },
      'Bi Score': { min: 75, max: 110, weight: 1.3 },
    },
    weights: {
      razonamiento_numerico: 1.0,
      english: 1.5,
      accountability: 1.4,
      autogestion: 1.2,
      etica_trabajo: 1.3,
      competitividad: 0.5,
      instinto_comercial: 0.3,
    },
  },
  'In Site Sales Support': {
    ideal: {
      D: { min: 50, max: 96, weight: 1.4 },
      I: { min: 60, max: 100, weight: 1.5 },
      S: { min: 20, max: 60, weight: 0.8 },
      C: { min: 10, max: 60, weight: 0.6 },
      IQ: { min: 105, max: 140, weight: 1.0 },
      Extraversion: { min: 70, max: 100, weight: 1.5 },
      Openness: { min: 50, max: 100, weight: 1.0 },
      Conscientiousness: { min: 60, max: 100, weight: 1.2 },
      Neuroticism: { min: 5, max: 30, weight: 1.3 },
      'Fd Score': { min: 60, max: 120, weight: 1.0 },
      Poder_media: { min: 4.0, max: 5.0, weight: 1.5 },
      Logros_media: { min: 4.0, max: 5.0, weight: 1.3 },
    },
    weights: {
      razonamiento_numerico: 0.8,
      english: 1.3,
      accountability: 1.1,
      autogestion: 1.2,
      etica_trabajo: 1.0,
      competitividad: 1.5,
      instinto_comercial: 1.5,
    },
  },
};
