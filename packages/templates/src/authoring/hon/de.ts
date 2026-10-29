import type { HonCopy } from './copy';

export const de: HonCopy = {
  footer: 'Larkfield Mutual · Jahresergebnis 2026',
  hero: {
    name: 'Eröffnung',
    org: 'Larkfield Mutual · Jahresergebnis 2026',
    title: ['Kapital, das', 'vor Ort bleibt'],
    subtitle: ['Das Jahr einer Bank, die ihren', '412.000 Mitgliedern gehört'],
    meta: 'Mitgliederversammlung · 18. März 2027',
  },
  agenda: {
    name: 'Tagesordnung',
    title: 'Heute Abend auf der Tagesordnung',
    intro:
      'Vierzig Minuten darüber, wie das Jahr 2026 für die Bank lief, die Ihnen gehört: was wir verliehen, was wir als Kapital behalten haben und was an Sie als Mitglieder zurückgeflossen ist. Danach die Abstimmungen und Ihre Fragen.',
    items: [
      ['Das Jahr in Zahlen: ', 'Kredite, Kapital und was an die Mitglieder zurückging.'],
      ['Grüne Häuser: ', 'die Sanierungskredite, die in diesem Jahr am stärksten wuchsen.'],
      [
        'Ihr Erspartes bei der Arbeit: ',
        'wie aus einer Einlage in fünf Schritten ein Kredit für die Nachbarn wird.',
      ],
      ['Die Abstimmungen: ', 'Aufsichtsrat, Abschlussprüfer und die Dividende der Mitglieder.'],
    ],
  },
  section: {
    name: 'Das Jahr in Zahlen',
    part: 'Teil eins',
    title: ['Das Jahr in Zahlen'],
    subtitle: 'Die Kredite wuchsen, das Kapital noch schneller.',
  },
  figures: {
    name: 'Vier Zahlen',
    kicker: 'Das Jahr in Zahlen',
    title: '2026 in vier Zahlen',
    hero: {
      value: '1,84\u00a0Mrd.\u00a0€',
      label: 'Kredite für Häuser und Betriebe der Mitglieder',
      note: '12\u00a0% mehr als 2025, und jeder Euro davon stammt aus den Ersparnissen der Mitglieder selbst.',
    },
    others: [
      ['412.000', 'Mitglieder, 23.300 mehr als vor einem Jahr'],
      ['19,2\u00a0%', 'harte Kernkapitalquote, verlangt sind 10,5\u00a0%'],
      ['22\u00a0Mio.\u00a0€', 'als bessere Zinsen an die Mitglieder zurück'],
    ],
  },
  savings: {
    name: 'Einlagen und Kredite',
    kicker: 'Einlagen und Kredite',
    title: 'Mitglieder finanzieren jeden Kredit',
    source: 'Bestände zum Jahresende, Mrd. €, 2023–2026.',
    series: ['Einlagen der Mitglieder', 'Kredite an Mitglieder'],
    figures: [
      ['81\u00a0%', 'der Einlagen gehen als Kredite an Mitglieder; der Rest bleibt als Sicherheitspuffer.'],
      ['+21\u00a0%', 'mehr Einlagen seit 2023, ohne einen Euro vom Kapitalmarkt zu leihen.'],
    ],
  },
  lines: {
    name: 'Fünf Posten',
    kicker: 'Die Bilanz',
    title: 'Wo das Geld der Mitglieder liegt',
    note: 'Bestände zum 31. Dezember 2026; die Zinsen sind, was Mitglieder im Jahresmittel erhielten oder zahlten.',
    header: ['Posten', 'Bestand, Mio. €', 'Veränderung', 'Mitglieder', 'Ø-Zins'],
    rows: [
      ['Sparkonten', '4.120', '+6\u00a0%', '351.000', '2,1\u00a0%'],
      ['Festgeld', '2.180', '+9\u00a0%', '96.000', '3,0\u00a0%'],
      ['Baufinanzierungen', '3.690', '+5\u00a0%', '41.500', '3,4\u00a0%'],
      ['Kredite an Kleinbetriebe', '1.050', '+11\u00a0%', '8.200', '5,2\u00a0%'],
      ['Grüne Sanierungskredite', '360', '+64\u00a0%', '6.900', '2,9\u00a0%'],
    ],
  },
  profit: {
    name: 'Wohin der Gewinn ging',
    kicker: 'Gewinn 2026',
    title: 'Wohin der Gewinn von 58\u00a0Mio.\u00a0€ ging',
    cards: [
      [
        '22\u00a0Mio.\u00a0€ · 38\u00a0%',
        'Zurück an die Mitglieder',
        'Bessere Zinsen auf Einlagen und Kredite als im Marktschnitt, das ganze Jahr.',
      ],
      [
        '31\u00a0Mio.\u00a0€ · 53\u00a0%',
        'Als Kapital behalten',
        'Jeder behaltene Euro stärkt die Bank und lässt sie im nächsten Jahr mehr verleihen.',
      ],
      [
        '5\u00a0Mio.\u00a0€ · 9\u00a0%',
        'Der Gemeinschaftsfonds',
        'Zuschüsse für 140 Projekte vor Ort, jedes von den Mitgliedern gewählt.',
      ],
    ],
    note: 'Eine Genossenschaftsbank muss keine fremden Aktionäre bezahlen, also bleibt der ganze Gewinn bei ihren Mitgliedern.',
  },
  owners: {
    name: 'Warum genossenschaftlich',
    kicker: 'Warum eine Genossenschaftsbank',
    title: 'Aktionärsbank oder Mitgliederbank',
    before: [
      'Eine börsennotierte Bank',
      'Der Gewinn verlässt die Stadt',
      'Dividenden gehen an Aktionäre, wo immer sie wohnen, der Vorstand schaut auf den Aktienkurs, und eine Filiale schließt, sobald sie sich nicht mehr rechnet.',
    ],
    after: [
      'Larkfield Mutual',
      'Der Gewinn bleibt bei den Mitgliedern',
      'Jedes Mitglied hat eine Stimme, wie hoch sein Guthaben auch ist; der Gewinn kommt als bessere Zinsen zurück, und die Filialen vor Ort bleiben offen.',
    ],
  },
  homes: {
    name: 'Grüne Häuser',
    kicker: 'Am schnellsten gewachsen · Grüne Häuser',
    title: 'Kredite, die Energiekosten senken',
    items: [
      [
        '6.900 Häuser saniert',
        'Dämmung, Wärmepumpen und Solardächer zu 2,9\u00a0%, unter unserem üblichen Zins für Baukredite.',
      ],
      [
        'Ein Drittel weniger Energie',
        'Nach den Arbeiten verbrauchen die Häuser der Mitglieder im Schnitt 31\u00a0% weniger Energie.',
      ],
      [
        'Beratung vor dem Kredit',
        'Ein Energieberater besucht zuerst jedes Haus, und die Bank bezahlt den Besuch.',
      ],
    ],
  },
  street: {
    name: 'Vor Ort',
    place: 'Hauptstraße, Larkfield',
    title: ['Jeder Kredit:', 'höchstens 20\u00a0km'],
    body: 'Wir verleihen nur dort, wo unsere Mitglieder wohnen und arbeiten, damit ihr Erspartes die Straßen baut, durch die sie jeden Tag gehen.',
  },
  quote: {
    name: 'Stimme eines Mitglieds',
    text: 'Als die Bank Ja sagte, kannte mein Gegenüber unsere Straße längst. Aus dem Kredit wurden vier Öfen und elf Jobs.',
    who: 'Amara Osei',
    role: 'Bäckerin, Mitglied seit 2012',
  },
  lending: {
    name: 'Erspartes bei der Arbeit',
    kicker: 'So vergeben wir Kredite',
    title: 'Vom Sparbuch zum Kredit nebenan',
    steps: [
      ['Sparen', 'Ein Mitglied eröffnet ein Sparkonto'],
      ['Bündeln', 'Das Geld bleibt in der Stadt, nie an der Börse'],
      ['Prüfen', 'Ein Berater vor Ort trifft die Kreditnehmer'],
      ['Verleihen', 'Entscheidung in zehn Arbeitstagen'],
      ['Zurückgeben', 'Die Zinsen fließen an die Sparer zurück'],
    ],
    note: 'Jeder Kredit wird in Larkfield entschieden, von Menschen, die hier leben, nie allein von einem fernen Kreditmodell.',
  },
  history: {
    name: 'Unsere Geschichte',
    kicker: 'Sechsundneunzig Jahre',
    title: 'Gewachsen, Mitglied für Mitglied',
    stops: [
      ['1931', 'Von Hafenarbeitern gegründet', 'Zweihundert Familien legen ihre Löhne zusammen, um einander zu leihen.'],
      ['1974', 'Die ersten Baukredite', 'Mitglieder kaufen die Häuser, in denen sie jahrzehntelang zur Miete wohnten.'],
      ['2009', 'Keine Rettung nötig', 'Durch die Finanzkrise ohne einen Cent öffentlicher Gelder.'],
      ['2026', '412.000 Mitglieder', 'Das stärkste Wachstum seit zwanzig Jahren.'],
    ],
    note: 'In sechsundneunzig Jahren hat die Bank nie einen fremden Aktionär bezahlt, denn sie hatte nie einen.',
  },
  team: {
    name: 'Der Vorstand',
    kicker: 'Der Vorstand',
    title: 'Wer Ihnen Rechenschaft schuldet',
    people: [
      ['Vorstandsvorsitz', 'Margit Lindqvist', 'Begann 1994 als Angestellte in einer Filiale'],
      ['Finanzen', 'Kwame Asante', 'Finanzvorstand, hält das Kapital stark'],
      ['Risiko', 'Priya Raman', 'Risikovorständin, zeichnet jeden großen Kredit ab'],
      ['Mitglieder', 'Tomás Herrera', 'Leitet 26 Filialen und den Mitgliederrat'],
    ],
  },
  closing: {
    name: 'Abschluss',
    kicker: 'Vielen Dank',
    title: ['Ihre Bank,', 'Ihre Stimme'],
    lines: [
      'Die Abstimmung beginnt heute Abend und endet am 25. März 2027',
      'Ergebnisse in jeder Filiale am 26. März 2027',
      'Fragen an den Mitgliederrat, in jeder Filiale',
    ],
    meta: 'Larkfield Mutual · Seit 1931 im Besitz seiner Mitglieder',
  },
};
