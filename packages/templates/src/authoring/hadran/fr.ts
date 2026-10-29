import type { HadranCopy } from './copy';

/** A no-break space, as French sets before % and its high punctuation. */
const N = '\u00a0';

export const fr: HadranCopy = {
  footer: 'Night Tram Records · Saison 2027',
  hero: {
    name: 'Ouverture',
    org: 'Night Tram Records · Lisbonne',
    title: ['La saison', 'débute ce soir'],
    subtitle: ['Douze disques, une tournée dans dix-huit villes et une école pour les voix de demain'],
    meta: 'Lancement de saison · Le Dépôt des trams · 21 janvier 2027',
  },
  section: {
    name: 'La saison passée',
    part: 'Première partie',
    title: ['La saison 2026,', 'en réécoute'],
    subtitle: 'Notre saison passée, en chiffres et en musique.',
  },
  setlist: {
    name: 'Setlist',
    title: 'La setlist de ce soir',
    intro: `Quarante minutes sur la saison à venir${N}: ce que la dernière nous a appris, les douze disques que nous sortirons, les dix-huit villes de la tournée et notre école. Ensuite, le bar ouvre et le groupe joue.`,
    items: [
      [`La saison passée${N}: `, 'trente et un concerts, neuf disques, presque toutes les places vendues.'],
      [`Notre façon d’enregistrer${N}: `, 'une salle, une prise, un magnéto à bandes de 1974.'],
      [`La saison 2027${N}: `, 'douze albums et une tournée dans dix-huit villes.'],
      [`L’école${N}: `, 'soixante-quatre ados apprennent à jouer et à enregistrer.'],
    ],
  },
  season: {
    name: 'La saison passée en chiffres',
    kicker: 'La saison 2026',
    title: 'La saison passée en quatre chiffres',
    hero: {
      value: `92${N}%`,
      label: 'des places vendues',
      note: `Sur 37${N}200 places pour trente et un concerts, contre 78${N}% en 2025.`,
    },
    others: [
      ['9', 'nouveaux disques, tous en vinyle'],
      ['31', 'concerts dans neuf villes'],
      [`18${N}500`, 'disques pressés à Porto'],
    ],
  },
  room: {
    name: 'Notre façon d’enregistrer',
    kicker: 'Comment nous enregistrons',
    title: 'Une salle, une prise',
    items: [
      [
        'Le groupe joue ensemble',
        `Ni overdubs ni clic${N}: les morceaux sonnent comme sur scène.`,
      ],
      [
        'Directement sur bande',
        'Un magnétophone à bandes de 1974 donne à chaque disque sa chaleur.',
      ],
      [
        'Une semaine par album',
        `Cinq jours d’enregistrement, deux de mixage${N}: c’est la salle qui décide.`,
      ],
    ],
  },
  depot: {
    name: 'Notre scène',
    place: 'Le Dépôt des trams, Lisbonne',
    title: ['Lever de rideau', 'à 21 heures'],
    body: `Un dépôt de tramways de 1901, devenu notre scène${N}: 1${N}400 places debout sous un toit de fer.`,
  },
  quote: {
    name: 'Le regard d’une artiste',
    text: 'Nous jouons chaque morceau comme si la salle allait nous rappeler. C’est tout le métier.',
    who: 'Amara Diallo',
    role: 'Chanteuse et guitariste, chez Night Tram depuis\u00a02023',
  },
  stages: {
    name: 'La saison 2027',
    kicker: 'La saison 2027',
    title: 'Trois scènes, une saison',
    cards: [
      [
        'Sur disque',
        'Douze albums',
        'De la morna cap-verdienne au jazz coréen, tout enregistré live, tout pressé en vinyle.',
      ],
      [
        'Sur scène',
        'Dix-huit villes',
        'De Lisbonne à Dakar, avec chaque soir un nouvel artiste en première partie.',
      ],
      [
        'En classe',
        'Soixante-quatre élèves',
        `Des cours du soir gratuits pour ados${N}: guitare, chant, batterie et prise de son.`,
      ],
    ],
    note: 'Un euro sur chaque billet de la tournée revient à l’école.',
  },
  calendar: {
    name: 'La saison',
    kicker: 'Étape par étape',
    title: 'La saison, de mars à octobre',
    stops: [
      ['Mars', 'Le premier disque', 'L’album de Maré Alta, enregistré en une nuit.'],
      ['Mai', 'Notre propre école', 'Quatre salles de répétition pour soixante-quatre élèves.'],
      ['Juillet', 'Nuits du Dépôt', 'Trois soirées en plein air dans la cour du dépôt.'],
      ['Octobre', 'En tournée', 'La tournée part de Lisbonne et passe par dix-huit villes.'],
    ],
    note: 'Chaque disque sort d’abord en vinyle, puis partout ailleurs un mois plus tard.',
  },
  making: {
    name: 'De la maquette au disque',
    kicker: 'Faire un disque',
    title: 'Un disque en cinq étapes',
    steps: [
      ['Écouter', 'Chaque maquette jusqu’au bout'],
      ['Enregistrer', 'En direct, sur bande'],
      ['Mixer', 'À l’oreille, en deux jours'],
      ['Presser', 'Tirage dès 300, à Porto'],
      ['Jouer', 'Lancé au Dépôt'],
    ],
    note: `De la première écoute à la soirée de lancement${N}: quatre mois.`,
  },
  school: {
    name: 'L’école',
    kicker: 'L’école',
    title: 'D’une salle à un ensemble',
    before: [
      '2025',
      'Douze élèves, une salle',
      'Des cours trois soirs par semaine dans une salle de répétition prêtée, avec deux professeurs.',
    ],
    after: [
      '2027',
      'Soixante-quatre élèves, un ensemble',
      'Quatre salles à nous, huit professeurs et un ensemble de jeunes qui ouvre la tournée.',
    ],
  },
  growth: {
    name: 'Disques et billets',
    kicker: 'Vinyle et scène',
    title: 'Disques et billets, tous deux en hausse',
    source: 'Vinyles pressés et billets de concert vendus, en milliers, 2023–2026.',
    series: ['Vinyles', 'Billets de concert'],
    figures: [
      ['×3', 'de disques pressés par rapport à 2023.'],
      [`34${N}200`, 'billets vendus en 2026, notre meilleure saison à ce jour.'],
    ],
  },
  tour: {
    name: 'La tournée',
    kicker: 'La tournée',
    title: 'Cinq des dix-huit dates',
    note: `Dix-huit dates du 2 octobre au 28 novembre 2027${N}; billetterie ouverte dès le 1er février.`,
    header: ['Ville', 'Date', 'Places', 'Tête d’affiche', 'Première partie'],
    rows: [
      ['Lisbonne', '2 octobre', `1${N}400`, 'Amara Diallo', 'L’ensemble de l’école'],
      ['Porto', '6 octobre', '900', 'Maré Alta', 'Tomás Reis'],
      ['Madrid', '10 octobre', `1${N}100`, 'Seo-yeon Park Trio', 'Mira Kaplan'],
      ['Paris', '15 octobre', `1${N}600`, 'Amara Diallo', 'Kofi Mensah'],
      ['Dakar', '7 novembre', `2${N}000`, 'Amara Diallo', 'Maré Alta'],
    ],
  },
  team: {
    name: 'L’équipe',
    kicker: 'L’équipe',
    title: 'Les gens derrière les disques',
    people: [
      ['Lisbonne', 'Inês Carvalho', 'Fondatrice, écoute encore chaque maquette'],
      ['Dakar', 'Moussa Ndiaye', 'Producteur, enregistre chaque album en live'],
      ['Séoul', 'Ji-woo Han', 'Responsable de tournée, dix-huit villes en 2027'],
      ['Haïfa', 'Eitan Mizrahi', 'Directeur de l’école, enseigne la guitare'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['Encore', `une chanson${N}?`],
    lines: [
      'L’album de Maré Alta sort le 5 mars 2027',
      'Billets de la tournée en vente dès le 1er février',
      'Inscriptions à l’école jusqu’au 15 avril',
    ],
    meta: 'Night Tram Records · Le Dépôt des trams, Lisbonne',
  },
};
