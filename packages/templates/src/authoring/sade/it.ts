import type { SadeCopy } from './copy';

export const it: SadeCopy = {
  footer: 'Commonfield · Rapporto sul raccolto 2026',
  hero: {
    name: 'Apertura',
    org: 'Commonfield · Cooperativa agricola',
    title: ['Terra viva,', 'silos pieni'],
    subtitle: ['Come 212 aziende familiari hanno raccolto', 'più grano con meno acqua'],
    meta: 'Assemblea dei soci · 14 gennaio 2027',
  },
  section: {
    name: 'La stagione',
    part: 'Prima parte',
    title: ['La stagione', 'nei campi'],
    subtitle: 'Dalla prima pioggia all’ultimo carico scaricato nel silo.',
  },
  agenda: {
    name: 'Ordine del giorno',
    title: 'Di cosa parleremo stamattina',
    intro:
      'Quaranta minuti sul raccolto 2026: che cosa abbiamo coltivato, quanta acqua è servita e che cosa ci ha detto il suolo. Poi il piano per la stagione 2027 e spazio alle vostre domande.',
    items: [
      ['Il raccolto: ', '18.400 tonnellate di cereali da 212 aziende, e dove sono andate.'],
      ['L’acqua: ', 'come goccia e colture di copertura hanno tagliato l’acqua per tonnellata.'],
      ['Il suolo: ', 'che cosa mostrano tre anni di analisi sotto i nostri campi.'],
      ['La stagione 2027: ', 'la banca dei semi, le macchine in comune e il calendario.'],
    ],
  },
  figures: {
    name: 'Il raccolto in cifre',
    kicker: 'Il raccolto in cifre',
    title: '2026 in quattro numeri',
    hero: {
      value: '18.400',
      label: 'tonnellate di cereali raccolte',
      note: 'Il 12% in più del 2025, sugli stessi 9.600 ettari e con meno acqua.',
    },
    others: [
      ['212', 'aziende familiari nella cooperativa'],
      ['9.600', 'ettari coltivati'],
      ['31%', 'meno acqua a tonnellata sul 2023'],
    ],
  },
  project: {
    name: 'Progetto dell’anno',
    kicker: 'Progetto dell’anno · Irrigazione a goccia',
    title: 'L’acqua alla radice, non al solco',
    items: [
      [
        'Una linea per ogni fila',
        'Linee interrate su 1.400 ettari bagnano ogni fila alle radici, di notte, quando se ne perde poca.',
      ],
      [
        'Sensori nel suolo',
        'Sonde di umidità a 30 e 60 cm dicono alle pompe quando irrigare e quando aspettare.',
      ],
      [
        'Ripagato in tre stagioni',
        'Pompe in comune e tubi comprati all’ingrosso dimezzano la spesa di ogni azienda; l’acqua risparmiata paga il resto.',
      ],
    ],
  },
  fields: {
    name: 'Dall’alto',
    place: 'I campi a nord, visti dal drone',
    title: ['Ogni campo,', 'ogni settimana, dall’alto'],
    body: 'Il nostro drone mappa tutti i 9.600 ettari ogni settimana: così l’agronomo vede una chiazza secca prima che si noti dalla strada.',
  },
  quote: {
    name: 'La voce di un socio',
    text: 'Mio nonno arava questo campo ogni autunno. Abbiamo smesso, e ora la terra tiene la pioggia più a lungo di quanto ognuno di noi ricordi.',
    who: 'Omar Khalil',
    role: 'Coltiva grano duro su 80 ettari, socio dal 1998',
  },
  programmes: {
    name: 'Programmi',
    kicker: 'Tre programmi',
    title: 'Quello che facciamo insieme',
    cards: [
      [
        'Programma 01',
        'Colture di copertura',
        'Veccia e trifoglio tra un raccolto e l’altro nutrono il suolo e lo proteggono dal vento.',
      ],
      [
        'Programma 02',
        'Irrigazione a goccia',
        'Pompe in comune, tubi all’ingrosso, e una squadra che in sette giorni attrezza un’azienda.',
      ],
      [
        'Programma 03',
        'Banca dei semi',
        'Quaranta varietà locali, provate nei nostri campi e prestate ai soci a ogni semina.',
      ],
    ],
    note: 'Ogni azienda socia può aderire a qualsiasi programma; la prima stagione la paga la cooperativa.',
  },
  season: {
    name: 'La prossima stagione',
    kicker: 'La stagione 2027',
    title: 'Il 2027, stagione per stagione',
    stops: [
      ['Inverno', 'Apre la banca dei semi', 'I soci prenotano le varietà per la prossima semina.'],
      ['Primavera', 'Goccia, seconda fase', 'Altre sessanta aziende si collegano alle pompe.'],
      ['Estate', 'Mietitura', 'Le mietitrebbie in comune seguono un unico calendario.'],
      ['Autunno', 'Semina', 'La copertura lascia il posto a grano e ceci.'],
    ],
    note: 'Ogni data si fissa con i soci all’inizio di ogni stagione.',
  },
  joining: {
    name: 'Il passaggio',
    kicker: 'Il passaggio',
    title: 'Come cambia un’azienda, in cinque passi',
    steps: [
      ['Analisi del suolo', 'Campioni dai campi'],
      ['Piano colturale', 'Scritto con un agronomo'],
      ['Copertura', 'Seminata dopo il raccolto'],
      ['Linee a goccia', 'Posate dalla squadra'],
      ['Primo raccolto', 'Pesato e confrontato'],
    ],
    note: 'Dalla prima analisi del suolo al primo raccolto con il nuovo piano passano circa quattordici mesi.',
  },
  soil: {
    name: 'Sotto i nostri campi',
    kicker: 'Perché abbiamo smesso di arare',
    title: 'Lo stesso suolo, due modi di coltivarlo',
    before: [
      'Fino al 2023',
      'Arato ogni autunno',
      'A 25 cm si era formata una suola dura. La pioggia scorreva sulla terra nuda e le radici si fermavano dove iniziava la suola.',
    ],
    after: [
      'Dal 2024',
      'Senza aratura, con copertura',
      'Ora le radici arrivano a 90 cm e i lombrichi sono tornati. Lo stesso suolo assorbe due volte la pioggia di prima.',
    ],
  },
  water: {
    name: 'L’acqua',
    kicker: 'L’acqua',
    title: 'Meno acqua per ogni tonnellata',
    source: 'Metri cubi di acqua irrigua per tonnellata di cereali, 2023–2026.',
    series: ['Aziende Commonfield', 'Media regionale'],
    figures: [
      ['31%', 'd’acqua in meno a tonnellata dal 2023, nelle 212 aziende.'],
      ['359', 'metri cubi a tonnellata nel 2026; nella regione, 524.'],
    ],
  },
  crops: {
    name: 'Le colture',
    kicker: 'Le colture',
    title: 'Cinque colture del raccolto 2026',
    note: 'Dati 2026, dalla pesa a ponte e dai registri di campo della cooperativa.',
    header: ['Coltura', 'Ettari', 'Tonnellate', 'Tonnellate per ha', 'Acqua, m³/tonnellata'],
    rows: [
      ['Grano duro', '4.200', '9.240', '2,2', '340'],
      ['Orzo', '2.100', '4.410', '2,1', '300'],
      ['Ceci', '1.600', '2.240', '1,4', '410'],
      ['Lenticchie', '900', '1.080', '1,2', '380'],
      ['Girasole', '800', '1.430', '1,8', '570'],
    ],
  },
  team: {
    name: 'La squadra',
    kicker: 'La squadra della cooperativa',
    title: 'Le persone dietro il raccolto',
    people: [
      ['Presidente del consiglio', 'Nadia Haddad', 'Coltiva grano e ceci sui suoi 64 ettari'],
      ['Agronomo capo', 'Tomás Ferreira', 'Guida il laboratorio del suolo e i rilievi col drone'],
      ['Ingegnere idraulico', 'Kwame Asante', 'Ha progettato la rete a goccia comune'],
      ['Custode dei semi', 'Mei Lin', 'Prova quaranta varietà locali nei campi sperimentali'],
    ],
  },
  closing: {
    name: 'Chiusura',
    kicker: 'Grazie',
    title: ['Ci vediamo', 'nei campi'],
    lines: [
      'Giornata nei campi sperimentali: 22 aprile 2027',
      'Prenotazioni dei semi dal 1° febbraio 2027',
      'Il rapporto completo è in ogni azienda socia',
    ],
    meta: 'Commonfield · Cooperativa agricola',
  },
};
