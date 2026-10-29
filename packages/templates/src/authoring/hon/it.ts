import type { HonCopy } from './copy';

export const it: HonCopy = {
  footer: 'Larkfield Mutual · Risultati annuali 2026',
  hero: {
    name: 'Apertura',
    org: 'Larkfield Mutual · Risultati annuali 2026',
    title: ['Capitale che', 'resta a casa'],
    subtitle: ['L’anno di una banca che appartiene', 'ai suoi 412.000 soci'],
    meta: 'Assemblea dei soci · 18 marzo 2027',
  },
  agenda: {
    name: 'Ordine del giorno',
    title: 'Stasera all’ordine del giorno',
    intro:
      'Quaranta minuti sul 2026 della banca che vi appartiene: quanto abbiamo prestato, quanto abbiamo tenuto come capitale e che cosa è tornato a voi soci. Poi le votazioni e le vostre domande.',
    items: [
      ['L’anno in cifre: ', 'credito, capitale e ciò che è tornato ai soci.'],
      ['Case verdi: ', 'i prestiti per la riqualificazione, cresciuti più di tutti quest’anno.'],
      ['Il vostro risparmio al lavoro: ', 'come un deposito diventa il prestito di un vicino, in cinque passi.'],
      ['Le votazioni: ', 'il consiglio, i revisori e il dividendo ai soci.'],
    ],
  },
  section: {
    name: 'L’anno in cifre',
    part: 'Prima parte',
    title: ['L’anno in cifre'],
    subtitle: 'Il credito è cresciuto, il capitale ancora di più.',
  },
  figures: {
    name: 'Quattro numeri',
    kicker: 'L’anno in cifre',
    title: 'Il 2026 in quattro numeri',
    hero: {
      value: '1,84 mld €',
      label: 'prestati alle case e alle imprese dei soci',
      note: 'In crescita del 12% sul 2025, e ogni euro è finanziato dal risparmio dei soci stessi.',
    },
    others: [
      ['412.000', 'soci, 23.300 in più di un anno fa'],
      ['19,2%', 'capitale primario, contro il 10,5% richiesto'],
      ['22 mln €', 'restituiti ai soci con tassi migliori'],
    ],
  },
  savings: {
    name: 'Risparmi e prestiti',
    kicker: 'Risparmio e credito',
    title: 'I soci finanziano ogni prestito',
    source: 'Saldi a fine anno, in miliardi di euro, 2023–2026.',
    series: ['Risparmio dei soci', 'Prestiti ai soci'],
    figures: [
      ['81%', 'del risparmio dei soci torna ai soci come prestiti; il resto è un margine di sicurezza.'],
      ['+21%', 'di risparmio dal 2023, senza un euro preso in prestito sui mercati.'],
    ],
  },
  lines: {
    name: 'Cinque voci',
    kicker: 'Lo stato patrimoniale',
    title: 'Dove si trova il denaro dei soci',
    note: 'Saldi al 31 dicembre 2026; i tassi sono quelli che i soci hanno ricevuto o pagato in media nell’anno.',
    header: ['Voce', 'Saldo, mln €', 'Variazione', 'Soci', 'Tasso medio'],
    rows: [
      ['Conti di risparmio', '4.120', '+6%', '351.000', '2,1%'],
      ['Depositi vincolati', '2.180', '+9%', '96.000', '3,0%'],
      ['Mutui casa', '3.690', '+5%', '41.500', '3,4%'],
      ['Prestiti alle piccole imprese', '1.050', '+11%', '8.200', '5,2%'],
      ['Prestiti per case verdi', '360', '+64%', '6.900', '2,9%'],
    ],
  },
  profit: {
    name: 'Dove è andato l’utile',
    kicker: 'Utile 2026',
    title: 'Dove è andato l’utile di 58 mln €',
    cards: [
      [
        '22 mln € · 38%',
        'Restituito ai soci',
        'Tassi migliori della media di mercato su risparmi e prestiti, tutto l’anno.',
      ],
      [
        '31 mln € · 53%',
        'Tenuto come capitale',
        'Ogni euro trattenuto rafforza la banca e le permette di prestare di più l’anno prossimo.',
      ],
      [
        '5 mln € · 9%',
        'Il fondo per il territorio',
        'Contributi a 140 progetti locali, ciascuno scelto con il voto dei soci.',
      ],
    ],
    note: 'Una banca mutualistica non ha azionisti esterni da remunerare: tutto l’utile resta ai suoi soci.',
  },
  owners: {
    name: 'Perché mutualistica',
    kicker: 'Perché una banca mutualistica',
    title: 'Degli azionisti, o dei soci',
    before: [
      'Una banca quotata',
      'L’utile lascia la città',
      'I dividendi vanno agli azionisti, ovunque vivano, il consiglio risponde al prezzo dell’azione e una filiale chiude appena smette di rendere.',
    ],
    after: [
      'Larkfield Mutual',
      'L’utile resta ai soci',
      'Ogni socio ha un voto, qualunque sia il suo saldo; l’utile gli torna in tassi migliori e le filiali della sua città restano aperte.',
    ],
  },
  homes: {
    name: 'Case verdi',
    kicker: 'La voce che cresce di più · Case verdi',
    title: 'Prestiti contro le bollette',
    items: [
      [
        '6.900 case riqualificate',
        'Isolamento, pompe di calore e tetti solari al 2,9%, sotto il nostro tasso abituale per i mutui.',
      ],
      [
        'Un terzo di energia in meno',
        'Finiti i lavori, le case dei soci consumano in media il 31% di energia in meno.',
      ],
      [
        'Consulenza prima del prestito',
        'Un esperto di energia visita prima ogni casa, e la visita la paga la banca.',
      ],
    ],
  },
  street: {
    name: 'Vicino a casa',
    place: 'Via Maestra, Larkfield',
    title: ['Ogni prestito', 'entro 20 km'],
    body: 'Prestiamo solo dove i nostri soci vivono e lavorano, così il loro risparmio costruisce le strade che percorrono ogni giorno.',
  },
  quote: {
    name: 'La voce di una socia',
    text: 'Chi ci ha detto sì in banca conosceva già la nostra via. Oggi quel prestito sono quattro forni e undici posti di lavoro.',
    who: 'Amara Osei',
    role: 'Panettiera, socia dal 2012',
  },
  lending: {
    name: 'Il risparmio al lavoro',
    kicker: 'Come prestiamo',
    title: 'Dal risparmio al vicino di casa',
    steps: [
      ['Risparmiare', 'Un socio apre un conto di risparmio'],
      ['Raccogliere', 'Resta in città, mai sui mercati'],
      ['Valutare', 'Un consulente locale incontra il richiedente'],
      ['Prestare', 'Decisione in dieci giorni lavorativi'],
      ['Restituire', 'Gli interessi tornano ai risparmiatori'],
    ],
    note: 'Ogni prestito si decide a Larkfield, da persone che vivono qui, mai solo da un lontano modello di credito.',
  },
  history: {
    name: 'La nostra storia',
    kicker: 'Novantasei anni',
    title: 'Costruita un socio alla volta',
    stops: [
      ['1931', 'Fondata dai portuali', 'Duecento famiglie mettono insieme i salari per prestarsi denaro a vicenda.'],
      ['1974', 'I primi mutui', 'I soci iniziano a comprare le case in cui erano in affitto da decenni.'],
      ['2009', 'Nessun salvataggio', 'Attraversa la crisi finanziaria senza un centesimo di denaro pubblico.'],
      ['2026', '412.000 soci', 'L’anno di crescita più rapida degli ultimi vent’anni.'],
    ],
    note: 'In novantasei anni la banca non ha mai pagato un azionista esterno, perché non ne ha mai avuto uno.',
  },
  team: {
    name: 'La direzione',
    kicker: 'La direzione',
    title: 'Le persone che rispondono a voi',
    people: [
      ['Direzione generale', 'Margit Lindqvist', 'Entrata come impiegata di filiale nel 1994'],
      ['Finanza', 'Kwame Asante', 'Direttore finanziario, tiene solido il capitale'],
      ['Rischi', 'Priya Raman', 'Responsabile dei rischi, approva ogni grande prestito'],
      ['Soci', 'Tomás Herrera', ['Guida 26 filiali', 'e il consiglio dei soci']],
    ],
  },
  closing: {
    name: 'Chiusura',
    kicker: 'Grazie',
    title: ['La vostra banca,', 'il vostro voto'],
    lines: [
      'Il voto si apre stasera e si chiude il 25 marzo 2027',
      'Risultati in ogni filiale il 26 marzo 2027',
      'Domande al consiglio dei soci, in ogni filiale',
    ],
    meta: 'Larkfield Mutual · Dei suoi soci dal 1931',
  },
};
