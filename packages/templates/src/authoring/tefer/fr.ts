import type { TeferCopy } from './copy';

export const fr: TeferCopy = {
  footer: 'Ourela · Automne-Hiver 2027',
  hero: {
    name: 'Ouverture',
    org: 'Ourela · Manteaux faits à Porto',
    title: ['Des manteaux', 'qui durent'],
    subtitle: ['Vingt-quatre manteaux taillés dans des étoffes que les tissages n’ont pas pu vendre'],
    meta: 'Présentation aux acheteurs · Paris · 4 mars 2027',
  },
  section: {
    name: 'L’étoffe',
    part: 'Première partie',
    title: ['L’étoffe'],
    subtitle: 'D’où vient chaque mètre de la collection.',
  },
  agenda: {
    name: 'Ordre du jour',
    title: 'Sur la table ce matin',
    intro:
      'Quarante minutes sur une collection de vingt-quatre manteaux\u00a0: d’où vient son étoffe, comment nous la coupons pour qu’il ne reste presque rien au sol, et comment la commander pour l’automne. Puis les manteaux eux-mêmes, sur le portant.',
    items: [
      ['L’étoffe\u00a0: ', '1\u00a0840 mètres venus de trois tissages, et pourquoi 86\u00a0% étaient des invendus.'],
      ['La coupe\u00a0: ', 'des patrons qui laissent 3\u00a0% de l’étoffe au sol, et non 15\u00a0%.'],
      ['L’atelier\u00a0: ', 'trente et une heures de travail à la main dans chaque manteau, à Porto.'],
      ['Les commandes\u00a0: ', 'comment commander pour septembre, et ce que nous faisons encore sur mesure.'],
    ],
  },
  cloth: {
    name: 'L’étoffe en chiffres',
    kicker: 'L’étoffe en chiffres',
    title: 'Une collection taillée dans les invendus',
    hero: {
      value: '86\u00a0%',
      label: 'de la laine vient d’invendus',
      note: '1\u00a0582 des 1\u00a0840 mètres viennent des réserves invendues de trois tissages.',
    },
    others: [
      ['24', 'manteaux dans la collection'],
      ['3', 'tissages\u00a0: Biella, Huddersfield et Bursa'],
      ['31', 'heures de travail à la main par manteau'],
    ],
  },
  cutting: {
    name: 'La coupe',
    kicker: 'La coupe zéro déchet',
    title: 'Comment se coupe un manteau',
    items: [
      [
        'Des pièces qui s’emboîtent',
        'Chaque patron est tracé pour que ses pièces s’emboîtent sur l’étoffe comme un puzzle.',
      ],
      ['Des chutes utiles', 'Ce qui reste devient poches, parementures et dessous de col.'],
      ['Un tailleur, un manteau', 'Chaque manteau est coupé et cousu par les mêmes mains.'],
    ],
  },
  workroom: {
    name: 'L’atelier',
    place: 'L’atelier · Porto',
    title: ['Cousu là où', 'il est coupé'],
    body: 'Douze tailleurs, une longue table et la lumière du nord d’une ancienne filature de coton.',
  },
  quote: {
    name: 'Paroles d’atelier',
    text: 'Un manteau s’achève sur la table de coupe, bien avant que quiconque le porte sur un podium.',
    who: 'Inês Moreira',
    role: 'Première d’atelier, Ourela',
  },
  cloths: {
    name: 'Trois étoffes',
    kicker: 'Trois étoffes',
    title: 'Les étoffes de la saison',
    cards: [
      [
        'Étoffe 01 · Huddersfield',
        'Tweed chevron',
        'Laine lourde grenat, tissée pour une commande jamais retirée.',
      ],
      [
        'Étoffe 02 · Biella',
        'Bouclé',
        'Fil bouclé de fin de série, doux pour un manteau non doublé.',
      ],
      [
        'Étoffe 03 · Bursa',
        'Melton',
        'Un sergé loden dense et feutré, qui arrête la pluie et se passe d’ourlet.',
      ],
    ],
    note: 'Chaque manteau porte le nom de son tissage et de sa pièce sur l’étiquette du col.',
  },
  season: {
    name: 'La saison',
    kicker: 'La saison',
    title: 'Du tissage à la boutique',
    stops: [
      ['Janv. 2027', 'L’étoffe choisie', 'Nous achetons 1\u00a0582 mètres de surplus à trois tissages.'],
      ['Mars 2027', 'Ouverture des commandes', 'Vingt-quatre manteaux devant les acheteurs, à Paris.'],
      ['Juin 2027', 'Début de la coupe', 'Chaque commande coupée à la main, à Porto.'],
      ['Sept. 2027', 'En boutique', 'Manteaux livrés dans 40 boutiques de 11 pays.'],
    ],
    note: 'Les commandes passées avant le 30 avril 2027 sont livrées la première semaine de septembre.',
  },
  making: {
    name: 'La confection',
    kicker: 'La confection d’un manteau',
    title: 'Trente et une heures, cinq étapes',
    steps: [
      ['1\u00a0h', 'Mesurer', 'Vingt-deux mesures, prises à la main'],
      ['5\u00a0h', 'Tracer', 'Un patron tracé selon l’étoffe'],
      ['3\u00a0h', 'Couper', 'Ciseaux, craie et une longue table'],
      ['17\u00a0h', 'Coudre', 'Entoilage, coutures et manches montées'],
      ['5\u00a0h', 'Finir', 'Boutonnières faites à la main'],
    ],
    note: 'De la première mesure à la dernière boutonnière, un manteau demande trente et une heures.',
  },
  cut: {
    name: 'La coupe habituelle, et la nôtre',
    kicker: 'Pourquoi zéro déchet',
    title: 'La coupe habituelle, et la nôtre',
    before: [
      'La coupe habituelle',
      '15\u00a0% au sol',
      'Les pièces posées une à une, et les espaces entre elles balayés en fin de journée.',
    ],
    after: [
      'La coupe Ourela',
      'Moins de 3\u00a0% de chutes',
      'Des pièces qui s’emboîtent sur l’étoffe, et chaque chute recousue dans le manteau.',
    ],
  },
  waste: {
    name: 'Les chutes',
    kicker: 'Chutes par manteau',
    title: 'Moins d’étoffe au sol à chaque saison',
    source: 'Étoffe restante par manteau, en %, collections Automne-Hiver 2023–2026.',
    series: ['Coupe habituelle', 'Ourela'],
    figures: [
      ['3\u00a0%', 'd’étoffe perdue par manteau en 2026, contre 12\u00a0% en 2023.'],
      ['0,36\u00a0m', 'd’étoffe économisés par manteau par rapport à la coupe habituelle.'],
    ],
  },
  mills: {
    name: 'Les tissages',
    kicker: 'Les tissages',
    title: 'Cinq étoffes, trois tissages',
    note: 'Étoffes achetées en janvier 2027 pour la collection Automne-Hiver 2027.',
    header: ['Étoffe', 'Tissage', 'Mètres', 'Invendus', 'Manteaux'],
    rows: [
      ['Tweed chevron', 'Huddersfield', '520', '100\u00a0%', '7'],
      ['Bouclé', 'Biella', '380', '100\u00a0%', '5'],
      ['Melton', 'Bursa', '460', '70\u00a0%', '6'],
      ['Flanelle', 'Biella', '220', '100\u00a0%', '4'],
      ['Poil de chameau', 'Huddersfield', '260', '54\u00a0%', '2'],
    ],
  },
  team: {
    name: 'L’atelier',
    kicker: 'L’atelier',
    title: 'Les mains derrière la collection',
    people: [
      ['Atelier', 'Inês Moreira', 'Première d’atelier, coupe le prototype de chaque patron'],
      ['Création', 'Aiko Mori', 'Styliste, trace chaque patron selon son étoffe'],
      ['Patronage', 'Kofi Asante', 'Patronnier, emboîte les pièces sur l’étoffe'],
      ['Étoffes', 'Omar Khalil', 'Acheteur d’étoffes, connaît les stocks de chaque tissage'],
    ],
  },
  closing: {
    name: 'Clôture',
    kicker: 'Merci',
    title: ['À bientôt', 'pour l’essayage'],
    lines: [
      'Commandes jusqu’au 30 avril 2027',
      'Le showroom de Porto, sur rendez-vous',
      'Les manteaux à essayer, sur le portant',
    ],
    meta: 'Ourela · Manteaux taillés dans des laines invendues',
  },
};
