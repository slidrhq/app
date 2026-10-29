import type { TeferCopy } from './copy';

export const en: TeferCopy = {
  footer: 'Ourela · Autumn–Winter 2027',
  hero: {
    name: 'Opening',
    org: 'Ourela · Coats made in Porto',
    title: ['Coats cut', 'to last'],
    subtitle: ['Twenty-four coats cut from cloth the mills could not sell'],
    meta: 'Buyers’ presentation · Paris · 4 March 2027',
  },
  section: {
    name: 'The cloth',
    part: 'Part one',
    title: ['The cloth'],
    subtitle: 'Where every metre of the collection comes from.',
  },
  agenda: {
    name: 'Agenda',
    title: 'On the table this morning',
    intro:
      'Forty minutes on a collection of twenty-four coats: where its cloth came from, how we cut it so that almost nothing is left on the floor, and how to order it for the autumn. Then the coats themselves, on the rail.',
    items: [
      ['The cloth: ', '1,840 metres from three mills, and why 86% of it was surplus.'],
      ['The cut: ', 'patterns that leave 3% of the cloth on the floor, not 15%.'],
      ['The atelier: ', 'thirty-one hours of handwork in every coat, in Porto.'],
      ['Orders: ', 'how to order for September, and what we still make to measure.'],
    ],
  },
  cloth: {
    name: 'The cloth in figures',
    kicker: 'The cloth in figures',
    title: 'A collection cut from surplus',
    hero: {
      value: '86%',
      label: 'of the wool is deadstock',
      note: '1,582 of 1,840 metres came from the unsold stores of three mills.',
    },
    others: [
      ['24', 'coats in the collection'],
      ['3', 'mills: Biella, Huddersfield and Bursa'],
      ['31', 'hours of handwork in every coat'],
    ],
  },
  cutting: {
    name: 'The cut',
    kicker: 'Zero-waste cutting',
    title: 'How a coat is cut',
    items: [
      [
        'Pieces that interlock',
        'Each pattern is drafted so that its pieces fit across the cloth like a puzzle.',
      ],
      ['Offcuts with a job', 'What is left becomes pockets, facings and the under-collar.'],
      ['One tailor, one coat', 'Every coat is cut and sewn by the same pair of hands.'],
    ],
  },
  workroom: {
    name: 'The workroom',
    place: 'The workroom · Porto',
    title: ['Made where', 'it is cut'],
    body: 'Twelve tailors, one long table and the north light of an old cotton mill.',
  },
  quote: {
    name: 'From the atelier',
    text: 'A coat is finished on the cutting table, long before anyone wears it on a runway.',
    who: 'Inês Moreira',
    role: 'Head of atelier, Ourela',
  },
  cloths: {
    name: 'Three cloths',
    kicker: 'Three cloths',
    title: 'The cloths of the season',
    cards: [
      [
        'Cloth 01 · Huddersfield',
        'Herringbone tweed',
        'A heavy garnet wool, woven for an order that was never collected.',
      ],
      [
        'Cloth 02 · Biella',
        'Bouclé',
        'Looped yarn from the end of a run, soft enough for an unlined coat.',
      ],
      [
        'Cloth 03 · Bursa',
        'Melton',
        'A dense, felted loden twill that keeps the rain out and needs no hem.',
      ],
    ],
    note: 'Every coat names its mill and its bolt on the label inside the collar.',
  },
  season: {
    name: 'The season',
    kicker: 'The season',
    title: 'From the mill to the shop floor',
    stops: [
      ['Jan 2027', 'Cloth chosen', 'We buy 1,582 metres of surplus from three mills.'],
      ['Mar 2027', 'Orders open', 'Twenty-four coats shown to buyers in Paris.'],
      ['Jun 2027', 'Cutting starts', 'Every order cut by hand in the Porto workroom.'],
      ['Sep 2027', 'In the shops', 'Coats delivered to 40 shops in 11 countries.'],
    ],
    note: 'Orders placed by 30 April 2027 are delivered in the first week of September.',
  },
  making: {
    name: 'The making',
    kicker: 'The making of a coat',
    title: 'Thirty-one hours, in five steps',
    steps: [
      ['1 h', 'Measure', 'Twenty-two measures, by hand'],
      ['5 h', 'Draft', 'A pattern drawn to fit the cloth'],
      ['3 h', 'Cut', 'Shears, chalk and one long table'],
      ['17 h', 'Sew', 'Canvas, seams and set-in sleeves'],
      ['5 h', 'Finish', 'Buttonholes worked by hand'],
    ],
    note: 'From the first measure to the last buttonhole, one coat takes thirty-one hours.',
  },
  cut: {
    name: 'The usual cut, and ours',
    kicker: 'Why zero waste',
    title: 'The usual cut, and ours',
    before: [
      'The usual cut',
      '15% on the floor',
      'Pieces laid out one by one, and the gaps between them swept away at the end of the day.',
    ],
    after: [
      'The Ourela cut',
      'Under 3% left over',
      'Pieces that interlock across the cloth, and every offcut sewn back into the coat.',
    ],
  },
  waste: {
    name: 'Waste',
    kicker: 'Waste per coat',
    title: 'Less cloth on the floor every season',
    source: 'Cloth left over per coat, in percent, Autumn–Winter collections 2023–2026.',
    series: ['Usual cut', 'Ourela'],
    figures: [
      ['3%', 'of a coat’s cloth left over in 2026, down from 12% in 2023.'],
      ['0.36 m', 'of cloth saved on every coat against the usual cut.'],
    ],
  },
  mills: {
    name: 'The mills',
    kicker: 'The mills',
    title: 'Five cloths, three mills',
    note: 'Cloth bought for the Autumn–Winter 2027 collection in January 2027.',
    header: ['Cloth', 'Mill', 'Metres', 'Deadstock', 'Coats'],
    rows: [
      ['Herringbone tweed', 'Huddersfield', '520', '100%', '7'],
      ['Bouclé', 'Biella', '380', '100%', '5'],
      ['Melton', 'Bursa', '460', '70%', '6'],
      ['Flannel', 'Biella', '220', '100%', '4'],
      ['Camel hair', 'Huddersfield', '260', '54%', '2'],
    ],
  },
  team: {
    name: 'The atelier',
    kicker: 'The atelier',
    title: 'The hands behind the collection',
    people: [
      ['Atelier', 'Inês Moreira', 'Head of atelier, cuts the first coat of every pattern'],
      ['Design', 'Aiko Mori', 'Designer, drafts every pattern to fit its cloth'],
      ['Pattern', 'Kofi Asante', 'Pattern cutter, nests the pieces on the cloth'],
      ['Cloth', 'Omar Khalil', 'Cloth buyer, knows the stores of every mill'],
    ],
  },
  closing: {
    name: 'Closing',
    kicker: 'Thank you',
    title: ['See you', 'at the fitting'],
    lines: [
      'Orders open until 30 April 2027',
      'The Porto showroom, by appointment',
      'Every coat is on the rail, to try on',
    ],
    meta: 'Ourela · Coats cut from surplus wool',
  },
};
