import type { TaaruchaCopy } from './copy';

/** A no-break space, as French sets before % and its high punctuation and inside figures. */
const N = '\u00a0';

export const fr: TaaruchaCopy = {
  footer: 'Musée d’art Vellin · Visite de presse 2027',
  hero: {
    name: 'Ouverture',
    org: 'Musée d’art Vellin · L’aile des collections',
    title: ['Les collections,', 'réaccrochées'],
    subtitle: [`Vingt-deux salles, 1${N}180 œuvres`, 'et un nouveau parcours pour les découvrir'],
    meta: 'Visite presse et mécènes · 12 avril 2027',
  },
  section: {
    name: 'La nouvelle aile',
    part: 'Première partie',
    title: ['La nouvelle aile'],
    subtitle: 'Vingt-deux salles sur trois niveaux, et un seul parcours pour les traverser.',
  },
  agenda: {
    name: 'Ce matin',
    title: 'La visite de ce matin',
    intro:
      'Quarante minutes sur la façon dont nous avons réaccroché les collections après deux ans de travaux, et sur ce qui change pour les visiteurs dès l’ouverture. Puis une promenade dans les premières salles.',
    items: [
      [`La nouvelle aile${N}: `, 'vingt-deux salles sur trois niveaux, et un seul parcours pour les traverser.'],
      [`Restauration${N}: `, '312 œuvres nettoyées, consolidées et réencadrées pour l’accrochage.'],
      [`La visite${N}: `, 'nocturnes gratuites le jeudi, et un atelier pensé pour les scolaires.'],
      [`L’année à venir${N}: `, 'quatre dates à retenir, de l’ouverture à la première exposition de prêts.'],
    ],
  },
  figures: {
    name: 'En chiffres',
    kicker: 'Le réaccrochage en chiffres',
    title: 'La nouvelle aile en quatre chiffres',
    hero: {
      value: `1${N}180`,
      label: 'œuvres exposées',
      note: 'Plus du double des 520 présentées avant la fermeture de l’aile en 2025.',
    },
    others: [
      ['22', 'salles sur trois niveaux'],
      ['312', 'œuvres restaurées pour l’accrochage'],
      ['86', 'acquisitions montrées pour la première fois'],
    ],
  },
  studio: {
    name: 'Restauration',
    kicker: 'L’atelier de restauration',
    title: 'Chaque œuvre, prête pour sa cimaise',
    items: [
      ['Nettoyée à la main', 'Le vieux vernis retiré au coton-tige, quelques centimètres à la fois.'],
      [
        'Restaurée, jamais repeinte',
        'Déchirures et lacunes comblées de matériaux réversibles.',
      ],
      [
        'Éclairée sur mesure',
        'Une lumière réglée sur ce que la peinture ou le papier supporte.',
      ],
    ],
  },
  gallery: {
    name: 'La grande galerie',
    place: 'Salle 7, la grande galerie',
    title: ['Prendre du recul'],
    body: 'Chaque tableau dispose d’un mètre et demi de mur, et chaque salle a son banc.',
  },
  quote: {
    name: 'Le regard de la conservatrice',
    text: 'Pendant deux ans, les tableaux ont attendu dans le noir. Aujourd’hui, chacun a un mur, une lumière et un banc devant lui.',
    who: 'Amara Okafor',
    role: 'Conservatrice en chef, Musée d’art Vellin',
  },
  visits: {
    name: 'Venir au musée',
    kicker: 'Trois nouvelles façons de venir',
    title: 'Un musée ouvert à plus de monde',
    cards: [
      [
        'Le jeudi',
        'Nocturnes gratuites',
        `Ouvert jusqu’à 22${N}h, musique dans l’atrium, sans billet.`,
      ],
      [
        'Scolaires',
        'L’atelier ouvert',
        'Une salle où les classes dessinent d’après les œuvres qu’elles viennent de voir.',
      ],
      ['Membres', 'Dans les coulisses', 'Une visite par mois de l’atelier de restauration et des réserves.'],
    ],
    note: 'Toutes les propositions commencent la semaine de l’ouverture.',
  },
  year: {
    name: 'La première année',
    kicker: 'La première année',
    title: 'Quatre dates de la première année',
    stops: [
      ['14 avril', 'Les portes s’ouvrent', 'Les vingt-deux salles, gratuites le week-end d’ouverture.'],
      ['1er juillet', 'Soirées d’été', `Le jeudi jusqu’à 22${N}h, avec de la musique dans l’atrium.`],
      [
        '20 octobre',
        'La première exposition de prêts',
        'Cinquante œuvres, prêtées par Lisbonne, Séoul et Dakar.',
      ],
      ['3 février', 'Les œuvres en ligne', 'Chaque œuvre exposée, photographiée et publiée.'],
    ],
    note: 'Dates en 2027 et début 2028. Toutes les expositions sont comprises dans le billet.',
  },
  journey: {
    name: 'Des réserves au mur',
    kicker: 'Des réserves aux cimaises',
    title: 'Jusqu’au mur, en cinq étapes',
    steps: [
      ['Choisir', ['Les conservateurs', 'choisissent parmi', `18${N}400 œuvres`]],
      ['Restaurer', 'Nettoyée et consolidée dans notre atelier'],
      ['Encadrer', 'Un cadre fait sur mesure pour chaque œuvre'],
      ['Accrocher', `Le centre de l’œuvre à 145${N}cm du sol`],
      ['Éclairer', [`Papier${N}: 50 lux,`, `peinture${N}: 200`]],
    ],
    note: 'En moyenne, une œuvre a mis neuf semaines pour passer des réserves à son mur.',
  },
  rehang: {
    name: 'Ancien et nouvel accrochage',
    kicker: 'Pourquoi réaccrocher',
    title: 'Deux façons d’accrocher une collection',
    before: [
      'Jusqu’en 2025',
      'Par ordre chronologique',
      'Douze salles chargées, dans l’ordre des dates, et l’essentiel de l’art moderne en réserve.',
    ],
    after: [
      'Dès 2027',
      'Des œuvres en dialogue',
      'Vingt-deux salles où œuvres anciennes et récentes se côtoient, chacune avec de l’espace.',
    ],
  },
  onView: {
    name: 'Œuvres exposées',
    kicker: 'Œuvres exposées',
    title: 'Davantage de la collection, de chaque époque',
    source: 'Œuvres exposées par période de création, avant la fermeture et dès avril 2027.',
    series: ['Jusqu’en 2025', 'Dès 2027'],
    periods: ['Avant 1800', '1800–1900', '1900–1960', '1960–2000', 'Depuis 2000'],
    figures: [
      ['×2,3', 'le nombre d’œuvres exposées, par rapport à avant la fermeture.'],
      [`41${N}%`, `des œuvres exposées ont été créées après 1960, contre 19${N}% auparavant.`],
    ],
  },
  rooms: {
    name: 'Les salles',
    kicker: 'Les salles',
    title: 'Cinq des vingt-deux salles',
    note: 'Éclairement en lux, réglé selon les œuvres de chaque salle.',
    header: ['Salle', 'Thème', 'Œuvres', 'Niveau', 'Lumière, lux'],
    rows: [
      ['1', 'Les peintres du port', '64', 'Rez-de-chaussée', '200'],
      ['7', 'La grande galerie', '48', 'Rez-de-chaussée', '200'],
      ['12', 'Œuvres sur papier', '92', '1er étage', '50'],
      ['16', 'La cour des sculptures', '21', '1er étage', 'Lumière du jour'],
      ['22', 'Nouvelles acquisitions', '86', '2e étage', '150'],
    ],
  },
  team: {
    name: 'L’équipe',
    kicker: 'L’équipe du réaccrochage',
    title: 'Celles et ceux qui ont réaccroché la collection',
    people: [
      ['Conservation', 'Amara Okafor', 'Conservatrice en chef, a tracé le parcours de l’aile'],
      ['Restauration', 'Tomás Herrera', 'Chef restaurateur, a traité les 312 œuvres'],
      ['Arts graphiques', 'Hana Kobayashi', 'Conservatrice, a réglé la lumière de chaque dessin'],
      ['Médiation', 'Eitan Levi', 'Responsable des publics, a créé l’atelier ouvert'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['À très vite dans', 'la nouvelle aile'],
    lines: [
      'Ouverture le mercredi 14 avril 2027',
      `Tous les jours de 10${N}h à 18${N}h, le jeudi jusqu’à 22${N}h`,
      'Entrée gratuite le week-end d’ouverture',
    ],
    meta: 'Musée d’art Vellin · 3, rue du Port',
  },
};
