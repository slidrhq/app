import type { DofekCopy } from './copy';

export const it: DofekCopy = {
  footer: 'Sanità del Distretto Costiero · Relazione 2027',
  hero: {
    name: 'Apertura',
    org: 'Sanità del Distretto Costiero · Relazione di salute pubblica',
    title: ['Quattro minuti', 'per un cuore'],
    subtitle: ['Come un distretto di 640.000 persone', 'ha imparato ad agire prima dell’ambulanza'],
    meta: 'Relazione al consiglio distrettuale · 15 aprile 2027',
  },
  agenda: {
    name: 'Ordine del giorno',
    title: 'Di cosa parleremo oggi',
    intro:
      'Venti minuti su ciò che il programma ha cambiato, su ciò che accade oggi per strada quando un cuore si ferma e su ciò che chiediamo al consiglio per il 2027. Poi spazio alle vostre domande.',
    items: [
      ['I numeri: ', 'cosa è cambiato per chi ha un arresto cardiaco fuori dall’ospedale.'],
      ['Per strada: ', 'come vicini, volontari e defibrillatori oggi lavorano insieme.'],
      ['Le persone: ', 'la squadra che guida il programma e i volontari al suo fianco.'],
      ['Il prossimo anno: ', 'cosa chiediamo al consiglio, ed entro quando.'],
    ],
  },
  section: {
    name: 'I primi minuti',
    part: 'Prima parte',
    title: ['I primi', 'minuti'],
    subtitle: 'Perché i minuti prima dell’arrivo dell’ambulanza decidono chi torna a casa.',
  },
  figures: {
    name: 'L’anno in cifre',
    kicker: 'L’anno in cifre',
    title: 'Il 2026 in quattro numeri',
    hero: {
      value: '72',
      label: 'persone sono tornate a casa dopo un arresto cardiaco',
      note: 'Il doppio rispetto al 2023, l’anno prima dell’avvio del programma.',
    },
    others: [
      ['6 min', 'alla prima scarica, prima erano 11'],
      ['920', 'defibrillatori pubblici, tutti sulla mappa'],
      ['58.000', 'cittadini formati alla RCP'],
    ],
  },
  change: {
    name: 'Prima e dopo',
    kicker: 'Cosa è cambiato',
    title: 'Dall’attesa all’azione',
    before: [
      '2023',
      'Aspettare l’ambulanza',
      'I passanti chiamavano e aspettavano. Due pazienti su tre restavano senza RCP fino all’arrivo dei soccorsi, dopo undici minuti.',
    ],
    after: [
      '2026',
      'Agire nei primi minuti',
      'I vicini iniziano la RCP e un volontario porta un defibrillatore. La prima scarica arriva dopo sei minuti, non dopo undici.',
    ],
  },
  chain: {
    name: 'La catena della sopravvivenza',
    kicker: 'La catena della sopravvivenza',
    title: 'I primi otto minuti, passo dopo passo',
    steps: [
      ['00:00', 'Chiamata', 'L’operatore del 118 resta in linea'],
      ['00:30', 'Allerta', 'Volontari entro 500 metri'],
      ['01:00', 'Massaggio', 'RCP fino all’arrivo dei soccorsi'],
      ['04:00', 'Scarica', 'Il defibrillatore pubblico più vicino'],
      ['08:00', 'Consegna', 'Subentrano i soccorritori'],
    ],
    note: 'Ogni intervento viene analizzato entro una settimana, insieme ai volontari che vi hanno preso parte.',
  },
  responders: {
    name: 'Volontari in allerta',
    kicker: 'Volontari in allerta',
    title: 'L’aiuto dietro l’angolo',
    items: [
      ['Allertati in pochi secondi', 'Un’app avvisa i volontari formati entro 500 metri dalla chiamata.'],
      ['Un defibrillatore in arrivo', 'Un secondo volontario prende il defibrillatore pubblico più vicino.'],
      ['Prima della sirena', 'In sei chiamate su dieci, un volontario è arrivato dal paziente prima dell’ambulanza.'],
    ],
  },
  park: {
    name: 'Al parco',
    place: 'Parco del Fiume, Distretto Costiero',
    title: ['Due ore al parco,', 'un gesto per la vita'],
    body: 'Una volta al mese, cittadini di ogni età imparano insieme la RCP al parco: finora sono già 58.000.',
  },
  quote: {
    name: 'Le parole di una sopravvissuta',
    text: 'Il cuore mi si è arrestato alla fermata del bus. Uno sconosciuto l’ha fatto battere con le mani, finché una vicina è corsa col\u00a0defibrillatore.',
    who: 'Elif Kaya',
    role: 'Insegnante di musica della Città Vecchia, oggi lei stessa volontaria',
  },
  programmes: {
    name: 'Programmi',
    kicker: 'Tre programmi',
    title: 'Cosa fa il programma',
    cards: [
      [
        'Programma 01',
        'RCP per tutti',
        'Corsi gratuiti di due ore in scuole, luoghi di lavoro e centri civici.',
      ],
      [
        'Programma 02',
        'Volontari in allerta',
        'I volontari nei dintorni ricevono un avviso non appena si chiama l’ambulanza.',
      ],
      [
        'Programma 03',
        'Un defibrillatore in ogni via',
        '920 defibrillatori pubblici, mappati e controllati ogni mese.',
      ],
    ],
    note: 'Insieme al 118, alle scuole e ai comuni.',
  },
  milestones: {
    name: 'Le tappe',
    kicker: 'Le tappe',
    title: 'Quattro anni, quattro passi',
    stops: [
      ['2024', 'RCP a scuola', 'Corsi in tutte le 38 scuole superiori.'],
      ['2025', 'Volontari in rete', 'L’app di allerta parte con 1.200 volontari.'],
      ['2026', '920 defibrillatori', 'Ognuno mappato e controllato ogni mese.'],
      ['2027', 'Dai dieci anni', 'Lezioni di RCP in ogni scuola primaria.'],
    ],
    note: 'Scelte con i sopravvissuti e gli equipaggi delle ambulanze.',
  },
  trend: {
    name: 'Risultati',
    kicker: 'Risultati',
    title: 'Più RCP, più persone tornano a casa',
    source:
      'Quota degli arresti cardiaci extraospedalieri, in percentuale, 2023–2026. Registro distrettuale degli arresti cardiaci.',
    series: ['RCP prima dell’ambulanza', 'Dimessi dall’ospedale'],
    figures: [
      ['67%', 'dei pazienti ha avuto la RCP da un passante nel 2026, contro il 36%.'],
      ['16%', 'è tornato a casa dall’ospedale, il doppio del 2023.'],
    ],
  },
  areas: {
    name: 'Le cinque zone',
    kicker: 'Le cinque zone',
    title: 'A che punto è ogni zona',
    note: 'Dati 2026, dal registro distrettuale degli arresti cardiaci, gennaio 2027.',
    header: ['Zona', 'Defibrillatori', 'Cittadini formati', 'RCP prima del 118', 'Prima scarica'],
    rows: [
      ['Porto', '240', '16.200', '72%', '5 min'],
      ['Città Vecchia', '210', '13.900', '70%', '5 min'],
      ['Campi del Nord', '180', '11.400', '66%', '6 min'],
      ['Lungofiume', '170', '10.300', '63%', '7 min'],
      ['Borghi collinari', '120', '6.200', '58%', '9 min'],
    ],
  },
  team: {
    name: 'La squadra',
    kicker: 'La squadra del programma',
    title: 'Le persone dietro i quattro minuti',
    people: [
      ['Cardiologia', 'Amara Mensah', 'Cardiologa, responsabile clinica del programma'],
      ['Servizio 118', 'Tomás Herrera', 'Capo dei soccorritori, dirige la centrale operativa'],
      ['Volontari', 'Noa Katz', 'Infermiera, forma e segue i volontari'],
      ['Registro', 'Kenji Morita', 'Epidemiologo, cura il registro degli arresti cardiaci'],
    ],
  },
  closing: {
    name: 'Chiusura',
    kicker: 'Grazie',
    title: ['Ogni minuto', 'conta'],
    lines: [
      'Corsi di RCP gratuiti ogni mese al Parco del Fiume',
      'Prossima relazione: 14 ottobre 2027, Palazzo del Distretto',
      'Si diventa volontari in ogni ambulatorio del distretto',
    ],
    meta: 'Sanità del Distretto Costiero · Programma Quattro minuti',
  },
};
