import type { RakiaCopy } from './copy';

export const de: RakiaCopy = {
  footer: 'Sternwarte Meridian Peak · Erstes Licht 2027',
  hero: {
    name: 'Eröffnung',
    org: 'Sternwarte Meridian Peak · Briefing zum ersten Licht',
    title: ['Erstes', 'Licht'],
    subtitle: ['Ein 2,4-Meter-Teleskop öffnet', 'sein Auge für den Nachthimmel'],
    meta: 'Meridian Peak · 2.410 Meter · 12. März 2027',
  },
  section: {
    name: 'Das Teleskop',
    part: 'Teil eins',
    title: ['Das Teleskop'],
    subtitle: 'Zwölf Jahre von der Skizze bis zum Spiegel.',
  },
  agenda: {
    name: 'Heute Abend',
    title: 'Heute Abend, in vier Teilen',
    intro:
      'Vierzig Minuten über das Teleskop, das diese Woche sein erstes Sternenlicht empfängt, über seine erste Beobachtungssaison und darüber, wie die Partneruniversitäten seine Nächte teilen. Danach öffnen wir die Kuppel.',
    items: [
      ['Das Teleskop: ', 'zwölf Jahre von der ersten Skizze bis zum polierten 2,4-Meter-Spiegel.'],
      ['Der Standort: ', 'warum kein gemessener Ort dunkler und ruhiger ist als Meridian Peak.'],
      ['Die erste Saison: ', 'drei Forschungsprogramme und die Objekte, die sie zuerst beobachten.'],
      ['Nächte teilen: ', 'wie Partner Beobachtungszeit beantragen und wie das Publikum dabei ist.'],
    ],
  },
  figures: {
    name: 'In Zahlen',
    kicker: 'Das Teleskop in Zahlen',
    title: 'Sechzehnmal so viel Licht',
    hero: {
      value: '16×',
      label: 'mehr Licht als unser altes 60-cm-Teleskop',
      note: 'Ein viermal so breiter Spiegel sammelt sechzehnmal so viel Licht: Eine schwache Galaxie braucht Minuten statt Stunden.',
    },
    others: [
      ['2,4 m', 'Durchmesser des Hauptspiegels'],
      ['2.410 m', 'über dem Meer, über dem Dunst'],
      ['291', 'klare Nächte im Jahr, im Mittel'],
    ],
  },
  mirror: {
    name: 'Der Spiegel',
    kicker: 'In der Kuppel',
    title: 'Ein Spiegel, zwei Jahre poliert',
    items: [
      ['In einem Stück gegossen', 'Das Glas kühlte drei Monate lang in seiner Form ab, damit es nicht reißt.'],
      [
        'Auf 18 Nanometer genau',
        'Seine Fläche weicht um weniger als ein Tausendstel Haar von der idealen Kurve ab.',
      ],
      [
        'Silber statt Aluminium',
        'Eine Silberschicht spiegelt mehr Infrarot, in dem kühle Sterne am hellsten leuchten.',
      ],
    ],
  },
  site: {
    name: 'Der Standort',
    place: 'Meridian Peak, 2.410 Meter',
    title: ['Dunkler als jeder Ort,', 'den wir gemessen haben'],
    body: 'Fünf Jahre Standorttests fanden kaum Licht von Städten und eine Luft, die in den meisten Nächten ruhig genug für scharfe Sterne ist.',
  },
  quote: {
    name: 'Beim ersten Licht',
    text: 'Zwölf Jahre lang haben wir eine Maschine für einen einzigen Moment gebaut: das erste Sternenlicht auf ihrem Spiegel.',
    who: 'Amara Okafor',
    role: 'Direktorin der Sternwarte Meridian Peak',
  },
  programmes: {
    name: 'Die erste Saison',
    kicker: 'Drei Forschungsprogramme',
    title: 'Was wir zuerst beobachten',
    cards: [
      [
        'Programm 01',
        'Andere Welten',
        'Den schwachen Lichtabfall eines Sterns timen, wenn ein Planet vor ihm vorüberzieht.',
      ],
      [
        'Programm 02',
        'Erdnahe Asteroiden',
        'Kleine Asteroiden früh entdecken und ihre Bahnen binnen Tagen bestimmen.',
      ],
      [
        'Programm 03',
        'Pulsierende Sterne',
        'Sterne verfolgen, die heller und schwächer werden: die Maßstäbe kosmischer Entfernungen.',
      ],
    ],
    note: 'Jedes Programm teilt seine Nächte mit den Partneruniversitäten und seine Daten nach einem Jahr mit allen.',
  },
  milestones: {
    name: 'Meilensteine',
    kicker: 'Vom Glas zum Sternenlicht',
    title: 'Vier Jahre, vier Meilensteine',
    stops: [
      ['2024', 'Der Spiegelguss', 'Das Glas kühlt drei Monate lang ab, bevor das Polieren beginnt.'],
      ['2025', 'Die Kuppel steht', 'Eine 14-Meter-Kuppel entsteht in einer einzigen Saison auf dem Gipfel.'],
      ['2026', 'Die Optik kommt', 'Der polierte Spiegel fährt im Schritttempo die Bergstraße hinauf.'],
      ['2027', 'Erstes Licht', 'Am 12. März nimmt das Teleskop sein erstes Bild des Himmels auf.'],
    ],
    note: 'Zwei dieser vier Jahre verbrachte der Spiegel auf der Poliermaschine.',
  },
  nights: {
    name: 'Nächte teilen',
    kicker: 'Wie die Nächte geteilt werden',
    title: 'Von der Frage zum Bild, in fünf Schritten',
    steps: [
      ['Antrag', 'Ein Partner beantragt Nächte'],
      ['Begutachtung', 'Ein Gremium reiht jeden Antrag'],
      ['Planung', 'Nächte passend zum Mond'],
      ['Beobachtung', 'Das Teleskop läuft bis zum Morgen'],
      ['Teilen', 'Daten an den Partner, dann an alle'],
    ],
    note: 'Anträge zweimal im Jahr; die meisten bewilligten Programme beobachten binnen sechs Wochen.',
  },
  views: {
    name: 'Alt und neu',
    kicker: 'Derselbe Ausschnitt des Himmels',
    title: 'Was sechzehnmal so viel Licht zeigt',
    before: [
      'Seit 1998',
      'Das 60-Zentimeter-Teleskop',
      'Nach einer Stunde Belichtung: ein schwacher Galaxienfleck und einige Dutzend Sterne.',
    ],
    after: [
      'Ab 2027',
      'Das 2,4-Meter-Teleskop',
      'Nach vier Minuten: die Spiralarme der Galaxie und Hunderte Sterne.',
    ],
  },
  clear: {
    name: 'Klare Nächte',
    kicker: 'Fünf Jahre Standorttests',
    title: 'Klare Nächte, Jahreszeit für Jahreszeit',
    source: 'Nächte mit mindestens sechs klaren Stunden, Mittel der Tests 2022–2026.',
    seasons: ['Winter', 'Frühling', 'Sommer', 'Herbst'],
    series: ['Klare Nächte', 'Nächte mit scharfem Seeing'],
    figures: [
      ['291', 'klare Nächte im Jahr: vier von fünf Nächten.'],
      ['0,7″', 'typische Unschärfe eines Sterns durch die Luft, halb so viel wie am alten Standort.'],
    ],
  },
  targets: {
    name: 'Erste Ziele',
    kicker: 'Die erste Saison',
    title: 'Fünf Objekte für die ersten Nächte',
    note: 'Nächte geplant von März bis Juni 2027; Entfernungen gerundet.',
    header: ['Objekt', 'Typ', 'Lichtjahre', 'Nächte', 'Programm'],
    rows: [
      ['Orionnebel', 'Sternentstehungsgebiet', '1.350', '3', 'Erstes Licht'],
      ['Praesepe', 'Sternhaufen', '577', '5', 'Kalibrierung'],
      ['Whirlpool-Galaxie', 'Spiralgalaxie', '23 Millionen', '8', 'Publikumsnächte'],
      ['Delta Cephei', 'Pulsierender Stern', '890', '10', 'Pulsierende Sterne'],
      ['55 Cancri', 'Stern mit fünf Planeten', '41', '12', 'Andere Welten'],
    ],
  },
  team: {
    name: 'Das Team',
    kicker: 'Am Teleskop',
    title: 'Die Menschen hinter dem ersten Licht',
    people: [
      ['Leitung', 'Amara Okafor', 'Direktorin, leitet das Projekt seit der ersten Skizze'],
      ['Optik', 'Tomás Arriaga', 'Optikingenieur, begleitete zwei Jahre Politur'],
      ['Daten', 'Hana Sato', 'Data Scientist, macht aus jeder Nacht klare Bilder'],
      ['Publikumsnächte', 'Yonatan Levi', 'Pädagoge, bringt Schulen und Gäste hinauf zur Kuppel'],
    ],
  },
  closing: {
    name: 'Abschluss',
    kicker: 'Vielen Dank',
    title: ['Klaren', 'Himmel'],
    lines: [
      'Publikumsnacht zum ersten Licht: Samstag, 13. März 2027',
      'Besucherzentrum Meridian Peak, ab Sonnenuntergang',
      'Anträge der Partner auf Nächte ab 1. April 2027',
    ],
    meta: 'Sternwarte Meridian Peak · 2.410 Meter über dem Meer',
  },
};
