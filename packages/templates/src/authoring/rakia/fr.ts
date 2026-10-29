import type { RakiaCopy } from './copy';

/** A no-break space, as French sets before its high punctuation and inside its thousands. */
const N = '\u00a0';

export const fr: RakiaCopy = {
  footer: 'Observatoire de Meridian Peak · Première lumière 2027',
  hero: {
    name: 'Ouverture',
    org: 'Observatoire de Meridian Peak · Briefing première lumière',
    title: ['Première', 'lumière'],
    subtitle: ['Un télescope de 2,4 mètres ouvre l’œil sur la nuit'],
    meta: `Meridian Peak · 2${N}410 mètres · 12 mars 2027`,
  },
  section: {
    name: 'Le télescope',
    part: 'Première partie',
    title: ['Le télescope'],
    subtitle: 'Douze ans, d’une esquisse à un miroir.',
  },
  agenda: {
    name: 'Ce soir',
    title: 'Ce soir, en quatre temps',
    intro:
      'Quarante minutes sur le télescope qui capte cette semaine sa première lumière, sur ce qu’il observera lors de sa première saison et sur le partage de ses nuits entre les universités partenaires. Puis nous ouvrons la coupole.',
    items: [
      [`Le télescope${N}: `, 'douze ans de la première esquisse à un miroir poli de 2,4 mètres.'],
      [`Le site${N}: `, 'pourquoi Meridian Peak est plus sombre et plus stable que tout site mesuré.'],
      [`La première saison${N}: `, 'trois programmes de recherche et les objets qu’ils observent en premier.'],
      [`Partager les nuits${N}: `, 'comment un partenaire demande du temps, et comment le public participe.'],
    ],
  },
  figures: {
    name: 'En chiffres',
    kicker: 'Le télescope en chiffres',
    title: 'Seize fois plus de lumière',
    hero: {
      value: '16×',
      label: 'la lumière de notre ancien télescope de 60 cm',
      note: `Un miroir quatre fois plus large capte seize fois plus de lumière${N}: une galaxie faible demande des minutes, non des heures.`,
    },
    others: [
      ['2,4 m', 'de diamètre pour le miroir primaire'],
      [`2${N}410 m`, 'd’altitude, au-dessus de la brume'],
      ['291', 'nuits claires par an, en moyenne'],
    ],
  },
  mirror: {
    name: 'Le miroir',
    kicker: 'Sous la coupole',
    title: 'Un miroir poli pendant deux ans',
    items: [
      ['Coulé d’une seule pièce', 'Le verre a refroidi trois mois dans son moule, pour ne pas se fissurer.'],
      [
        'Poli à 18 nanomètres près',
        'Sa surface s’écarte de la courbe parfaite de moins d’un millième de cheveu.',
      ],
      [
        'De l’argent, pas de l’aluminium',
        'Un dépôt d’argent réfléchit mieux l’infrarouge, où les étoiles froides brillent le plus.',
      ],
    ],
  },
  site: {
    name: 'Le site',
    place: `Meridian Peak, 2${N}410 mètres`,
    title: ['Plus sombre que tout', 'ce que nous avons mesuré'],
    body: `Cinq ans de tests de site${N}: presque aucune lueur urbaine, et un air assez stable pour des étoiles nettes la plupart des nuits.`,
  },
  quote: {
    name: 'À la première lumière',
    text: `Pendant douze ans, nous avons construit une machine pour un seul instant${N}: la première lumière d’étoile sur son miroir.`,
    who: 'Amara Okafor',
    role: 'Directrice de l’Observatoire de Meridian Peak',
  },
  programmes: {
    name: 'La première saison',
    kicker: 'Trois programmes de recherche',
    title: 'Ce que nous observons d’abord',
    cards: [
      [
        'Programme 01',
        'Autres mondes',
        'Chronométrer la faible baisse d’éclat d’une étoile quand une planète passe devant elle.',
      ],
      [
        'Programme 02',
        'Astéroïdes géocroiseurs',
        'Repérer tôt les petits astéroïdes et fixer leur orbite en quelques jours.',
      ],
      [
        'Programme 03',
        'Étoiles pulsantes',
        `Suivre les étoiles dont l’éclat monte et retombe${N}: les étalons des distances cosmiques.`,
      ],
    ],
    note: 'Chaque programme partage ses nuits avec les universités partenaires, et ses données avec tous au bout d’un an.',
  },
  milestones: {
    name: 'Jalons',
    kicker: 'Du verre à la lumière des étoiles',
    title: 'Quatre ans, quatre jalons',
    stops: [
      ['2024', 'Le miroir est coulé', 'Le verre refroidit trois mois avant le début du polissage.'],
      ['2025', 'La coupole s’élève', 'Une coupole de 14 mètres monte au sommet en une seule saison.'],
      ['2026', 'L’optique arrive', 'Le miroir poli gravit la route de montagne au pas.'],
      ['2027', 'Première lumière', 'Le télescope prend sa première image du ciel le 12 mars.'],
    ],
    note: 'Sur ces quatre années, le miroir en a passé deux sur la machine à polir.',
  },
  nights: {
    name: 'Partager les nuits',
    kicker: 'Comment les nuits se partagent',
    title: 'D’une question à une image, en cinq étapes',
    steps: [
      ['Proposer', 'Un partenaire demande des nuits'],
      ['Évaluer', 'Un comité classe les demandes'],
      ['Planifier', 'Des nuits calées sur la Lune'],
      ['Observer', 'Le télescope tourne jusqu’à l’aube'],
      ['Partager', 'Les données au partenaire, puis à tous'],
    ],
    note: `Appels deux fois par an${N}; la plupart des programmes retenus observent sous six semaines.`,
  },
  views: {
    name: 'Avant et après',
    kicker: 'Le même coin de ciel',
    title: 'Ce que montre seize fois plus de lumière',
    before: [
      'Depuis 1998',
      'Le télescope de 60 centimètres',
      `Après une heure de pose${N}: une galaxie à peine visible et quelques dizaines d’étoiles.`,
    ],
    after: [
      'À partir de 2027',
      'Le télescope de 2,4 mètres',
      `Après quatre minutes${N}: les bras spiraux de la galaxie et des centaines d’étoiles.`,
    ],
  },
  clear: {
    name: 'Nuits claires',
    kicker: 'Cinq ans de tests de site',
    title: 'Nuits claires, saison par saison',
    source: 'Nuits claires six heures ou plus, moyenne des tests de site 2022–2026.',
    seasons: ['Hiver', 'Printemps', 'Été', 'Automne'],
    series: ['Nuits claires', 'Nuits de bon seeing'],
    figures: [
      ['291', `nuits claires par an${N}: quatre nuits sur cinq.`],
      ['0,7″', 'le flou typique d’une étoile dû à l’air, moitié moins qu’à notre ancien site.'],
    ],
  },
  targets: {
    name: 'Premières cibles',
    kicker: 'La première saison',
    title: 'Cinq objets pour les premières nuits',
    note: `Nuits programmées de mars à juin 2027${N}; distances arrondies.`,
    header: ['Objet', 'Type', 'Distance (al)', 'Nuits', 'Programme'],
    rows: [
      ['Nébuleuse d’Orion', 'Pouponnière d’étoiles', `1${N}350`, '3', 'Première lumière'],
      ['Amas de la Crèche', 'Amas d’étoiles', '577', '5', 'Étalonnage'],
      ['Galaxie du Tourbillon', 'Galaxie spirale', '23 millions', '8', 'Nuits publiques'],
      ['Delta Cephei', 'Étoile pulsante', '890', '10', 'Étoiles pulsantes'],
      ['55 Cancri', 'Étoile à cinq planètes', '41', '12', 'Autres mondes'],
    ],
  },
  team: {
    name: 'L’équipe',
    kicker: 'Au télescope',
    title: 'Les visages de la première lumière',
    people: [
      ['Direction', 'Amara Okafor', 'Directrice, mène le projet depuis la première esquisse'],
      ['Optique', 'Tomás Arriaga', 'Ingénieur opticien, a guidé deux ans de polissage'],
      ['Données', 'Hana Sato', 'Data scientist, fait de chaque nuit des images nettes'],
      ['Nuits publiques', 'Yonatan Levi', 'Médiateur, fait monter écoles et visiteurs à la coupole'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['Bon ciel', 'à tous'],
    lines: [
      `Nuit publique de première lumière${N}: samedi 13 mars 2027`,
      'Centre d’accueil de Meridian Peak, au coucher du soleil',
      'Demandes de nuits des partenaires dès le 1er avril 2027',
    ],
    meta: `Observatoire de Meridian Peak · 2${N}410 mètres d’altitude`,
  },
};
