import type { MaslulCopy } from './copy';

/** A no-break space, as French sets before its high punctuation, %, and in its hours. */
const N = '\u00a0';

export const fr: MaslulCopy = {
  footer: 'Club d’athlétisme Kestrel · Lancement de la saison 2027',
  hero: {
    name: 'Ouverture',
    org: 'Club d’athlétisme Kestrel · Lancement de saison',
    title: ['À vos', 'marques'],
    subtitle: [
      'Notre plan pour la saison 2027, de la première séance aux championnats nationaux',
    ],
    meta: 'Club-house · Samedi 6 février 2027',
  },
  section: {
    name: 'Où nous en sommes',
    part: 'Première partie',
    title: ['Où nous', 'en sommes'],
    subtitle: 'Une saison record derrière nous, et une piste à nous devant.',
  },
  agenda: {
    name: 'Ce soir',
    title: 'Au programme ce soir',
    intro: `Quarante minutes pour les athlètes, les parents et les entraîneurs${N}: le déroulé de la saison 2027, ce qui change en mars sur notre propre piste et le programme de chaque groupe. Questions à la fin.`,
    items: [
      [`La nouvelle piste${N}: `, 'huit couloirs éclairés, ouverts six soirs par semaine dès le 13 mars.'],
      [`Les groupes${N}: `, 'qui s’entraîne quand, où, et avec quel entraîneur.'],
      [
        `La saison${N}: `,
        'quatre rendez-vous, du meeting d’ouverture en mars aux championnats nationaux en juillet.',
      ],
      [`Nous rejoindre${N}: `, 'comment un nouvel athlète passe d’une séance d’essai à sa première course.'],
    ],
  },
  figures: {
    name: '2026 en chiffres',
    kicker: 'La saison 2026',
    title: 'Notre meilleure saison, en quatre chiffres',
    hero: {
      value: '212',
      label: 'records personnels battus',
      note: 'Dans toutes les catégories, des moins de 11 ans aux masters, contre 131 en 2025.',
    },
    others: [
      ['640', 'athlètes, de 7 à 74 ans'],
      ['18', 'entraîneurs diplômés, tous bénévoles'],
      ['9', 'médailles aux championnats nationaux'],
    ],
  },
  academy: {
    name: 'Académie jeunes',
    kicker: 'Académie jeunes · 12 à 17 ans',
    title: 'Là où commencent les finalistes de demain',
    items: [
      [
        'Un entraînement par discipline',
        'Dès 12 ans, chaque athlète rejoint le groupe sprint, demi-fond ou sauts et lancers.',
      ],
      [
        'L’école d’abord',
        `Les séances finissent avant 19${N}h${N}30, et l’entraînement s’allège en période d’examens.`,
      ],
      [
        'Un chemin vers le podium',
        'Quatre des neuf médailles nationales de l’an dernier ont été gagnées par des moins de 18 ans.',
      ],
    ],
  },
  track: {
    name: 'La nouvelle piste',
    place: 'Stade des Berges · Premier essai, janvier 2027',
    title: ['Une piste', 'à nous'],
    body: 'Huit couloirs éclairés, une aire complète de sauts et de lancers, et de la place pour chaque groupe six soirs par semaine.',
  },
  quote: {
    name: 'L’entraîneuse en chef',
    text: 'Une bonne saison ne se construit pas aux championnats. Elle se construit les mardis soir où il fait froid, un tour après l’autre.',
    who: 'Amara Okafor',
    role: 'Entraîneuse en chef, Club d’athlétisme Kestrel',
  },
  groups: {
    name: 'Groupes d’entraînement',
    kicker: 'Groupes d’entraînement',
    title: 'Trois groupes, un seul club',
    cards: [
      [
        'Groupe 01',
        'Sprint et haies',
        `Du 60 au 400${N}m, avec départs en starting-blocks, éducatifs de haies et relais, trois soirs par semaine.`,
      ],
      [
        'Groupe 02',
        'Demi-fond et fond',
        `Du 800${N}m au cross, avec des séances en côte et sur piste trois soirs par semaine.`,
      ],
      [
        'Groupe 03',
        'Sauts et lancers',
        'Longueur, hauteur et triple saut, poids et javelot, sur la nouvelle pelouse au centre de l’anneau.',
      ],
    ],
    note: 'Chaque groupe accueille des moins de 11 ans jusqu’aux masters, chacun à son niveau.',
  },
  season: {
    name: 'La saison',
    kicker: 'La saison 2027',
    title: 'Quatre rendez-vous, une saison',
    stops: [
      [
        'Mars',
        'Meeting d’ouverture',
        'Les premières courses sur notre nouvelle piste, ouvertes à tous les membres.',
      ],
      ['Mai', 'Championnats du club', 'Tous les membres courent, et chaque résultat compte pour le club.'],
      ['Juin', 'Interclubs régionaux', 'Trois tours en quatre semaines contre onze autres clubs.'],
      ['Juillet', 'Championnats nationaux', 'Nos qualifiés visent des médailles, après les neuf de 2026.'],
    ],
    note: `Comme un relais, chaque rendez-vous passe le témoin au suivant${N}: ses résultats qualifient pour le prochain.`,
  },
  joining: {
    name: 'Nous rejoindre',
    kicker: 'Rejoindre le club',
    title: 'De l’essai à la première course',
    steps: [
      ['Essayer', 'Une séance d’essai gratuite'],
      ['Se tester', 'Une course, un saut, un lancer'],
      ['S’inscrire', 'Un groupe selon l’âge et la discipline'],
      ['S’entraîner', 'Deux fois par semaine avec un coach'],
      ['Courir', 'Une première course en trois mois'],
    ],
    note: 'La plupart des nouveaux courent leur première course moins de dix semaines après leur séance d’essai.',
  },
  thenNow: {
    name: 'Avant et maintenant',
    kicker: 'Pourquoi la piste compte',
    title: 'Avant, et maintenant',
    before: [
      'Jusqu’en 2026',
      'Un terrain d’école prêté',
      'Quatre couloirs d’herbe tracés à la craie, pas d’éclairage, et 31 séances perdues l’hiver dernier pour cause de pluie ou de nuit.',
    ],
    after: [
      'À partir du 13 mars 2027',
      'Notre piste éclairée',
      `Huit couloirs tous temps, de la lumière jusqu’à 21${N}h${N}30, et tous les groupes à l’entraînement les mêmes soirs.`,
    ],
  },
  bests: {
    name: 'Records personnels',
    kicker: 'Records personnels',
    title: 'Plus rapides chaque saison',
    source: 'Records personnels battus en compétition par les athlètes du club, par saison, 2023–2026.',
    series: ['Moins de 18 ans', 'Seniors et masters'],
    figures: [
      ['212', 'records personnels en 2026, un record pour le club.'],
      [`62${N}%`, 'de plus qu’en 2025, portés par les moins de 18 ans et leurs 118 records.'],
    ],
  },
  timetable: {
    name: 'Planning',
    kicker: 'Planning de la semaine',
    title: 'Qui s’entraîne quand',
    note: 'Toutes les séances passent sur la nouvelle piste le 13 mars. D’ici là, nous restons au terrain de l’école.',
    header: ['Groupe', 'Âge', 'Jours', 'Horaires', 'Entraîneur'],
    rows: [
      ['Sprint et haies', '12+', 'lun., mer., ven.', `18${N}h – 19${N}h${N}30`, 'Amara Okafor'],
      ['Demi-fond et fond', '12+', 'mar., jeu., ven.', `17${N}h${N}30 – 19${N}h`, 'Mateo Ruiz'],
      ['Sauts et lancers', '12+', 'lun., jeu.', `18${N}h – 19${N}h${N}30`, 'Yael Ben-Ami'],
      ['École d’athlétisme', '7–11', 'samedi', `9${N}h – 10${N}h${N}30`, 'Kenji Sato'],
      ['Masters', '35+', 'mar., sam.', `19${N}h${N}30 – 21${N}h`, 'Mateo Ruiz'],
    ],
  },
  coaches: {
    name: 'Les entraîneurs',
    kicker: 'Nos entraîneurs',
    title: 'Ceux qui sont au bord de la piste',
    people: [
      ['Sprint et haies', 'Amara Okafor', `Entraîneuse en chef, ancienne coureuse de 400${N}m haies`],
      ['Demi-fond et fond', 'Mateo Ruiz', `Entraîneur de fond${N}; premier marathon à 19 ans`],
      ['Sauts et lancers', 'Yael Ben-Ami', 'Entraîneuse des sauts et lancers, kinésithérapeute du sport'],
      ['École d’athlétisme', 'Kenji Sato', `Entraîneur des jeunes${N}; anime les samedis matin`],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Le meeting d’ouverture',
    title: ['Rendez-vous', 'le 13 mars'],
    lines: [
      `Samedi 13 mars 2027, première course à 17${N}h`,
      'Stade des Berges, entrée par la porte 2',
      `Séances d’essai gratuites${N}: inscription au secrétariat du club`,
    ],
    meta: 'Club d’athlétisme Kestrel · Lancement de la saison 2027',
  },
};
