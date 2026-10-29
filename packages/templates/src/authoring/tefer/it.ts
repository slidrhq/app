import type { TeferCopy } from './copy';

export const it: TeferCopy = {
  footer: 'Ourela · Autunno-Inverno 2027',
  hero: {
    name: 'Apertura',
    org: 'Ourela · Cappotti fatti a Porto',
    title: ['Cappotti', 'per durare'],
    subtitle: ['Ventiquattro cappotti tagliati nei tessuti che i lanifici non sono riusciti a vendere'],
    meta: 'Presentazione ai buyer · Parigi · 4 marzo 2027',
  },
  section: {
    name: 'Il tessuto',
    part: 'Prima parte',
    title: ['Il tessuto'],
    subtitle: 'Da dove viene ogni metro della collezione.',
  },
  agenda: {
    name: 'Programma',
    title: 'Sul tavolo stamattina',
    intro:
      'Quaranta minuti su una collezione di ventiquattro cappotti: da dove viene il suo tessuto, come lo tagliamo perché a terra non resti quasi nulla e come ordinarla per l’autunno. Poi i cappotti stessi, sullo stender.',
    items: [
      ['Il tessuto: ', '1.840 metri da tre lanifici, e perché l’86% era invenduto.'],
      ['Il taglio: ', 'cartamodelli che lasciano a terra il 3% del tessuto, non il 15%.'],
      ['L’atelier: ', 'trentuno ore di lavoro a mano in ogni cappotto, a Porto.'],
      ['Gli ordini: ', 'come ordinare per settembre, e cosa facciamo ancora su misura.'],
    ],
  },
  cloth: {
    name: 'Il tessuto in cifre',
    kicker: 'Il tessuto in cifre',
    title: 'Una collezione tagliata nelle rimanenze',
    hero: {
      value: '86%',
      label: 'della lana viene da rimanenze',
      note: 'Dei 1.840 metri, 1.582 vengono dalle rimanenze invendute di tre lanifici.',
    },
    others: [
      ['24', 'cappotti nella collezione'],
      ['3', 'lanifici: Biella, Huddersfield e Bursa'],
      ['31', 'ore di lavoro a mano in ogni cappotto'],
    ],
  },
  cutting: {
    name: 'Il taglio',
    kicker: 'Taglio a spreco zero',
    title: 'Come si taglia un cappotto',
    items: [
      [
        'Pezzi che si incastrano',
        'Ogni cartamodello è disegnato perché i pezzi si incastrino sul tessuto come un puzzle.',
      ],
      ['Ritagli con un compito', 'Ciò che avanza diventa tasche, paramonture e sottocollo.'],
      ['Un sarto, un cappotto', 'Ogni cappotto è tagliato e cucito dalle stesse mani.'],
    ],
  },
  workroom: {
    name: 'Il laboratorio',
    place: 'Il laboratorio · Porto',
    title: ['Cucito dove', 'si taglia'],
    body: 'Dodici sarti, un lungo tavolo e la luce da nord di un vecchio cotonificio.',
  },
  quote: {
    name: 'Dall’atelier',
    text: 'Un cappotto si finisce sul tavolo da taglio, molto prima che qualcuno lo indossi in passerella.',
    who: 'Inês Moreira',
    role: 'Responsabile dell’atelier, Ourela',
  },
  cloths: {
    name: 'Tre tessuti',
    kicker: 'Tre tessuti',
    title: 'I tessuti della stagione',
    cards: [
      [
        'Tessuto 01 · Huddersfield',
        'Tweed spigato',
        'Una lana pesante color granata, tessuta per un ordine mai ritirato.',
      ],
      [
        'Tessuto 02 · Biella',
        'Bouclé',
        'Filato ad anelli di fine produzione, morbido quanto basta per un cappotto sfoderato.',
      ],
      [
        'Tessuto 03 · Bursa',
        'Melton',
        'Un twill loden fitto e follato, che ferma la pioggia e non vuole orlo.',
      ],
    ],
    note: 'Ogni cappotto riporta sull’etichetta nel collo il nome del suo lanificio e della sua pezza.',
  },
  season: {
    name: 'La stagione',
    kicker: 'La stagione',
    title: 'Dal lanificio al negozio',
    stops: [
      ['Gen. 2027', 'Tessuto scelto', 'Compriamo 1.582 metri di rimanenze da tre lanifici.'],
      ['Mar. 2027', 'Ordini aperti', 'Ventiquattro cappotti presentati ai buyer a Parigi.'],
      ['Giu. 2027', 'Inizia il taglio', 'Ogni ordine tagliato a mano nel laboratorio di Porto.'],
      ['Set. 2027', 'In negozio', 'Cappotti consegnati a 40 negozi in 11 paesi.'],
    ],
    note: 'Gli ordini effettuati entro il 30 aprile 2027 arrivano nella prima settimana di settembre.',
  },
  making: {
    name: 'La confezione',
    kicker: 'Come nasce un cappotto',
    title: 'Trentuno ore, in cinque passaggi',
    steps: [
      ['1 h', 'Misurare', 'Ventidue misure, prese a mano'],
      ['5 h', 'Disegnare', 'Un cartamodello pensato per il tessuto'],
      ['3 h', 'Tagliare', 'Forbici, gesso e un lungo tavolo'],
      ['17 h', 'Cucire', 'Telo, cuciture e maniche montate'],
      ['5 h', 'Rifinire', 'Asole fatte a mano'],
    ],
    note: 'Dalla prima misura all’ultima asola, un cappotto richiede trentuno ore.',
  },
  cut: {
    name: 'Il taglio solito, e il nostro',
    kicker: 'Perché spreco zero',
    title: 'Il taglio solito, e il nostro',
    before: [
      'Il taglio solito',
      '15% a terra',
      'Pezzi disposti uno per uno, e gli spazi tra loro spazzati via a fine giornata.',
    ],
    after: [
      'Il taglio Ourela',
      'Meno del 3% di scarto',
      'Pezzi che si incastrano sul tessuto, e ogni ritaglio ricucito nel cappotto.',
    ],
  },
  waste: {
    name: 'Scarto',
    kicker: 'Scarto per cappotto',
    title: 'Meno tessuto a terra ogni stagione',
    source: 'Tessuto avanzato per cappotto (%), collezioni Autunno-Inverno 2023–2026.',
    series: ['Taglio solito', 'Ourela'],
    figures: [
      ['3%', 'del tessuto di un cappotto avanzato nel 2026, contro il 12% del 2023.'],
      ['0,36 m', 'di tessuto risparmiati su ogni cappotto rispetto al taglio solito.'],
    ],
  },
  mills: {
    name: 'I lanifici',
    kicker: 'I lanifici',
    title: 'Cinque tessuti, tre lanifici',
    note: 'Tessuto acquistato a gennaio 2027 per la collezione Autunno-Inverno 2027.',
    header: ['Tessuto', 'Lanificio', 'Metri', 'Rimanenze', 'Cappotti'],
    rows: [
      ['Tweed spigato', 'Huddersfield', '520', '100%', '7'],
      ['Bouclé', 'Biella', '380', '100%', '5'],
      ['Melton', 'Bursa', '460', '70%', '6'],
      ['Flanella', 'Biella', '220', '100%', '4'],
      ['Pelo di cammello', 'Huddersfield', '260', '54%', '2'],
    ],
  },
  team: {
    name: 'L’atelier',
    kicker: 'L’atelier',
    title: 'Le mani dietro la collezione',
    people: [
      ['Atelier', 'Inês Moreira', 'Responsabile dell’atelier, taglia il primo cappotto di ogni modello'],
      ['Design', 'Aiko Mori', 'Designer, disegna ogni cartamodello sul suo tessuto'],
      ['Modelli', 'Kofi Asante', 'Modellista, dispone i pezzi incastrati sul tessuto'],
      ['Tessuti', 'Omar Khalil', 'Buyer dei tessuti, conosce i magazzini di ogni lanificio'],
    ],
  },
  closing: {
    name: 'Chiusura',
    kicker: 'Grazie',
    title: ['Ci vediamo', 'alla prova'],
    lines: [
      'Ordini aperti fino al 30 aprile 2027',
      'Lo showroom di Porto, su appuntamento',
      'Tutti i cappotti, pronti da provare',
    ],
    meta: 'Ourela · Cappotti dalle rimanenze di lana',
  },
};
