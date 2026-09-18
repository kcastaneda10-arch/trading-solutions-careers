import type { ItemTextEn } from './i18n';

/**
 * Parte 1 · Personalidad · texto en ingles de los 60 items.
 *
 * Solo el enunciado que ve el candidato. El codigo, la faceta, la escala y los
 * items invertidos siguen viviendo en items.ts: aca no se decide puntaje.
 *
 * Al traducir se conservo la polaridad de cada item. Un item invertido en
 * espanol dice lo mismo en ingles (por ejemplo, P-03 sigue siendo una
 * preferencia por el plan tranquilo, no por el plan con gente): si se suaviza o
 * se voltea el sentido, el puntaje invertido de items.ts queda midiendo lo
 * contrario. Los modismos colombianos se tradujeron por intencion, no palabra
 * por palabra. Los candidatos son profesionales en China que leen ingles como
 * segunda lengua: frases cortas, una idea por item, sin dobles negaciones.
 */
export const ITEMS_EN_A: Record<string, ItemTextEn> = {
  'P-01': { stem: 'I feel comfortable joining a group where I do not know anyone.' },
  'P-02': { stem: 'After a long day, being with people restores me more than being alone.' },
  'P-03': { stem: 'I prefer a quiet weekend at home over an outing with a lot of people.' },
  'P-04': { stem: 'In a large meeting, I speak only if someone asks me.' },
  'P-05': { stem: 'When the group cannot decide, I end up taking the lead.' },
  'P-06': { stem: 'I say what I think even when I know it will not be well received.' },
  'P-07': { stem: 'I find it hard to disagree with someone face to face.' },
  'P-08': { stem: 'I prefer someone else to speak for the group.' },
  'P-09': { stem: 'People describe me as a person with a lot of energy.' },
  'P-10': { stem: 'People can tell when I am excited about something.' },
  'P-11': { stem: 'I keep a calm pace and do not rush.' },
  'P-12': { stem: 'I rarely show excitement in a visible way.' },
  'P-13': { stem: 'I am interested in topics that have nothing to do with my work.' },
  'P-14': { stem: 'When something catches my attention, I read about it until I understand it well.' },
  'P-15': { stem: 'I prefer to apply what I already know rather than study something new.' },
  'P-16': { stem: 'Discussions about abstract ideas bore me.' },
  'P-17': { stem: 'I come up with different ways of doing things that already work.' },
  'P-18': { stem: 'I enjoy imagining situations that do not exist yet.' },
  'P-19': { stem: 'I am more someone who puts ideas into practice than someone who comes up with them.' },
  'P-20': { stem: 'I find it hard to think about something without a concrete case in front of me.' },
  'P-21': { stem: 'A change of plans looks to me more like an opportunity than a problem.' },
  'P-22': { stem: 'I adjust quickly to a new way of working.' },
  'P-23': { stem: 'I prefer the processes I already know, even when newer options exist.' },
  'P-24': { stem: 'Frequent changes wear me out.' },
  'P-25': { stem: 'I notice quickly when someone is uncomfortable, even if they do not say so.' },
  'P-26': { stem: 'I care how the other person is left feeling after a difficult conversation.' },
  'P-27': { stem: "I find it hard to put myself in another person's place when I do not share their reaction." },
  'P-28': { stem: 'What happens to people outside of work is not my concern.' },
  'P-29': { stem: 'I prefer to reach an agreement rather than impose my position.' },
  'P-30': { stem: 'I give in on what is not essential so that the relationship is not damaged.' },
  'P-31': { stem: 'When I am right, I hold my position to the end.' },
  'P-32': { stem: 'Negotiating positions seems like a waste of time to me.' },
  'P-33': { stem: 'I assume that people act in good faith.' },
  'P-34': { stem: 'I can trust what people tell me without checking everything.' },
  'P-35': { stem: 'With new people I stay reserved until I see what they are really like.' },
  'P-36': { stem: 'I tend to think there is a personal interest behind what people say.' },
  'P-37': { stem: 'My workspace and my work files are tidy.' },
  'P-38': { stem: 'Before starting something, I organize what I am going to need.' },
  'P-39': { stem: 'I work well in the middle of a mess.' },
  'P-40': { stem: 'I lose things among my own papers and folders.' },
  'P-41': { stem: 'When I commit to something, I finish it, even if I stop enjoying it.' },
  'P-42': { stem: 'I meet the deadlines I set for myself, not only the ones others set for me.' },
  'P-43': { stem: 'I put off what I do not feel like doing.' },
  'P-44': { stem: 'I start more things than I finish.' },
  'P-45': { stem: 'I set higher goals for myself than the ones I am asked to meet.' },
  'P-46': { stem: 'I am not satisfied when something turns out just barely acceptable.' },
  'P-47': { stem: 'I prefer a pace I can keep up over pushing myself to the limit.' },
  'P-48': { stem: 'I do not mind whether I stand out, as long as I do my part.' },
  'P-49': { stem: 'In a tense situation I stay calm.' },
  'P-50': { stem: 'Under pressure I think as clearly as I always do.' },
  'P-51': { stem: 'When things get complicated, people can see that I am tense.' },
  'P-52': { stem: 'Unexpected events upset me.' },
  'P-53': { stem: 'I trust my own judgment even when others think differently.' },
  'P-54': { stem: 'I do not need someone to confirm that I did my work well.' },
  'P-55': { stem: 'I keep going over whether I made the right decision.' },
  'P-56': { stem: 'Criticism makes me doubt myself.' },
  'P-57': { stem: 'When something bothers me, it passes quickly.' },
  'P-58': { stem: 'I can leave work at work.' },
  'P-59': { stem: 'I keep thinking about an uncomfortable conversation long after it is over.' },
  'P-60': { stem: 'A bad moment in the morning spoils the rest of my day.' },
};
