import type { DofekCopy } from './copy';

export const en: DofekCopy = {
  footer: 'Coastal District Health · Briefing 2027',
  hero: {
    name: 'Opening',
    org: 'Coastal District Health · Public-health briefing',
    title: ['Four minutes to', 'restart a heart'],
    subtitle: ['How a district of 640,000 people learned', 'to act before the ambulance arrives'],
    meta: 'Briefing to the district council · 15 April 2027',
  },
  agenda: {
    name: 'Agenda',
    title: 'What we will cover today',
    intro:
      'Twenty minutes on what the programme has changed, what now happens on the street when a heart stops, and what we ask of the council for 2027. Then we will take your questions.',
    items: [
      ['The numbers: ', 'what changed for people whose heart stopped outside hospital.'],
      ['On the street: ', 'how neighbours, volunteers and defibrillators now work together.'],
      ['The people: ', 'the team that runs the programme, and the volunteers beside it.'],
      ['Next year: ', 'what we ask of the council, and by when.'],
    ],
  },
  section: {
    name: 'The first minutes',
    part: 'Part one',
    title: ['The first', 'minutes'],
    subtitle: 'Why the minutes before the ambulance arrives decide who goes home.',
  },
  figures: {
    name: 'The year in figures',
    kicker: 'The year in figures',
    title: '2026 in four numbers',
    hero: {
      value: '72',
      label: 'people went home after their heart stopped',
      note: 'Twice as many as in 2023, the year before the programme began.',
    },
    others: [
      ['6 min', 'to the first shock, down from 11'],
      ['920', 'public defibrillators on the map'],
      ['58,000', 'residents trained in CPR'],
    ],
  },
  change: {
    name: 'Before and since',
    kicker: 'What changed',
    title: 'From waiting to acting',
    before: [
      '2023',
      'Waiting for the ambulance',
      'Bystanders called and waited. Two patients in three had no CPR until paramedics arrived, eleven minutes later on average.',
    ],
    after: [
      '2026',
      'Acting in the first minutes',
      'Neighbours start CPR and a volunteer brings a defibrillator. The first shock comes at six minutes, not eleven.',
    ],
  },
  chain: {
    name: 'The chain of survival',
    kicker: 'The chain of survival',
    title: 'The first eight minutes, step by step',
    steps: [
      ['00:00', 'Call', 'The dispatcher stays on the line'],
      ['00:30', 'Alert', 'Volunteers within 500 metres'],
      ['01:00', 'Compress', 'CPR until help arrives'],
      ['04:00', 'Shock', 'The nearest public defibrillator'],
      ['08:00', 'Hand over', 'Paramedics take over'],
    ],
    note: 'Each call is reviewed within a week, together with its responders.',
  },
  responders: {
    name: 'Responders on call',
    kicker: 'Responders on call',
    title: 'Help from around the corner',
    items: [
      [
        'Alerted in seconds',
        'An app alerts trained volunteers within 500 metres of the call.',
      ],
      [
        'A defibrillator on its way',
        'A second volunteer fetches the nearest public defibrillator.',
      ],
      [
        'There before the siren',
        'In six calls out of ten, a volunteer reached the patient first.',
      ],
    ],
  },
  park: {
    name: 'In the park',
    place: 'Riverside Park, Coastal District',
    title: ['Two hours in the park,', 'a skill for life'],
    body: 'Once a month, residents of every age learn CPR together in the park. 58,000 have learned so far.',
  },
  quote: {
    name: 'A survivor’s words',
    text: 'My heart stopped at a bus stop. A\u00a0stranger kept it going with his hands until a neighbour ran up with a\u00a0defibrillator.',
    who: 'Elif Kaya',
    role: 'Music teacher from the Old Town, now a volunteer responder herself',
  },
  programmes: {
    name: 'Programmes',
    kicker: 'Three programmes',
    title: 'What the programme does',
    cards: [
      [
        'Programme 01',
        'CPR for everyone',
        'Two-hour classes in schools, workplaces and community halls, free.',
      ],
      [
        'Programme 02',
        'Responders on call',
        'Volunteers nearby are alerted the moment an ambulance is called.',
      ],
      [
        'Programme 03',
        'Defibrillators on every street',
        '920 public defibrillators, mapped and checked every month.',
      ],
    ],
    note: 'Run with the ambulance service, the schools and the councils.',
  },
  milestones: {
    name: 'Milestones',
    kicker: 'Milestones',
    title: 'Four years, four steps',
    stops: [
      ['2024', 'CPR in schools', 'Classes start in all 38 secondary schools.'],
      ['2025', 'Responders on call', 'The alert app goes live with 1,200 volunteers.'],
      ['2026', '920 defibrillators', 'Each one mapped and checked monthly.'],
      ['2027', 'From age ten', 'CPR lessons begin in every primary school.'],
    ],
    note: 'Chosen with survivors and ambulance crews.',
  },
  trend: {
    name: 'Results',
    kicker: 'Results',
    title: 'More CPR, more people going home',
    source:
      'Share of cardiac arrests outside hospital, in percent, 2023–2026. District cardiac arrest registry.',
    series: ['CPR before the ambulance', 'Went home from hospital'],
    figures: [
      ['67%', 'of patients had CPR from a bystander in 2026, up from 36%.'],
      ['16%', 'went home from hospital, twice the rate of 2023.'],
    ],
  },
  areas: {
    name: 'The five areas',
    kicker: 'The five areas',
    title: 'Where each area stands',
    note: 'Figures for 2026, from the district cardiac arrest registry, January 2027.',
    header: ['Area', 'Defibrillators', 'Residents trained', 'CPR before ambulance', 'First shock'],
    rows: [
      ['Harbour', '240', '16,200', '72%', '5 min'],
      ['Old Town', '210', '13,900', '70%', '5 min'],
      ['Northfields', '180', '11,400', '66%', '6 min'],
      ['Riverside', '170', '10,300', '63%', '7 min'],
      ['Hill villages', '120', '6,200', '58%', '9 min'],
    ],
  },
  team: {
    name: 'The team',
    kicker: 'The programme team',
    title: 'The people behind the four minutes',
    people: [
      ['Cardiology', 'Dr Amara Mensah', 'Cardiologist, clinical lead of the programme'],
      ['Ambulance service', 'Tomás Herrera', 'Chief paramedic, runs the dispatch centre'],
      ['Responders', 'Noa Katz', 'Nurse, trains and supports the volunteers'],
      ['Registry', 'Kenji Morita', 'Epidemiologist, keeps the cardiac arrest registry'],
    ],
  },
  closing: {
    name: 'Closing',
    kicker: 'Thank you',
    title: ['Every minute', 'counts'],
    lines: [
      'Free CPR classes every month in Riverside Park',
      'Next briefing: 14 October 2027, District Hall',
      'Become a responder at any district clinic',
    ],
    meta: 'Coastal District Health · The Four Minutes programme',
  },
};
