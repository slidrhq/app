import type { RakiaCopy } from './copy';

export const en: RakiaCopy = {
  footer: 'Meridian Peak Observatory · First light 2027',
  hero: {
    name: 'Opening',
    org: 'Meridian Peak Observatory · First-light briefing',
    title: ['First', 'light'],
    subtitle: ['A 2.4-metre telescope opens its eye on the night sky'],
    meta: 'Meridian Peak · 2,410 metres · 12 March 2027',
  },
  section: {
    name: 'The telescope',
    part: 'Part one',
    title: ['The telescope'],
    subtitle: 'Twelve years from a sketch to a mirror.',
  },
  agenda: {
    name: 'Tonight',
    title: 'Tonight, in four parts',
    intro:
      'Forty minutes on the telescope that sees its first starlight this week, what it will observe in its first season, and how every partner university will share its nights. Then we open the dome.',
    items: [
      ['The telescope: ', 'twelve years from the first sketch to a polished 2.4-metre mirror.'],
      ['The site: ', 'why Meridian Peak is darker and steadier than anywhere we measured.'],
      ['The first season: ', 'three research programmes and the objects they observe first.'],
      ['Sharing the nights: ', 'how a partner asks for time, and how the public joins in.'],
    ],
  },
  figures: {
    name: 'In numbers',
    kicker: 'The telescope in numbers',
    title: 'Sixteen times the light',
    hero: {
      value: '16×',
      label: 'the light of our old 60-centimetre telescope',
      note: 'A mirror four times as wide gathers sixteen times the light: a faint galaxy takes minutes, not hours.',
    },
    others: [
      ['2.4 m', 'across the primary mirror'],
      ['2,410 m', 'above the sea, over the haze'],
      ['291', 'clear nights a year, on average'],
    ],
  },
  mirror: {
    name: 'The mirror',
    kicker: 'Inside the dome',
    title: 'A mirror polished for two years',
    items: [
      ['Cast in one piece', 'The glass cooled in its mould for three months, so that it would not crack.'],
      [
        'Polished to 18 nanometres',
        'Its surface strays from the perfect curve by less than a thousandth of a hair.',
      ],
      [
        'Silver, not aluminium',
        'A silver coating reflects more infrared light, where cool stars shine brightest.',
      ],
    ],
  },
  site: {
    name: 'The site',
    place: 'Meridian Peak, 2,410 metres',
    title: ['Darker than anywhere', 'we measured'],
    body: 'Five years of site tests found almost no city glow, and air steady enough for sharp stars on most nights.',
  },
  quote: {
    name: 'At first light',
    text: 'For twelve years we built a machine for one moment: the first starlight landing on its mirror.',
    who: 'Amara Okafor',
    role: 'Director, Meridian Peak Observatory',
  },
  programmes: {
    name: 'The first season',
    kicker: 'Three research programmes',
    title: 'What we look at first',
    cards: [
      [
        'Programme 01',
        'Other worlds',
        'Timing the faint dip in a star’s light as a planet crosses in front of it.',
      ],
      [
        'Programme 02',
        'Near-Earth asteroids',
        'Finding small asteroids early, and fixing their orbits within days.',
      ],
      [
        'Programme 03',
        'Pulsating stars',
        'Following stars that brighten and fade: the yardsticks of cosmic distance.',
      ],
    ],
    note: 'Each programme shares its nights with the partner universities, and its data with everyone after a year.',
  },
  milestones: {
    name: 'Milestones',
    kicker: 'From glass to starlight',
    title: 'Four years, four milestones',
    stops: [
      ['2024', 'The mirror is cast', 'The glass cools for three months before polishing begins.'],
      ['2025', 'The dome rises', 'A 14-metre dome goes up on the summit in a single season.'],
      ['2026', 'The optics arrive', 'The polished mirror climbs the mountain road at walking pace.'],
      ['2027', 'First light', 'The telescope takes its first image of the sky on 12 March.'],
    ],
    note: 'The mirror spent two of these four years on the polishing machine.',
  },
  nights: {
    name: 'Sharing the nights',
    kicker: 'How the nights are shared',
    title: 'From a question to an image, in five steps',
    steps: [
      ['Propose', 'A partner asks for nights'],
      ['Review', 'A panel ranks every request'],
      ['Schedule', 'Nights matched to the Moon'],
      ['Observe', 'The telescope runs till dawn'],
      ['Share', 'Data to the partner, then to all'],
    ],
    note: 'Requests open twice a year, and most approved programmes begin observing within six weeks.',
  },
  views: {
    name: 'Old and new',
    kicker: 'The same patch of sky',
    title: 'What sixteen times the light shows',
    before: [
      'Since 1998',
      'The 60-centimetre telescope',
      'A faint smudge of a galaxy and a few dozen stars, after an hour of exposure.',
    ],
    after: [
      'From 2027',
      'The 2.4-metre telescope',
      'The galaxy’s spiral arms and hundreds of stars, after four minutes.',
    ],
  },
  clear: {
    name: 'Clear nights',
    kicker: 'Five years of site tests',
    title: 'Clear nights, season by season',
    source: 'Nights clear for six hours or more, average of the site tests of 2022–2026.',
    seasons: ['Winter', 'Spring', 'Summer', 'Autumn'],
    series: ['Clear nights', 'Nights of sharp seeing'],
    figures: [
      ['291', 'clear nights a year: four nights in every five.'],
      ['0.7″', 'the typical blur of a star by the air, half that of our old site.'],
    ],
  },
  targets: {
    name: 'First targets',
    kicker: 'The first season',
    title: 'Five objects for the first nights',
    note: 'Nights scheduled from March to June 2027; distances rounded.',
    header: ['Object', 'Type', 'Light years', 'Nights', 'Programme'],
    rows: [
      ['Orion Nebula', 'Star-forming cloud', '1,350', '3', 'First light'],
      ['Beehive Cluster', 'Star cluster', '577', '5', 'Calibration'],
      ['Whirlpool Galaxy', 'Spiral galaxy', '23 million', '8', 'Public nights'],
      ['Delta Cephei', 'Pulsating star', '890', '10', 'Pulsating stars'],
      ['55 Cancri', 'Star with five planets', '41', '12', 'Other worlds'],
    ],
  },
  team: {
    name: 'The team',
    kicker: 'At the telescope',
    title: 'The people behind first light',
    people: [
      ['Direction', 'Amara Okafor', 'Director, led the project from its first sketch'],
      ['Optics', 'Tomás Arriaga', 'Optical engineer, guided two years of polishing'],
      ['Data', 'Hana Sato', 'Data scientist, turns each night into clean images'],
      ['Public nights', 'Yonatan Levi', 'Educator, brings schools and visitors up to the dome'],
    ],
  },
  closing: {
    name: 'Closing',
    kicker: 'Thank you',
    title: ['Clear', 'skies'],
    lines: [
      'Public first-light night: Saturday, 13 March 2027',
      'Meridian Peak visitor centre, from sunset',
      'Partners’ requests for nights open on 1 April 2027',
    ],
    meta: 'Meridian Peak Observatory · 2,410 metres above the sea',
  },
};
