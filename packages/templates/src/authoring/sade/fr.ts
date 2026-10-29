import type { SadeCopy } from './copy';

export const fr: SadeCopy = {
  footer: 'Commonfield · Rapport de récolte 2026',
  hero: {
    name: 'Ouverture',
    org: 'Commonfield · Coopérative agricole',
    title: ['Sols vivants,', 'silos pleins'],
    subtitle: ['Comment 212 fermes familiales ont produit', 'plus de grain avec moins d’eau'],
    meta: 'Assemblée des membres · 14 janvier 2027',
  },
  section: {
    name: 'La saison',
    part: 'Première partie',
    title: ['La saison', 'aux champs'],
    subtitle: 'De la première pluie au dernier chargement versé au silo.',
  },
  agenda: {
    name: 'Ordre du jour',
    title: 'Au programme de cette matinée',
    intro:
      'Quarante minutes sur la récolte 2026\u00a0: ce que nous avons cultivé, l’eau qu’il a fallu et ce que le sol nous a appris. Puis le plan de la saison 2027, et du temps pour vos questions.',
    items: [
      ['La récolte\u00a0: ', '18\u00a0400 tonnes de grain de 212 fermes, et leur destination.'],
      ['L’eau\u00a0: ', 'comment goutte-à-goutte et couverts végétaux ont réduit l’eau par tonne.'],
      ['Le sol\u00a0: ', 'ce que trois ans d’analyses révèlent sous nos champs.'],
      ['La saison 2027\u00a0: ', 'la banque de semences, les machines partagées et le calendrier.'],
    ],
  },
  figures: {
    name: 'La récolte en chiffres',
    kicker: 'La récolte en chiffres',
    title: '2026 en quatre chiffres',
    hero: {
      value: '18\u00a0400',
      label: 'tonnes de grain récoltées',
      note: '12\u00a0% de plus qu’en 2025, sur les mêmes 9\u00a0600 hectares et avec moins d’eau.',
    },
    others: [
      ['212', 'fermes familiales associées'],
      ['9\u00a0600', 'hectares cultivés'],
      ['31\u00a0%', 'd’eau en moins par tonne qu’en 2023'],
    ],
  },
  project: {
    name: 'Projet de l’année',
    kicker: 'Projet de l’année · Goutte-à-goutte',
    title: 'L’eau à la racine, pas au sillon',
    items: [
      [
        'Une ligne par rang',
        'Des lignes enterrées sur 1\u00a0400 hectares arrosent chaque rang à la racine, la nuit, quand l’eau se perd peu.',
      ],
      [
        'Des sondes dans le sol',
        'Des sondes d’humidité à 30 et 60\u00a0cm disent aux pompes quand arroser, et quand attendre.',
      ],
      [
        'Remboursé en trois saisons',
        'Pompes partagées et tuyaux achetés en gros divisent par deux le coût de chaque ferme\u00a0; l’eau économisée paie le reste.',
      ],
    ],
  },
  fields: {
    name: 'Vu d’en haut',
    place: 'Les champs du nord, vus du drone',
    title: ['Chaque champ,', 'chaque semaine, d’en haut'],
    body: 'Notre drone cartographie les 9\u00a0600 hectares chaque semaine\u00a0: l’agronome repère une zone sèche avant qu’on la voie depuis la route.',
  },
  quote: {
    name: 'La parole d’un membre',
    text: 'Mon grand-père labourait ce champ chaque automne. Nous avons arrêté, et la terre garde la pluie plus longtemps que jamais.',
    who: 'Omar Khalil',
    role: 'Cultive du blé dur sur 80 hectares, membre depuis 1998',
  },
  programmes: {
    name: 'Programmes',
    kicker: 'Trois programmes',
    title: 'Ce que nous faisons ensemble',
    cards: [
      [
        'Programme 01',
        'Couverts végétaux',
        'Vesce et trèfle entre deux récoltes nourrissent le sol et l’empêchent de s’envoler.',
      ],
      [
        'Programme 02',
        'Goutte-à-goutte',
        'Pompes partagées, tuyaux achetés en gros et une équipe qui installe une ferme entière en une semaine.',
      ],
      [
        'Programme 03',
        'Banque de semences',
        'Quarante variétés locales, testées sur nos parcelles d’essai et prêtées aux membres à chaque semis.',
      ],
    ],
    note: 'Chaque ferme membre peut rejoindre n’importe quel programme\u00a0; la coopérative paie la première saison.',
  },
  season: {
    name: 'La saison à venir',
    kicker: 'La saison 2027',
    title: 'L’année à venir, saison par saison',
    stops: [
      ['Hiver', 'La banque de semences ouvre', 'Les membres réservent leurs variétés de semis.'],
      ['Printemps', 'Goutte-à-goutte, phase deux', 'Soixante fermes de plus rejoignent les pompes.'],
      ['Été', 'Moisson', 'Les moissonneuses partagées suivent un seul calendrier de réservation.'],
      ['Automne', 'Semis', 'Les couverts laissent la place au blé et aux pois chiches.'],
    ],
    note: 'Chaque date est fixée avec les membres au début de chaque saison.',
  },
  joining: {
    name: 'La conversion',
    kicker: 'Passer à la nouvelle méthode',
    title: 'Convertir une ferme en cinq étapes',
    steps: [
      ['Analyse du sol', 'Dans chaque champ'],
      ['Plan de culture', 'Établi avec un agronome'],
      ['Couvert végétal', 'Semé après la récolte'],
      ['Goutte-à-goutte', 'Posé par l’équipe commune'],
      ['Première récolte', 'Pesée et comparée'],
    ],
    note: 'De la première analyse de sol à la première récolte selon le nouveau plan, il faut environ quatorze mois.',
  },
  soil: {
    name: 'Sous nos champs',
    kicker: 'Pourquoi nous avons cessé de labourer',
    title: 'Un même sol, deux façons de cultiver',
    before: [
      'Jusqu’en 2023',
      'Labouré chaque automne',
      'Une semelle dure s’était formée à 25\u00a0cm. La pluie ruisselait sur le sol nu, et les racines butaient sur elle.',
    ],
    after: [
      'Depuis 2024',
      'Sans labour, avec couverts',
      'Les racines descendent à 90\u00a0cm, les vers de terre sont revenus. Le même sol boit deux fois plus de pluie.',
    ],
  },
  water: {
    name: 'L’eau',
    kicker: 'L’eau',
    title: 'Moins d’eau pour chaque tonne',
    source: 'Mètres cubes d’eau d’irrigation par tonne de grain, 2023–2026.',
    series: ['Fermes Commonfield', 'Moyenne régionale'],
    figures: [
      ['31\u00a0%', 'd’eau en moins par tonne depuis 2023, sur les 212 fermes.'],
      ['359', 'mètres cubes par tonne en 2026\u00a0; la région en utilise encore 524.'],
    ],
  },
  crops: {
    name: 'Les cultures',
    kicker: 'Les cultures',
    title: 'Cinq cultures de la récolte 2026',
    note: 'Chiffres 2026, issus du pont-bascule et des relevés de terrain de la coopérative.',
    header: ['Culture', 'Hectares', 'Tonnes', 'Tonnes par hectare', 'Eau, m³ par tonne'],
    rows: [
      ['Blé dur', '4\u00a0200', '9\u00a0240', '2,2', '340'],
      ['Orge', '2\u00a0100', '4\u00a0410', '2,1', '300'],
      ['Pois chiches', '1\u00a0600', '2\u00a0240', '1,4', '410'],
      ['Lentilles', '900', '1\u00a0080', '1,2', '380'],
      ['Tournesol', '800', '1\u00a0430', '1,8', '570'],
    ],
  },
  team: {
    name: 'L’équipe',
    kicker: 'L’équipe de la coopérative',
    title: 'Les visages de la récolte',
    people: [
      ['Présidente du conseil', 'Nadia Haddad', 'Cultive blé et pois chiches sur 64 hectares'],
      ['Agronome en chef', 'Tomás Ferreira', 'Dirige le laboratoire des sols et les relevés par drone'],
      ['Ingénieur hydraulique', 'Kwame Asante', 'A conçu le réseau commun de goutte-à-goutte'],
      ['Gardienne des semences', 'Mei Lin', 'Essaie quarante variétés locales sur nos parcelles'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['À bientôt', 'aux champs'],
    lines: [
      'Journée aux parcelles d’essai\u00a0: 22 avril 2027',
      'Réservations de semences dès le 1er février 2027',
      'Le rapport complet est dans chaque ferme membre',
    ],
    meta: 'Commonfield · Coopérative agricole',
  },
};
