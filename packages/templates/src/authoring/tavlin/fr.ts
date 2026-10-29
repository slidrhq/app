import type { TavlinCopy } from './copy';

export const fr: TavlinCopy = {
  footer: 'Sept Épices · Réunion des partenaires 2027',
  hero: {
    name: 'Ouverture',
    org: 'Sept Épices · Un festival gourmand à Lisbonne',
    title: ['Sept épices,', 'une longue table'],
    subtitle: 'Le plan de notre troisième édition, des étals du marché à la cuisine des ateliers',
    meta: 'Réunion des partenaires · Lisbonne · 2 février 2027',
  },
  section: {
    name: 'Le marché',
    part: 'Première partie',
    title: ['Le marché'],
    subtitle: 'Soixante-quatre étals, où chaque épice se pèse et se vend à la pelle.',
  },
  agenda: {
    name: 'Ordre du jour',
    title: 'Au menu aujourd’hui',
    intro:
      'Quarante minutes sur Sept Épices, d’un marché du week-end à un festival de quarante et un mille visiteurs, et sur ce que nous demandons à chaque partenaire pour mai. Puis vos questions, autour d’un thé.',
    items: [
      ['Le marché\u00a0: ', 'soixante-quatre étals, et comment nous les attribuons cette année.'],
      ['La cuisine des ateliers\u00a0: ', 'douze postes où l’on cuisine aux côtés des chefs.'],
      ['La longue table\u00a0: ', 'six cents couverts par soir, et qui cuisine pour eux.'],
      ['La route vers mai\u00a0: ', 'ce qu’il nous faut de chaque partenaire, et pour quand.'],
    ],
  },
  figures: {
    name: 'L’année en chiffres',
    kicker: 'La deuxième édition en chiffres',
    title: 'Mai 2026 en quatre chiffres',
    hero: {
      value: '41\u00a0000',
      label: 'visiteurs en trois jours',
      note: 'Contre 23\u00a0000 lors de notre première édition, en mai 2025.',
    },
    others: [
      ['64', 'étals d’épices au marché'],
      ['19', 'chefs invités de douze pays'],
      ['2,8\u00a0t', 'd’épices vendues à la pelle'],
    ],
  },
  masterclass: {
    name: 'La cuisine des ateliers',
    kicker: 'Nouveau en 2027 · La cuisine des ateliers',
    title: 'Cuisiner aux côtés des chefs',
    items: [
      ['Douze postes', 'Chacun cuisine à son propre poste, les épices déjà pesées qui l’attendent.'],
      [
        'Quatre-vingt-dix minutes par atelier',
        'De la graine entière au plat fini : torréfier, moudre, mélanger et goûter.',
      ],
      ['En quatre langues', 'Portugais, anglais, français et arabe, avec un chef à chaque table.'],
    ],
  },
  market: {
    name: 'La halle',
    place: 'Ancien marché des Douanes, Lisbonne',
    title: ['Au bout de la route des épices'],
    body: 'Trois jours en mai, l’ancienne halle des douanes devient une cuisine de soixante-quatre étals, ouverte de midi à minuit.',
  },
  quote: {
    name: 'Le mot de la cheffe',
    text: 'Une épice est un voyage qui se goûte. Torréfiez-la, moulez-la, et tout le chemin qu’elle a parcouru vous revient.',
    who: 'Meera Pillai',
    role: 'Cheffe de la cuisine des ateliers',
  },
  programmes: {
    name: 'Programmes',
    kicker: 'Trois façons de participer',
    title: 'Un festival, trois cuisines',
    cards: [
      [
        'Programme 01',
        'Le marché',
        'Soixante-quatre étals d’épices entières et moulues, pesées à la pelle.',
      ],
      [
        'Programme 02',
        'Les ateliers',
        'Quatre-vingt-dix minutes à son poste, de la graine au plat fini.',
      ],
      [
        'Programme 03',
        'La longue table',
        'Une table de cent mètres, dressée chaque soir pour six cents convives.',
      ],
    ],
    note: 'On peut rejoindre un programme ou les trois\u00a0; étals et postes sont loués à prix coûtant.',
  },
  countdown: {
    name: 'La route vers mai',
    kicker: 'La route vers mai',
    title: 'D’aujourd’hui au soir d’ouverture',
    stops: [
      [
        'Févr. 2027',
        'Inscription des partenaires',
        'Exposants et chefs confirment leur place avant le 15 mars.',
      ],
      [
        'Mars 2027',
        'Ouverture de la billetterie',
        'Les ateliers d’abord, la longue table une semaine plus tard.',
      ],
      [
        'Avr. 2027',
        'Attribution des étals',
        'Chaque partenaire reçoit un plan de la halle et un créneau de livraison.',
      ],
      ['14 mai', 'Ouverture des portes', 'Le marché dès midi, la première longue table à 20\u00a0h.'],
    ],
    note: 'Ces dates valent pour les trois programmes\u00a0; les retardataires passent en liste d’attente.',
  },
  blend: {
    name: 'De la graine à l’assiette',
    kicker: 'Dans chaque atelier',
    title: 'De la graine à l’assiette, en cinq étapes',
    steps: [
      ['Choisir', 'Des graines entières, jamais moulues'],
      ['Torréfier', 'Deux minutes à la poêle, à sec'],
      ['Moudre', 'À la main, au mortier'],
      ['Mélanger', 'Selon la mesure du chef'],
      ['Goûter', 'Sur du pain chaud, avec un filet d’huile'],
    ],
    note: 'Chacun repart avec cent grammes de son propre mélange, et sa recette.',
  },
  longTable: {
    name: 'Ce qui change',
    kicker: 'Ce qui change cette année',
    title: 'Des files d’attente à la longue table',
    before: [
      '2026 · Deuxième édition',
      'Une file à chaque étal',
      'Les visiteurs attendaient jusqu’à quarante minutes une assiette, et mangeaient debout entre les étals.',
    ],
    after: [
      '2027 · Troisième édition',
      'Une place pour chacun',
      'Une table sur toute la longueur de la halle, servie par les chefs en quatre services chaque soir.',
    ],
  },
  guests: {
    name: 'Qui est venu',
    kicker: 'Qui est venu',
    title: 'Visiteurs par jour, en milliers',
    source: 'Billets scannés aux entrées, mai 2025 et mai 2026.',
    series: ['2025', '2026'],
    days: ['Vendredi', 'Samedi', 'Dimanche'],
    figures: [
      ['41\u00a0000', 'visiteurs sur les trois jours de 2026.'],
      ['+78\u00a0%', 'de plus qu’à notre première édition, en 2025.'],
    ],
  },
  spices: {
    name: 'Les sept épices',
    kicker: 'Les sept épices',
    title: 'Cinq des sept, et leurs cuisines',
    note: 'Le safran et le curcuma, les deux autres, ont chacun leur soirée à la longue table.',
    header: ['Épice', 'Origine', 'Atelier', 'Jour', 'Étals'],
    rows: [
      ['Cardamome', 'Kerala, Inde', 'Chai et pains sucrés', 'Vendredi', '9'],
      ['Piment', 'Oaxaca, Mexique', 'Trois moles', 'Vendredi', '11'],
      ['Cumin', 'Maroc', 'Tajines et pain', 'Samedi', '10'],
      ['Cannelle', 'Sri Lanka', 'Riz épicé', 'Samedi', '7'],
      ['Sumac', 'Galilée', 'Salades relevées', 'Dimanche', '8'],
    ],
  },
  team: {
    name: 'L’équipe',
    kicker: 'La cuisine derrière le festival',
    title: 'Quatre personnes, quatre épices',
    people: [
      ['Kochi, Inde', 'Meera Pillai', 'Cheffe, dirige la cuisine des ateliers'],
      ['Marrakech, Maroc', 'Youssef Benali', 'Marchand d’épices, compose le marché'],
      ['Oaxaca, Mexique', 'Lucía Ortega', 'Cheffe, cuisine les soirées piment'],
      ['Accra, Ghana', 'Daniel Mensah', 'Directeur du festival, dresse la longue table'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['À bientôt', 'à la longue table'],
    lines: [
      'Ancien marché des Douanes, Lisbonne',
      'Du 14 au 16 mai 2027',
      'Inscription des partenaires avant le 15 mars',
    ],
    meta: 'Sept Épices · Un festival gourmand à Lisbonne',
  },
};
