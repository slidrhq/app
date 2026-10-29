import type { TaaruchaCopy } from './copy';

export const it: TaaruchaCopy = {
  footer: 'Museo d’Arte Vellin · Anteprima stampa 2027',
  hero: {
    name: 'Apertura',
    org: 'Museo d’Arte Vellin · L’ala delle collezioni',
    title: ['La collezione,', 'riallestita'],
    subtitle: ['Ventidue sale, 1.180 opere', 'e un nuovo percorso per scoprirle'],
    meta: 'Stampa e mecenati · 12 aprile 2027',
  },
  section: {
    name: 'La nuova ala',
    part: 'Prima parte',
    title: ['La nuova ala'],
    subtitle: 'Ventidue sale su tre piani, e un unico percorso che le attraversa.',
  },
  agenda: {
    name: 'Stamattina',
    title: 'L’anteprima di stamattina',
    intro:
      'Quaranta minuti su come abbiamo riallestito la collezione dopo due anni di lavori, e su cosa cambia per i visitatori dal giorno dell’apertura. Poi una passeggiata nelle prime sale.',
    items: [
      ['La nuova ala: ', 'ventidue sale su tre piani, e un unico percorso che le attraversa.'],
      ['Restauro: ', '312 opere pulite, risarcite e incorniciate di nuovo per l’allestimento.'],
      ['La visita: ', 'serate gratuite il giovedì e un laboratorio pensato per le scuole.'],
      ['L’anno che viene: ', 'quattro date da segnare, dall’apertura alla prima mostra di prestiti.'],
    ],
  },
  figures: {
    name: 'In cifre',
    kicker: 'Il riallestimento in cifre',
    title: 'La nuova ala in quattro numeri',
    hero: {
      value: '1.180',
      label: 'opere esposte',
      note: 'Più del doppio delle 520 esposte prima della chiusura dell’ala nel 2025.',
    },
    others: [
      ['22', 'sale su tre piani'],
      ['312', 'opere restaurate per l’allestimento'],
      ['86', 'acquisizioni esposte per la prima volta'],
    ],
  },
  studio: {
    name: 'Restauro',
    kicker: 'Il laboratorio di restauro',
    title: 'Ogni opera, pronta per la sua parete',
    items: [
      ['Pulita a mano', 'Vecchia vernice tolta con tamponi, pochi centimetri alla volta.'],
      [
        'Risarcita, mai ridipinta',
        'Strappi e lacune colmati con materiali sempre reversibili.',
      ],
      [
        'Luce su misura',
        'Ogni opera ha la luce che il suo colore o la sua carta sopporta.',
      ],
    ],
  },
  gallery: {
    name: 'La galleria lunga',
    place: 'Sala 7, la galleria lunga',
    title: ['Spazio per guardare da lontano'],
    body: 'Ogni dipinto ha un metro e mezzo di parete tutto per sé, e in ogni sala c’è una panca.',
  },
  quote: {
    name: 'Lo sguardo della curatrice',
    text: 'Per due anni i dipinti hanno aspettato al buio. Ora ognuno ha una parete, una luce e una panca davanti.',
    who: 'Amara Okafor',
    role: 'Curatrice capo, Museo d’Arte Vellin',
  },
  visits: {
    name: 'Come visitarci',
    kicker: 'Tre nuovi modi di visitarci',
    title: 'Un museo aperto a più persone',
    cards: [
      ['Giovedì', 'Serate gratuite', 'Fino alle dieci, con musica nell’atrio e senza biglietto.'],
      ['Scuole', 'Il laboratorio aperto', 'Dove le classi disegnano le opere appena viste.'],
      ['Soci', 'Dietro le quinte', 'Una visita al mese al laboratorio di restauro e ai depositi.'],
    ],
    note: 'Tutti i programmi partono nella settimana dell’apertura.',
  },
  year: {
    name: 'Il primo anno',
    kicker: 'Il primo anno',
    title: 'Quattro date nel primo anno dell’ala',
    stops: [
      ['14 aprile', 'Si aprono le porte', 'Tutte e ventidue le sale, gratis nel weekend di apertura.'],
      ['1° luglio', 'Serate d’estate', 'Il giovedì fino alle dieci, con musica nell’atrio.'],
      [
        '20 ottobre',
        'Opere in prestito',
        'Cinquanta opere da Lisbona, Seul e Dakar.',
      ],
      ['3 febbraio', 'La collezione online', 'Ogni opera esposta, fotografata e pubblicata.'],
    ],
    note: 'Date nel 2027 e all’inizio del 2028. Tutte le mostre sono incluse nel biglietto.',
  },
  journey: {
    name: 'Dal deposito alla parete',
    kicker: 'Dal deposito alla parete',
    title: 'Come un’opera arriva in sala, in cinque passi',
    steps: [
      ['Scegliere', 'I curatori scelgono tra 18.400 opere'],
      ['Restaurare', 'Pulita e risarcita nel nostro laboratorio'],
      ['Incorniciare', 'Una cornice fatta su misura per ogni opera'],
      ['Appendere', 'Centrata a 145\u00a0cm dal pavimento'],
      ['Illuminare', '50 lux per la carta, 200 per i dipinti'],
    ],
    note: 'In media, un’opera ha impiegato nove settimane dal deposito alla sua parete.',
  },
  rehang: {
    name: 'Vecchio e nuovo allestimento',
    kicker: 'Perché un riallestimento',
    title: 'Due modi di allestire una collezione',
    before: [
      'Fino al 2025',
      'In ordine cronologico',
      'Dodici sale affollate in ordine di data, con gran parte dell’arte moderna in deposito.',
    ],
    after: [
      'Dal 2027',
      'Opere in dialogo',
      'Ventidue sale dove antico e moderno stanno fianco a fianco, ogni opera con il suo respiro.',
    ],
  },
  onView: {
    name: 'Opere esposte',
    kicker: 'Opere esposte',
    title: 'Più collezione, da ogni epoca',
    source: 'Opere esposte per epoca di realizzazione, prima della chiusura e da aprile 2027.',
    series: ['Fino al 2025', 'Dal 2027'],
    periods: ['Prima del 1800', '1800–1900', '1900–1960', '1960–2000', 'Dal 2000'],
    figures: [
      ['2,3×', 'le opere esposte rispetto a prima della chiusura dell’ala.'],
      ['41%', 'delle opere esposte risale a dopo il 1960, contro il 19% di prima.'],
    ],
  },
  rooms: {
    name: 'Le sale',
    kicker: 'Le sale',
    title: 'Cinque delle ventidue sale',
    note: 'Luce in lux, regolata per le opere di ciascuna sala.',
    header: ['Sala', 'Tema', 'Opere', 'Piano', 'Luce, lux'],
    rows: [
      ['1', 'I pittori del porto', '64', 'Pianterreno', '200'],
      ['7', 'La galleria lunga', '48', 'Pianterreno', '200'],
      ['12', 'Opere su carta', '92', 'Primo', '50'],
      ['16', 'Il cortile delle sculture', '21', 'Primo', 'Luce naturale'],
      ['22', 'Nuove acquisizioni', '86', 'Secondo', '150'],
    ],
  },
  team: {
    name: 'Il team',
    kicker: 'Il team del riallestimento',
    title: 'Le persone che hanno riallestito la collezione',
    people: [
      ['Curatela', 'Amara Okafor', 'Curatrice capo, ha ideato il percorso dell’ala'],
      ['Restauro', 'Tomás Herrera', 'Capo restauratore, ha curato 312 opere'],
      ['Opere su carta', 'Hana Kobayashi', 'Curatrice, ha regolato la luce di ogni disegno'],
      ['Didattica', 'Eitan Levi', 'Responsabile, ha creato il laboratorio aperto'],
    ],
  },
  closing: {
    name: 'Chiusura',
    kicker: 'Grazie',
    title: ['Ci vediamo', 'nella nuova ala'],
    lines: [
      'Apertura mercoledì 14 aprile 2027',
      'Tutti i giorni 10–18, il giovedì fino alle 22',
      'Ingresso gratuito nel weekend di apertura',
    ],
    meta: 'Museo d’Arte Vellin · Via del Porto 3',
  },
};
