import type { TeferCopy } from './copy';

export const de: TeferCopy = {
  footer: 'Ourela · Herbst/Winter 2027',
  hero: {
    name: 'Eröffnung',
    org: 'Ourela · Mäntel aus Porto',
    title: ['Mäntel,', 'die bleiben'],
    subtitle: ['Vierundzwanzig Mäntel aus Stoff, den die Webereien nicht verkaufen konnten'],
    meta: 'Präsentation für Einkäufer · Paris · 4. März 2027',
  },
  section: {
    name: 'Der Stoff',
    part: 'Teil eins',
    title: ['Der Stoff'],
    subtitle: 'Woher jeder Meter der Kollektion kommt.',
  },
  agenda: {
    name: 'Tagesordnung',
    title: 'Was heute Morgen auf dem Tisch liegt',
    intro:
      'Vierzig Minuten über eine Kollektion von vierundzwanzig Mänteln: woher ihr Stoff kommt, wie wir ihn so zuschneiden, dass fast nichts auf dem Boden bleibt, und wie Sie sie für den Herbst bestellen. Danach die Mäntel selbst, am Ständer.',
    items: [
      ['Der Stoff: ', '1.840 Meter aus drei Webereien, und warum 86\u00a0% davon Restbestände waren.'],
      ['Der Zuschnitt: ', 'Schnitte, die 3\u00a0% des Stoffs auf dem Boden lassen, nicht 15\u00a0%.'],
      ['Das Atelier: ', 'einunddreißig Stunden Handarbeit in jedem Mantel, in Porto.'],
      ['Bestellungen: ', 'wie Sie für September bestellen, und was wir weiter nach Maß fertigen.'],
    ],
  },
  cloth: {
    name: 'Der Stoff in Zahlen',
    kicker: 'Der Stoff in Zahlen',
    title: 'Eine Kollektion aus Restbeständen',
    hero: {
      value: '86\u00a0%',
      label: 'der Wolle sind Restbestände',
      note: '1.582 von 1.840 Metern stammen aus den unverkauften Lagern dreier Webereien.',
    },
    others: [
      ['24', 'Mäntel in der Kollektion'],
      ['3', 'Webereien: Biella, Huddersfield und Bursa'],
      ['31', 'Stunden Handarbeit in jedem Mantel'],
    ],
  },
  cutting: {
    name: 'Der Zuschnitt',
    kicker: 'Zuschnitt ohne Verschnitt',
    title: 'Wie ein Mantel zugeschnitten wird',
    items: [
      [
        'Teile, die ineinandergreifen',
        'Jeder Schnitt ist so angelegt, dass seine Teile wie ein Puzzle über den Stoff passen.',
      ],
      ['Reste mit Aufgabe', 'Was übrig bleibt, wird zu Taschen, Besätzen und Unterkragen.'],
      ['Ein Schneider, ein Mantel', 'Jeder Mantel wird von denselben Händen zugeschnitten und genäht.'],
    ],
  },
  workroom: {
    name: 'Die Werkstatt',
    place: 'Die Werkstatt · Porto',
    title: ['Genäht, wo', 'zugeschnitten wird'],
    body: 'Zwölf Schneider, ein langer Tisch und das Nordlicht einer alten Baumwollspinnerei.',
  },
  quote: {
    name: 'Aus dem Atelier',
    text: 'Ein Mantel wird auf dem Zuschneidetisch fertig, lange bevor ihn jemand auf dem Laufsteg trägt.',
    who: 'Inês Moreira',
    role: 'Leiterin des Ateliers, Ourela',
  },
  cloths: {
    name: 'Drei Stoffe',
    kicker: 'Drei Stoffe',
    title: 'Die Stoffe der Saison',
    cards: [
      [
        'Stoff 01 · Huddersfield',
        'Fischgrat-Tweed',
        'Schwere Wolle in Granatrot, gewebt für einen Auftrag, der nie abgeholt wurde.',
      ],
      [
        'Stoff 02 · Biella',
        'Bouclé',
        'Schlingengarn vom Ende einer Partie, weich genug für einen Mantel ohne Futter.',
      ],
      [
        'Stoff 03 · Bursa',
        'Melton',
        'Ein dichter, gewalkter Loden-Köper, der den Regen abhält und keinen Saum braucht.',
      ],
    ],
    note: 'Jeder Mantel nennt auf dem Etikett im Kragen seine Weberei und seinen Stoffballen.',
  },
  season: {
    name: 'Die Saison',
    kicker: 'Die Saison',
    title: 'Von der Weberei bis in den Laden',
    stops: [
      ['Jan. 2027', 'Stoff gewählt', '1.582 Meter Restbestände aus drei Webereien.'],
      ['März 2027', 'Bestellstart', 'Vierundzwanzig Mäntel, gezeigt vor Einkäufern in Paris.'],
      ['Juni 2027', 'Zuschnitt beginnt', 'Jede Bestellung, von Hand zugeschnitten in Porto.'],
      ['Sept. 2027', 'In den Läden', 'Mäntel geliefert an 40 Läden in 11 Ländern.'],
    ],
    note: 'Bestellungen bis zum 30. April 2027 werden in der ersten Septemberwoche geliefert.',
  },
  making: {
    name: 'Die Fertigung',
    kicker: 'Wie ein Mantel entsteht',
    title: 'Einunddreißig Stunden, fünf Schritte',
    steps: [
      ['1 Std.', 'Messen', 'Von Hand genommen: zweiundzwanzig Maße'],
      ['5 Std.', 'Zeichnen', 'Ein Schnitt, passend zum Stoff'],
      ['3 Std.', 'Zuschneiden', 'Schere, Kreide und ein langer Tisch'],
      ['17 Std.', 'Nähen', 'Einlage, Nähte und eingesetzte Ärmel'],
      ['5 Std.', 'Vollenden', 'Knopflöcher, von Hand gearbeitet'],
    ],
    note: 'Vom ersten Maß bis zum letzten Knopfloch braucht ein Mantel einunddreißig Stunden.',
  },
  cut: {
    name: 'Der übliche Zuschnitt und unserer',
    kicker: 'Warum ohne Verschnitt',
    title: 'Der übliche Zuschnitt und unserer',
    before: [
      'Der übliche Zuschnitt',
      '15\u00a0% auf dem Boden',
      'Die Teile werden einzeln aufgelegt, und die Lücken dazwischen am Ende des Tages weggekehrt.',
    ],
    after: [
      'Der Ourela-Zuschnitt',
      'Unter 3\u00a0% Rest',
      'Teile, die über den Stoff ineinandergreifen, und jeder Rest wird in den Mantel zurückgenäht.',
    ],
  },
  waste: {
    name: 'Verschnitt',
    kicker: 'Verschnitt pro Mantel',
    title: 'Jede Saison weniger Stoff am Boden',
    source: 'Stoffrest pro Mantel in Prozent, Kollektionen Herbst/Winter 2023–2026.',
    series: ['Üblicher Zuschnitt', 'Ourela'],
    figures: [
      ['3\u00a0%', 'des Stoffs blieben 2026 übrig, 2023 waren es noch 12\u00a0%.'],
      ['0,36\u00a0m', 'weniger Stoff pro Mantel als beim üblichen Zuschnitt.'],
    ],
  },
  mills: {
    name: 'Die Webereien',
    kicker: 'Die Webereien',
    title: 'Fünf Stoffe, drei Webereien',
    note: 'Stoff für die Kollektion Herbst/Winter 2027, gekauft im Januar 2027.',
    header: ['Stoff', 'Weberei', 'Meter', 'Restbestand', 'Mäntel'],
    rows: [
      ['Fischgrat-Tweed', 'Huddersfield', '520', '100\u00a0%', '7'],
      ['Bouclé', 'Biella', '380', '100\u00a0%', '5'],
      ['Melton', 'Bursa', '460', '70\u00a0%', '6'],
      ['Flanell', 'Biella', '220', '100\u00a0%', '4'],
      ['Kamelhaar', 'Huddersfield', '260', '54\u00a0%', '2'],
    ],
  },
  team: {
    name: 'Das Atelier',
    kicker: 'Das Atelier',
    title: 'Die Hände hinter der Kollektion',
    people: [
      ['Atelier', 'Inês Moreira', 'Ateliersleiterin, schneidet jedes neue Modell als Erste'],
      ['Design', 'Aiko Mori', 'Designerin, zeichnet jeden Schnitt für seinen Stoff'],
      ['Schnitt', 'Kofi Asante', 'Zuschneider, legt die Teile dicht an dicht auf den Stoff'],
      ['Stoff', 'Omar Khalil', 'Stoffeinkäufer, kennt die Lager jeder Weberei'],
    ],
  },
  closing: {
    name: 'Abschluss',
    kicker: 'Vielen Dank',
    title: ['Wir sehen uns', 'bei der Anprobe'],
    lines: [
      'Bestellungen bis zum 30. April 2027',
      'Showroom in Porto, nach Vereinbarung',
      'Jeder Mantel hängt zur Anprobe bereit',
    ],
    meta: 'Ourela · Mäntel aus Restwolle',
  },
};
