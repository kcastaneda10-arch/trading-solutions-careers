/**
 * Texto en ingles de los bloques D (razonamiento) y E (integridad).
 *
 * Solo texto que ve el candidato. La respuesta correcta, el racional y el
 * puntaje de efectividad siguen viviendo en items.ts y no se traducen.
 *
 * Criterios de traduccion, para quien venga a ajustar esto despues:
 *  · Bloque D: la clave no cambia. Cifras, unidades, series y relaciones se
 *    trasladan identicas, y cada distractor conserva la trampa que tenia en
 *    espanol (sinonimo en las analogias, promedio en las de tasa, reciproca en
 *    las deductivas). No se agrega ninguna pista que el original no diera.
 *  · Figurales: el `alt` es lo que anuncia el lector de pantalla. Describe la
 *    figura y nada mas; si el alt revelara la regla, el item se cae.
 *  · Bloque E: se respeta el gradiente de efectividad. La opcion que en
 *    espanol suena defendible tiene que sonar defendible en ingles, y la mejor
 *    no puede volverse obvia. Los items de deseabilidad social conservan el
 *    absoluto ("nunca", "jamas"), que es lo que los hace funcionar.
 *  · R-24 va en la misma cifra del original con separador de miles en ingles:
 *    "$90.000" leido por un angloparlante seria noventa, no noventa mil.
 */
import type { ItemTextEn } from './i18n';

export const ITEMS_EN_DE: Record<string, ItemTextEn> = {
  // ── Bloque D · series numericas ──
  'R-01': {
    stem: 'Which number continues the series?\n\n3 · 6 · 11 · 18 · 27 · ?',
    options: { A: '34', B: '36', C: '38', D: '40' },
  },
  'R-02': {
    stem: 'Which number continues the series?\n\n2 · 6 · 12 · 20 · 30 · ?',
    options: { A: '40', B: '42', C: '44', D: '46' },
  },
  'R-03': {
    stem: 'Which number continues the series?\n\n1 · 2 · 4 · 8 · 16 · ?',
    options: { A: '24', B: '30', C: '32', D: '64' },
  },
  'R-04': {
    stem: 'Which number continues the series?\n\n81 · 27 · 9 · 3 · ?',
    options: { A: '0', B: '1', C: '1.5', D: '2' },
  },
  'R-05': {
    stem: 'Which number continues the series?\n\n2 · 3 · 5 · 8 · 13 · ?',
    options: { A: '18', B: '20', C: '21', D: '26' },
  },
  'R-06': {
    stem: 'Which number continues the series?\n\n5 · 11 · 23 · 47 · ?',
    options: { A: '71', B: '84', C: '94', D: '95' },
  },

  // ── Bloque D · matrices figurales ──
  'R-07': {
    stem: 'Complete the matrix.',
    alts: {
      A: 'Plain triangle',
      B: 'Triangle with one vertical line',
      C: 'Triangle with a vertical line and a horizontal line',
      D: 'Triangle with two vertical lines',
    },
  },
  'R-08': {
    stem: 'Complete the matrix.',
    alts: { A: 'Four dots', B: 'Five dots', C: 'Three dots', D: 'Six dots' },
  },
  'R-09': {
    stem: 'Which of the four figures does NOT belong to the group?',
    alts: {
      A: 'Square with one diagonal line',
      B: 'Diamond with one line',
      C: 'Circle with two lines',
      D: 'Triangle with one line',
    },
  },
  'R-10': {
    stem: 'The third figure in each row combines the two before it. Complete the matrix.',
    alts: {
      A: 'Triangle alone',
      B: 'Triangle with one horizontal line',
      C: 'Triangle with one vertical line',
      D: 'A horizontal line alone',
    },
  },
  'R-11': {
    stem: 'Complete the matrix.',
    alts: {
      A: 'L shape with the corner at the bottom left',
      B: 'L shape with the corner at the top left',
      C: 'L shape with the corner at the top right',
      D: 'L shape with the corner at the bottom right',
    },
  },
  'R-12': {
    stem: 'Complete the matrix.',
    alts: {
      A: 'Pentagon with one dot',
      B: 'Square with two dots',
      C: 'Pentagon with two dots',
      D: 'Pentagon with three dots',
    },
  },
  'R-13': {
    stem: 'Which of the four figures does NOT belong to the group?',
    alts: {
      A: 'Circle with a vertical line',
      B: 'Square with a vertical line',
      C: 'Square with a diagonal line',
      D: 'Triangle with a vertical line',
    },
  },
  'R-14': {
    stem: 'From the first figure, remove what the second one shows. Complete the matrix.',
    alts: {
      A: 'A vertical line alone',
      B: 'Triangle with a vertical line',
      C: 'Triangle alone',
      D: 'Circle alone',
    },
  },

  // ── Bloque D · analogias verbales ──
  'R-15': {
    stem: 'Scarce is to abundant as fleeting is to:',
    options: { A: 'brief', B: 'lasting', C: 'fragile', D: 'intense' },
  },
  'R-16': {
    stem: 'Thermometer is to temperature as scale is to:',
    options: { A: 'volume', B: 'weight', C: 'height', D: 'density' },
  },
  'R-17': {
    stem: 'Rehearsal is to opening night as training is to:',
    options: { A: 'effort', B: 'discipline', C: 'competition', D: 'rest' },
  },
  'R-18': {
    stem: 'Island is to water as oasis is to:',
    options: { A: 'palm tree', B: 'desert', C: 'thirst', D: 'sand' },
  },
  'R-19': {
    stem: 'Shy is to outgoing as rigid is to:',
    options: { A: 'hard', B: 'flexible', C: 'fragile', D: 'stable' },
  },
  'R-20': {
    stem: 'Seed is to tree as sketch is to:',
    options: { A: 'pencil', B: 'artist', C: 'finished work', D: 'idea' },
  },

  // ── Bloque D · cuantitativo ──
  'R-21': {
    stem: 'A tank fills in 6 hours using only the first valve, and in 12 hours using only the second valve. If both are opened at the same time, how long does it take to fill?',
    options: { A: '3 hours', B: '4 hours', C: '6 hours', D: '9 hours' },
  },
  'R-22': {
    stem: 'The price of a product goes up 20% and then goes down 20%. Compared with the original price, the final price is:',
    options: { A: 'the same', B: '4% lower', C: '4% higher', D: 'it depends on the original price' },
  },
  'R-23': {
    stem: 'If 3 machines produce 3 parts in 3 minutes, how many minutes do 9 machines take to produce 9 parts?',
    options: { A: '3', B: '9', C: '27', D: '1' },
  },
  'R-24': {
    stem: 'After a 25% discount, an item costs $90,000. What was the price before the discount?',
    options: { A: '$112,500', B: '$115,000', C: '$120,000', D: '$135,000' },
  },
  'R-25': {
    stem: 'In a group of 40 people, 60% are women. If 4 men leave, what percentage of the group are women?',
    options: { A: '60%', B: 'about 63%', C: 'about 67%', D: '70%' },
  },

  // ── Bloque D · deduccion ──
  'R-26': {
    stem: 'If every marked part was inspected, and no inspected part was left on the red shelf, then it is certain that:',
    options: {
      A: 'No marked part is on the red shelf.',
      B: 'Every part on the red shelf is unmarked and uninspected.',
      C: 'Some inspected part is on the red shelf.',
      D: 'Every inspected part is marked.',
    },
  },
  'R-27': {
    stem: 'If the document is signed, then it was reviewed. This document was not reviewed. It follows that:',
    options: {
      A: 'The document is signed.',
      B: 'The document is not signed.',
      C: 'Nothing can be concluded.',
      D: 'The document was reviewed by someone else.',
    },
  },
  'R-28': {
    stem: 'Some coordinators hold a certification. Everyone who holds the certification attended the course. It follows that:',
    options: {
      A: 'Every coordinator attended the course.',
      B: 'Some coordinators attended the course.',
      C: 'No coordinator attended the course.',
      D: 'Everyone who attended the course is a coordinator.',
    },
  },

  // ── Bloque E · integridad y criterio ──
  'E-01': {
    stem: 'Clocking out for a coworker who has already left hurts no one, as long as he worked his full shift anyway.',
  },
  'E-02': {
    stem: 'Using the company vehicle for a short personal errand, once you have finished your route, is nothing to worry about.',
  },
  'E-03': {
    stem: 'When the procedure holds up an urgent delivery and you know nothing is going to happen, the sensible thing is to skip it and document it later.',
  },
  'E-04': {
    stem: 'Stretching your experience a little on a resume is normal: everybody does it.',
  },
  'E-05': {
    stem: 'I have never been late to an appointment.',
  },
  'E-06': {
    stem: 'Taking home office supplies that were left over is not stealing.',
  },
  'E-07': {
    stem: 'Signing the record of an inspection you did carry out, even if you sign it two days after the date shown, is a minor detail.',
  },
  'E-08': {
    stem: 'A supplier invites a coordinator to a paid training course abroad. The invitation arrives while the renewal of that supplier\'s contract is being evaluated. The most reasonable thing to do is:',
    options: {
      A: 'Accept: the course is legitimate training and the coordinator does not sign the contract.',
      B: 'Accept, and tell his manager after the trip so that it is on record.',
      C: 'Report it in writing before deciding and step out of the evaluation of that supplier.',
      D: 'Decline without saying anything, so as not to strain the business relationship.',
    },
  },
  'E-09': {
    stem: 'Saying that something has already been sent when it has not, to buy a few hours, is a lesser evil.',
  },
  'E-10': {
    stem: 'Taking something from work that nobody was going to use takes nothing away from the company.',
  },
  'E-11': {
    stem: 'I have never said something that was not entirely true in order to spare someone an upset.',
  },
  'E-12': {
    stem: 'Rules are made for normal situations; in an emergency what matters is solving the problem.',
  },
  'E-13': {
    stem: 'A manager from another area insists, in front of your team, that you approve something that does not meet a requirement. It is the third time this month, and he tells you that you "hold everything up." The most reasonable thing to do is:',
    options: {
      A: 'Hold your refusal right there, explaining the requirement, and offer to meet later to review why it keeps happening.',
      B: 'Approve it this time and put in writing that it was done under pressure.',
      C: 'End the conversation by saying that this is not open for discussion, and walk away.',
      D: 'Escalate to senior management right away without answering him.',
    },
  },
  'E-14': {
    stem: 'If a mistake of your own is not going to be noticed, it is not worth reporting.',
  },
  'E-15': {
    stem: 'If the company moves millions, one small poorly justified expense makes no difference.',
  },
  'E-16': {
    stem: 'Asking permission for everything makes the work impossible: sometimes you have to act and report it afterward.',
  },
  'E-17': {
    stem: 'It has never bothered me to be interrupted.',
  },
  'E-18': {
    stem: 'A position opens up in your area and the most qualified person you know is a close relative. The most reasonable thing to do is:',
    options: {
      A: 'Put him forward without mentioning the family tie: he will be evaluated like anyone else anyway.',
      B: 'Put him forward, declare the family tie in writing and step out of the decision.',
      C: 'Not put him forward, to avoid comments.',
      D: 'Put him forward and mention the family tie verbally to whoever decides.',
    },
  },
  'E-19': {
    stem: 'Clocking out for a coworker who already worked his full shift is a favor between colleagues, not misconduct.',
  },
  'E-20': {
    stem: 'Taking supplies that nobody was asking for is different from taking something that is actually needed.',
  },
  'E-21': {
    stem: 'At the start of the shift you notice alcohol on the breath of the forklift operator. He is the only operator available and there is an urgent shipment committed for that morning. The first thing you do is:',
    options: {
      A: 'Let him operate under close supervision and talk with him at the end of the shift.',
      B: 'Take him off the operation immediately and start the defined procedure, even if the shipment is delayed.',
      C: 'Check with the area manager whether the shipment can go out first.',
      D: 'Ask him to have a coffee and wait half an hour before deciding.',
    },
  },
  'E-22': {
    stem: 'If the boss asks for something that falls outside the procedure, the responsibility is his.',
  },
  'E-23': {
    stem: 'I have always listened to everyone with the same attention, no matter who they are.',
  },
  'E-24': {
    stem: 'In an interview, a candidate coming from a competitor offers to share commercial information about his previous employer. The most reasonable thing to do is:',
    options: {
      A: 'Listen to it: he brought it up, nobody asked him for it.',
      B: 'Stop him, explain that this is not part of the process, and leave it on record.',
      C: 'Listen to it but not use it for anything.',
      D: 'Change the subject without making any comment.',
    },
  },
  'E-25': {
    stem: 'A customer calls you upset and speaks to you in an offensive tone about a delay that does not depend on your area. The most reasonable thing to do is:',
    options: {
      A: 'Keep your tone, acknowledge what happened and commit to a specific date.',
      B: 'Listen without interrupting until his tone comes down, and then answer.',
      C: 'Explain to him that this delay does not depend on your area.',
      D: 'Tell him you will call him back when the two of you can talk with respect.',
    },
  },
  'E-26': {
    stem: 'At a company celebration, an employee who is clearly drunk asks for his keys so he can drive home. The most reasonable thing to do is:',
    options: {
      A: 'Hold on to the keys and arrange a ride for him, even if he gets annoyed.',
      B: 'Hand them over: he is an adult and this is outside working hours.',
      C: 'Advise him not to drive and, if he insists, hand them over.',
      D: 'Let a close coworker know so that he takes care of it.',
    },
  },
  'E-27': {
    stem: 'A control that nobody reviews is not worth carrying out so strictly.',
  },
  'E-28': {
    stem: 'In a meeting, a colleague says in front of everyone that your work "was of no use at all." The most reasonable thing to do is:',
    options: {
      A: 'Ask him right there to say exactly which part was of no use, and answer with data.',
      B: 'Not answer there and look for him afterward to talk it over in private.',
      C: 'Answer him in the same tone, to make clear that you do not let it pass.',
      D: 'Let it go: it is not worth getting into.',
    },
  },
  'E-29': {
    stem: 'I have never felt envious of another person\'s success.',
  },
  'E-30': {
    stem: 'A coworker tells you that today he is not in condition to operate the equipment and asks you not to report it, saying he will stay doing something else. The most reasonable thing to do is:',
    options: {
      A: 'Agree: if he is not going to operate, there is no risk.',
      B: 'Report it to the immediate manager so that it is on record and it is decided what he does today.',
      C: 'Tell him to go home and say nothing about it.',
      D: 'Agree for today, and warn him that if it happens again you will report it.',
    },
  },
};
