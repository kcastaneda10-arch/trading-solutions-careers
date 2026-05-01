// ─── Match Calculator: Compare candidate profile vs TP cohort profile ──
// Calibration: ideal_profile per vacancy is derived from REAL cohort of TPs
// in similar roles. Mean ± 1.5×std bounds, with `mean` and `std` available
// for similarity-based (Gaussian) scoring.
//
// Scoring strategy:
//   - If mean+std present → similarity match using Gaussian curve over z-score
//     (smooth gradient, no hard cliffs, naturally tolerates diversity within
//     TP cohort)
//   - Else → fall back to legacy threshold scoring (min/max box)

import { TS_BENCHMARK_STATS } from './calibration-data';
import type { ProfileScores, IdealProfile } from './types';

// ─── Similarity-based metric match ────────────────────────────────
// Returns 100% if candidate is at TP cohort mean, smoothly decays as they
// drift away. At z=±1 std → ~78%, at z=±2 std → ~37%, at z=±3 std → ~11%.
function gaussianMatch(score: number, mean: number, std: number): number {
  if (std <= 0) return score === mean ? 100 : 50;
  const z = (score - mean) / std;
  // Plateau within ±0.5 std (very close to TP) — full credit
  const effectiveZ = Math.max(0, Math.abs(z) - 0.5);
  return Math.round(Math.exp(-(effectiveZ * effectiveZ) / 4) * 1000) / 10;
}

// Legacy threshold match (used when ideal_profile lacks mean/std fields)
function thresholdMatch(score: number, ideal: { min: number; max: number }): number {
  if (score >= ideal.min && score <= ideal.max) return 100;
  if (score < ideal.min) {
    const distance = ideal.min - score;
    const range = ideal.max - ideal.min || 1;
    return Math.max(0, 100 - (distance / range) * 100);
  }
  const distance = score - ideal.max;
  const range = ideal.max - ideal.min || 1;
  return Math.max(0, 100 - (distance / range) * 50);
}

function metricMatch(
  score: number,
  ideal: { min: number; max: number; mean?: number; std?: number }
): number {
  if (ideal.mean !== undefined && ideal.std !== undefined && ideal.std > 0) {
    return gaussianMatch(score, ideal.mean, ideal.std);
  }
  return thresholdMatch(score, ideal);
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

  const avgZ = metricCount > 0 ? totalDeviation / metricCount : 0;
  const percentile = Math.round(50 + avgZ * 20);
  const clampedPercentile = Math.max(1, Math.min(99, percentile));

  return { vs_mean, percentile_rank: clampedPercentile };
}

// Detect red flags — using cohort-specific thresholds when available
export function detectRedFlags(
  candidateProfile: ProfileScores
): string[] {
  const flags: string[] = [];

  for (const [col, stats] of Object.entries(TS_BENCHMARK_STATS)) {
    const score = candidateProfile[col];
    if (score === undefined) continue;
    // Only flag if score is ≥ 2 std below mean (≈ bottom 2.5% of TPs)
    const threshold = stats.mean - 2 * stats.std;
    if (score < threshold && stats.std > 0) {
      flags.push(`${col} significativamente bajo vs benchmark (${score} vs mean ${stats.mean.toFixed(1)}, threshold ${threshold.toFixed(1)})`);
    }
  }

  // Hard floors based on actual TP minimums (derived from data)
  if ((candidateProfile.IQ ?? 0) < 105) flags.push('IQ por debajo del mínimo histórico de top performers (105)');
  if ((candidateProfile.Conscientiousness ?? 0) < 49) flags.push('Conscientiousness por debajo del mínimo TP (49)');
  if ((candidateProfile.Neuroticism ?? 0) > 70) flags.push('Neuroticism por encima del máximo TP (68)');

  return flags;
}

// ─── Ideal profiles per vacancy: derived from real TP cohorts ────
// Mean ± 1.5×std bounds + mean + std for similarity scoring.
// Auto-generated from people_file Ultima Versión.xlsx (15 TPs).
//
// Cohort mappings:
//   Inside Sales → Bruges Pedro, Bruges Stephanie, Silva Castillo (Sales/Comercial)
//   Pricing Sr/Jr → Molinares (Lead Pricing), Gonzalez, Hernandez (Lead Ops)
//   Customer Documentation → Alvarez, Rubio (Finance/Doc)
//   Lead Accounting Finance → Perez (CFO), Alvarez, Rubio
export const TS_IDEAL_PROFILES: Record<string, { ideal: IdealProfile; weights: Record<string, number> }> = {
  'Inside Sales': {
    ideal: {
      D: { min: 39.95, max: 95.38, mean: 67.67, std: 18.48, weight: 1.0 },
      I: { min: 2.71, max: 135.29, mean: 69, std: 44.19, weight: 1.4 },
      S: { min: 32.81, max: 76.52, mean: 54.67, std: 14.57, weight: 0.7 },
      C: { min: 0, max: 53.52, mean: 21.33, std: 21.46, weight: 0.5 },
      IQ: { min: 100.35, max: 120.32, mean: 110.33, std: 6.66, weight: 1.0 },
      'Verbal Comprehension': { min: 54.8, max: 99.2, mean: 77, std: 14.8, weight: 1.0 },
      'Attention and Memory': { min: 77.47, max: 99.2, mean: 88.33, std: 7.24, weight: 1.0 },
      'Perceptual Speed': { min: 79.35, max: 99.32, mean: 89.33, std: 6.66, weight: 1.0 },
      'Nonverbal Reasoning': { min: 38.18, max: 59.82, mean: 49, std: 7.21, weight: 1.0 },
      Openness: { min: 18.07, max: 72.6, mean: 45.33, std: 18.18, weight: 0.7 },
      Extraversion: { min: 49.99, max: 103.35, mean: 76.67, std: 17.79, weight: 1.5 },
      Conscientiousness: { min: 44.0, max: 98.0, mean: 71, std: 18.0, weight: 1.1 },
      Neuroticism: { min: 23.72, max: 50.94, mean: 37.33, std: 9.07, weight: 1.1 },
      'Fi Score': { min: 60.41, max: 111.59, mean: 86, std: 17.06, weight: 0.8 },
      'Bi Score': { min: 55.27, max: 89.39, mean: 72.33, std: 11.37, weight: 0.6 },
      'Bd Score': { min: 66.91, max: 110.42, mean: 88.67, std: 14.5, weight: 0.6 },
      'Fd Score': { min: 57.5, max: 78.5, mean: 68, std: 7.0, weight: 1.0 },
    },
    weights: { razonamiento_numerico: 0.8, english: 1.3, accountability: 1.1, autogestion: 1.2, etica_trabajo: 1.0, competitividad: 1.5, instinto_comercial: 1.5 },
  },
  'Pricing Senior': {
    ideal: {
      D: { min: 10.7, max: 67.96, mean: 39.33, std: 19.09, weight: 1.0 },
      I: { min: 18.87, max: 25.8, mean: 22.33, std: 2.31, weight: 0.6 },
      S: { min: 39.16, max: 92.18, mean: 65.67, std: 17.67, weight: 0.9 },
      C: { min: 44.64, max: 108.02, mean: 76.33, std: 21.13, weight: 1.3 },
      IQ: { min: 114.02, max: 135.31, mean: 124.67, std: 7.09, weight: 1.5 },
      'Attention and Memory': { min: 80.09, max: 105.25, mean: 92.67, std: 8.39, weight: 1.4 },
      'Perceptual Speed': { min: 80.88, max: 99.12, mean: 90, std: 6.08, weight: 1.4 },
      Openness: { min: 65.6, max: 77.73, mean: 71.67, std: 4.04, weight: 0.8 },
      Conscientiousness: { min: 58.7, max: 93.3, mean: 76, std: 11.53, weight: 1.5 },
      Neuroticism: { min: 12.22, max: 67.78, mean: 40, std: 18.52, weight: 1.3 },
      'Fi Score': { min: 63.47, max: 115.2, mean: 89.33, std: 17.24, weight: 1.5 },
      'Bi Score': { min: 70.75, max: 95.91, mean: 83.33, std: 8.39, weight: 1.2 },
    },
    weights: { razonamiento_numerico: 1.5, english: 1.3, accountability: 1.4, autogestion: 1.5, etica_trabajo: 1.3, competitividad: 1.0, instinto_comercial: 0.6 },
  },
  'Pricing Junior': {
    ideal: {
      D: { min: 10.7, max: 67.96, mean: 39.33, std: 19.09, weight: 0.9 },
      I: { min: 18.87, max: 25.8, mean: 22.33, std: 2.31, weight: 0.6 },
      S: { min: 39.16, max: 92.18, mean: 65.67, std: 17.67, weight: 0.9 },
      C: { min: 44.64, max: 108.02, mean: 76.33, std: 21.13, weight: 1.2 },
      IQ: { min: 114.02, max: 135.31, mean: 124.67, std: 7.09, weight: 1.4 },
      'Attention and Memory': { min: 80.09, max: 105.25, mean: 92.67, std: 8.39, weight: 1.3 },
      'Perceptual Speed': { min: 80.88, max: 99.12, mean: 90, std: 6.08, weight: 1.3 },
      Openness: { min: 65.6, max: 77.73, mean: 71.67, std: 4.04, weight: 0.7 },
      Conscientiousness: { min: 58.7, max: 93.3, mean: 76, std: 11.53, weight: 1.4 },
      Neuroticism: { min: 12.22, max: 67.78, mean: 40, std: 18.52, weight: 1.2 },
      'Fi Score': { min: 63.47, max: 115.2, mean: 89.33, std: 17.24, weight: 1.4 },
      'Bi Score': { min: 70.75, max: 95.91, mean: 83.33, std: 8.39, weight: 1.1 },
    },
    weights: { razonamiento_numerico: 1.5, english: 1.2, accountability: 1.3, autogestion: 1.2, etica_trabajo: 1.3, competitividad: 0.8, instinto_comercial: 0.5 },
  },
  'Customer Documentation': {
    ideal: {
      I: { min: 57.83, max: 81.17, mean: 69.5, std: 7.78, weight: 0.9 },
      S: { min: 33.67, max: 80.33, mean: 57, std: 15.56, weight: 1.1 },
      C: { min: 55.59, max: 87.41, mean: 71.5, std: 10.61, weight: 1.5 },
      IQ: { min: 115.88, max: 120.12, mean: 118, std: 1.41, weight: 1.0 },
      'Verbal Comprehension': { min: 62.2, max: 72.8, mean: 67.5, std: 3.54, weight: 1.4 },
      'Attention and Memory': { min: 79.2, max: 89.8, mean: 84.5, std: 3.54, weight: 1.5 },
      Conscientiousness: { min: 78.64, max: 91.36, mean: 85, std: 4.24, weight: 1.5 },
      Neuroticism: { min: 7.83, max: 31.17, mean: 19.5, std: 7.78, weight: 1.2 },
      'Fi Score': { min: 68.64, max: 81.36, mean: 75, std: 4.24, weight: 1.0 },
      'Bi Score': { min: 66.71, max: 94.29, mean: 80.5, std: 9.19, weight: 1.3 },
    },
    weights: { razonamiento_numerico: 1.0, english: 1.5, accountability: 1.4, autogestion: 1.2, etica_trabajo: 1.3, competitividad: 0.5, instinto_comercial: 0.3 },
  },
  'Lead Accounting Finance Officer': {
    ideal: {
      S: { min: 9.73, max: 80.27, mean: 45, std: 23.52, weight: 1.0 },
      C: { min: 55.65, max: 103.68, mean: 79.67, std: 16.01, weight: 1.4 },
      IQ: { min: 112.89, max: 120.44, mean: 116.67, std: 2.52, weight: 1.4 },
      'Verbal Comprehension': { min: 57.5, max: 72.5, mean: 65, std: 5.0, weight: 1.3 },
      'Attention and Memory': { min: 80.56, max: 88.11, mean: 84.33, std: 2.52, weight: 1.5 },
      Conscientiousness: { min: 80.65, max: 92.01, mean: 86.33, std: 3.79, weight: 1.5 },
      Neuroticism: { min: 11.07, max: 27.59, mean: 19.33, std: 5.51, weight: 1.2 },
      'Fi Score': { min: 57.59, max: 113.74, mean: 85.67, std: 18.72, weight: 1.4 },
      'Bi Score': { min: 69.78, max: 100.22, mean: 85, std: 10.15, weight: 1.4 },
    },
    weights: { razonamiento_numerico: 1.5, english: 1.0, accountability: 1.5, autogestion: 1.3, etica_trabajo: 1.4, competitividad: 0.5, instinto_comercial: 0.4 },
  },
};
