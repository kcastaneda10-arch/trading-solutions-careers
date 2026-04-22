// ─── Calibration Data: 15 Top Performers from Trading Solutions ────
// These are the blue-highlighted employees from people_file
// Used as ground truth for AI scoring calibration

import { BenchmarkProfile, ProfileScores } from './types';

export const TS_TOP_PERFORMERS: BenchmarkProfile[] = [
  {
    name: 'AHUMADA MEZA JAIME DANIEL',
    position: 'COS',
    area: 'Administration',
    position_level: 'Estrategico',
    scores: { D: 39, I: 96, S: 21, C: 36, IQ: 114, 'Verbal Comprehension': 61, 'Attention and Memory': 82, 'Perceptual Speed': 85, 'Nonverbal Reasoning': 48, Agreeableness: 46, Openness: 51, Extraversion: 71, Conscientiousness: 76, Neuroticism: 33, 'Fi Score': 76, 'Bi Score': 62, 'Bd Score': 75, 'Fd Score': 102, Logros_media: 4.0, 'Afiliación_media': 4.583, Poder_media: 4.25 },
  },
  {
    name: 'ALVAREZ MARULANDA MARIA VICTORIA',
    position: 'Lead Customer Documentation',
    area: 'Finance',
    position_level: 'Tactico',
    scores: { D: 18, I: 75, S: 46, C: 79, IQ: 119, 'Verbal Comprehension': 65, 'Attention and Memory': 87, 'Perceptual Speed': 86, 'Nonverbal Reasoning': 47, Agreeableness: 43, Openness: 64, Extraversion: 79, Conscientiousness: 82, Neuroticism: 25, 'Fi Score': 78, 'Bi Score': 87, 'Bd Score': 70, 'Fd Score': 80, Logros_media: 4.333, 'Afiliación_media': 4.583, Poder_media: 4.333 },
  },
  {
    name: 'BRUGES DIAZ PEDRO LUIS',
    position: 'Sales Executive',
    area: 'Sales',
    position_level: 'Tactico',
    scores: { D: 57, I: 93, S: 71, C: 7, IQ: 106, 'Verbal Comprehension': 55, 'Attention and Memory': 79, 'Perceptual Speed': 85, 'Nonverbal Reasoning': 43, Agreeableness: 55, Openness: 25, Extraversion: 73, Conscientiousness: 53, Neuroticism: 47, 'Fi Score': 67, 'Bi Score': 69, 'Bd Score': 103, 'Fd Score': 76, Logros_media: 3.833, 'Afiliación_media': 4.25, Poder_media: 3.833 },
  },
  {
    name: 'BRUGES STHEPHANIE',
    position: 'Gerente Comercial',
    area: 'Gerencia',
    position_level: 'Estrategico',
    scores: { D: 57, I: 96, S: 43, C: 11, IQ: 107, 'Verbal Comprehension': 99, 'Attention and Memory': 98, 'Perceptual Speed': 71, 'Nonverbal Reasoning': 38, Agreeableness: 43, Openness: 60, Extraversion: 96, Conscientiousness: 71, Neuroticism: 29, 'Fi Score': 100, 'Bi Score': 63, 'Bd Score': 89, 'Fd Score': 63, Logros_media: 3.917, 'Afiliación_media': 4.417, Poder_media: 5.0 },
  },
  {
    name: 'CONSUEGRA NAVARRO ANDRES FELIPE',
    position: 'CEO',
    area: 'Gerencia',
    position_level: 'Estrategico',
    scores: { D: 21, I: 100, S: 25, C: 43, IQ: 110, 'Verbal Comprehension': 59, 'Attention and Memory': 78, 'Perceptual Speed': 85, 'Nonverbal Reasoning': 63, Agreeableness: 19, Openness: 74, Extraversion: 90, Conscientiousness: 49, Neuroticism: 17, 'Fi Score': 89, 'Bi Score': 66, 'Bd Score': 68, 'Fd Score': 92, Logros_media: 4.167, 'Afiliación_media': 4.5, Poder_media: 4.75 },
  },
  {
    name: 'CONTRERAS HERNANDEZ YISEL PAOLA',
    position: 'COS',
    area: 'Administration',
    position_level: 'Estrategico',
    scores: { D: 43, I: 14, S: 39, C: 96, IQ: 107, 'Verbal Comprehension': 60, 'Attention and Memory': 87, 'Perceptual Speed': 94, 'Nonverbal Reasoning': 44, Agreeableness: 11, Openness: 7, Extraversion: 33, Conscientiousness: 100, Neuroticism: 68, 'Fi Score': 112, 'Bi Score': 99, 'Bd Score': 53, 'Fd Score': 51, Logros_media: 4.417, 'Afiliación_media': 4.0, Poder_media: 3.833 },
  },
  {
    name: 'DAVILA CASTELLAR KEVIN OMAR',
    position: 'Developer',
    area: 'Trading Tech',
    position_level: 'Estrategico',
    scores: { D: 96, I: 57, S: 29, C: 18, IQ: 128, 'Verbal Comprehension': 74, 'Attention and Memory': 83, 'Perceptual Speed': 97, 'Nonverbal Reasoning': 53, Agreeableness: 22, Openness: 98, Extraversion: 49, Conscientiousness: 65, Neuroticism: 10, 'Fi Score': 89, 'Bi Score': 53, 'Bd Score': 60, 'Fd Score': 113, Logros_media: 3.833, 'Afiliación_media': 4.167, Poder_media: 4.333 },
  },
  {
    name: 'FRANCO GOMEZ YOHANNA ANDREA',
    position: 'CWO',
    area: 'Wellness',
    position_level: 'Estrategico',
    scores: { D: 96, I: 64, S: 21, C: 29, IQ: 115, 'Verbal Comprehension': 82, 'Attention and Memory': 91, 'Perceptual Speed': 80, 'Nonverbal Reasoning': 52, Agreeableness: 36, Openness: 75, Extraversion: 86, Conscientiousness: 89, Neuroticism: 12, 'Fi Score': 116, 'Bi Score': 59, 'Bd Score': 62, 'Fd Score': 78, Logros_media: 4.833, 'Afiliación_media': 4.0, Poder_media: 4.75 },
  },
  {
    name: 'GONZALEZ JALAFFS MEISSY SOFIA',
    position: 'Lead Operations',
    area: 'Operations',
    position_level: 'Tactico',
    scores: { D: 32, I: 25, S: 86, C: 54, IQ: 117, 'Verbal Comprehension': 67, 'Attention and Memory': 85, 'Perceptual Speed': 82, 'Nonverbal Reasoning': 55, Agreeableness: 57, Openness: 74, Extraversion: 63, Conscientiousness: 67, Neuroticism: 26, 'Fi Score': 74, 'Bi Score': 78, 'Bd Score': 81, 'Fd Score': 82, Logros_media: 3.833, 'Afiliación_media': 4.083, Poder_media: 4.167 },
  },
  {
    name: 'HERNANDEZ MANJARRES MARIO LUIS',
    position: 'Lead Operations',
    area: 'Operations',
    position_level: 'Tactico',
    scores: { D: 25, I: 21, S: 57, C: 96, IQ: 126, 'Verbal Comprehension': 84, 'Attention and Memory': 93, 'Perceptual Speed': 88, 'Nonverbal Reasoning': 51, Agreeableness: 37, Openness: 74, Extraversion: 53, Conscientiousness: 89, Neuroticism: 61, 'Fi Score': 86, 'Bi Score': 93, 'Bd Score': 84, 'Fd Score': 52, Logros_media: 4.667, 'Afiliación_media': 4.417, Poder_media: 4.667 },
  },
  {
    name: 'MOLINARES RIVERO NICOLE CELIS',
    position: 'Lead Pricing',
    area: 'Operations',
    position_level: 'Tactico',
    scores: { D: 61, I: 21, S: 54, C: 79, IQ: 131, 'Verbal Comprehension': 80, 'Attention and Memory': 95, 'Perceptual Speed': 90, 'Nonverbal Reasoning': 48, Agreeableness: 36, Openness: 67, Extraversion: 71, Conscientiousness: 72, Neuroticism: 33, 'Fi Score': 108, 'Bi Score': 79, 'Bd Score': 72, 'Fd Score': 56, Logros_media: 4.917, 'Afiliación_media': 4.5, Poder_media: 4.75 },
  },
  {
    name: 'PEREZ JIMENEZ MANUEL ANTONIO',
    position: 'CFO',
    area: 'Finance',
    position_level: 'Estrategico',
    scores: { D: 39, I: 7, S: 21, C: 96, IQ: 114, 'Verbal Comprehension': 70, 'Attention and Memory': 87, 'Perceptual Speed': 90, 'Nonverbal Reasoning': 43, Agreeableness: 40, Openness: 74, Extraversion: 77, Conscientiousness: 89, Neuroticism: 19, 'Fi Score': 107, 'Bi Score': 94, 'Bd Score': 52, 'Fd Score': 62, Logros_media: 4.667, 'Afiliación_media': 4.917, Poder_media: 4.917 },
  },
  {
    name: 'RUBIO SUAREZ JENNIFER PAOLA',
    position: 'Account Manager',
    area: 'Finance',
    position_level: 'Tactico',
    scores: { D: 21, I: 64, S: 68, C: 64, IQ: 117, 'Verbal Comprehension': 76, 'Attention and Memory': 86, 'Perceptual Speed': 78, 'Nonverbal Reasoning': 63, Agreeableness: 14, Openness: 74, Extraversion: 96, Conscientiousness: 88, Neuroticism: 14, 'Fi Score': 72, 'Bi Score': 74, 'Bd Score': 94, 'Fd Score': 75, Logros_media: 4.25, 'Afiliación_media': 5.0, Poder_media: 4.917 },
  },
  {
    name: 'SALCEDO QUINTERO CAROLINA ANDREA',
    position: 'Developer',
    area: 'Trading Tech',
    position_level: 'Estrategico',
    scores: { D: 25, I: 4, S: 75, C: 96, IQ: 135, 'Verbal Comprehension': 87, 'Attention and Memory': 98, 'Perceptual Speed': 97, 'Nonverbal Reasoning': 53, Agreeableness: 8, Openness: 89, Extraversion: 0, Conscientiousness: 89, Neuroticism: 19, 'Fi Score': 110, 'Bi Score': 94, 'Bd Score': 22, 'Fd Score': 89, Logros_media: 4.25, 'Afiliación_media': 2.833, Poder_media: 4.333 },
  },
  {
    name: 'SILVA CASTILLO ANA CATHERINE',
    position: 'Lead Customer',
    area: 'Sales',
    position_level: 'Tactico',
    scores: { D: 89, I: 18, S: 50, C: 46, IQ: 118, 'Verbal Comprehension': 74, 'Attention and Memory': 89, 'Perceptual Speed': 81, 'Nonverbal Reasoning': 43, Agreeableness: 40, Openness: 51, Extraversion: 61, Conscientiousness: 89, Neuroticism: 36, 'Fi Score': 91, 'Bi Score': 85, 'Bd Score': 74, 'Fd Score': 65, Logros_media: 4.0, 'Afiliación_media': 4.583, Poder_media: 4.333 },
  },
];

// Computed benchmark statistics
export const TS_BENCHMARK_STATS = computeBenchmarkStats(TS_TOP_PERFORMERS);

function computeBenchmarkStats(profiles: BenchmarkProfile[]) {
  const columns: (keyof ProfileScores)[] = [
    'D', 'I', 'S', 'C', 'IQ',
    'Verbal Comprehension', 'Attention and Memory', 'Perceptual Speed', 'Nonverbal Reasoning',
    'Agreeableness', 'Openness', 'Extraversion', 'Conscientiousness', 'Neuroticism',
    'Fi Score', 'Bi Score', 'Bd Score', 'Fd Score',
    'Logros_media', 'Afiliación_media', 'Poder_media',
  ];

  const stats: Record<string, { mean: number; std: number; min: number; max: number }> = {};

  for (const col of columns) {
    const values = profiles.map(p => p.scores[col]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
    stats[col] = {
      mean: Math.round(mean * 10) / 10,
      std: Math.round(std * 10) / 10,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  return stats;
}

// Key organizational DNA patterns from the 15 top performers
export const TS_DNA_PATTERNS = {
  summary: 'Trading Solutions top performers are characterized by high IQ (avg 117.6), high Conscientiousness (77.9), low Neuroticism (29.9), low Agreeableness (33.8), dominant Fi Score (91.7 - analytical/logical brain), and high Poder motivation (4.5). They are smart, disciplined, emotionally stable, independent-minded, analytical, and power-driven.',
  key_traits: [
    { trait: 'IQ', direction: 'high', benchmark: 117.6, note: 'Nobody below 106. Cognitive ability is non-negotiable.' },
    { trait: 'Conscientiousness', direction: 'high', benchmark: 77.9, note: 'Disciplined, responsible, follow-through.' },
    { trait: 'Neuroticism', direction: 'low', benchmark: 29.9, note: 'Emotionally stable under pressure.' },
    { trait: 'Agreeableness', direction: 'low', benchmark: 33.8, note: 'Not pushovers. Have their own criteria, push back.' },
    { trait: 'Fi Score', direction: 'high', benchmark: 91.7, note: 'Analytical/logical brain dominates in TS.' },
    { trait: 'Poder_media', direction: 'high', benchmark: 4.5, note: 'Want to influence, lead, win.' },
    { trait: 'Logros_media', direction: 'high', benchmark: 4.3, note: 'Achievement-oriented, ambitious.' },
  ],
};
