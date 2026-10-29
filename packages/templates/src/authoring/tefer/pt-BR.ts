import type { TeferCopy } from './copy';

export const ptBR: TeferCopy = {
  footer: 'Ourela · Outono-Inverno 2027',
  hero: {
    name: 'Abertura',
    org: 'Ourela · Casacos feitos no Porto',
    title: ['Casacos', 'para durar'],
    subtitle: ['Vinte e quatro casacos cortados em tecidos que as tecelagens não conseguiram vender'],
    meta: 'Apresentação para compradores · Paris · 4 de março de 2027',
  },
  section: {
    name: 'O tecido',
    part: 'Parte um',
    title: ['O tecido'],
    subtitle: 'De onde vem cada metro da coleção.',
  },
  agenda: {
    name: 'Pauta',
    title: 'Na mesa nesta manhã',
    intro:
      'Quarenta minutos sobre uma coleção de vinte e quatro casacos: de onde veio o tecido, como o cortamos para que quase nada fique no chão e como encomendá-la para o outono. Depois, os próprios casacos, na arara.',
    items: [
      ['O tecido: ', '1.840 metros de três tecelagens, e por que 86% eram sobras.'],
      ['O corte: ', 'moldes que deixam no chão 3% do tecido, não 15%.'],
      ['O ateliê: ', 'trinta e uma horas de trabalho manual em cada casaco, no Porto.'],
      ['Pedidos: ', 'como encomendar para setembro, e o que ainda fazemos sob medida.'],
    ],
  },
  cloth: {
    name: 'O tecido em números',
    kicker: 'O tecido em números',
    title: 'Uma coleção cortada em sobras',
    hero: {
      value: '86%',
      label: 'da lã é sobra de estoque',
      note: '1.582 dos 1.840 metros vieram dos estoques encalhados de três tecelagens.',
    },
    others: [
      ['24', 'casacos na coleção'],
      ['3', 'tecelagens: Biella, Huddersfield e Bursa'],
      ['31', 'horas de trabalho manual em cada casaco'],
    ],
  },
  cutting: {
    name: 'O corte',
    kicker: 'Corte sem desperdício',
    title: 'Como se corta um casaco',
    items: [
      [
        'Peças que se encaixam',
        'Cada molde é traçado para que as peças se encaixem no tecido como um quebra-cabeça.',
      ],
      ['Retalhos com função', 'O que sobra vira bolsos, vistas e pé de gola.'],
      ['Um alfaiate, um casaco', 'Cada casaco é cortado e costurado pelas mesmas mãos.'],
    ],
  },
  workroom: {
    name: 'A oficina',
    place: 'A oficina · Porto',
    title: ['Costurado onde', 'é cortado'],
    body: 'Doze alfaiates, uma mesa comprida e a luz do norte de uma antiga fiação de algodão.',
  },
  quote: {
    name: 'Do ateliê',
    text: 'Um casaco fica pronto na mesa de corte, muito antes de alguém vesti-lo numa passarela.',
    who: 'Inês Moreira',
    role: 'Chefe do ateliê, Ourela',
  },
  cloths: {
    name: 'Três tecidos',
    kicker: 'Três tecidos',
    title: 'Os tecidos da estação',
    cards: [
      [
        'Tecido 01 · Huddersfield',
        'Tweed espinha de peixe',
        'Uma lã pesada cor de granada, tecida para um pedido que nunca foi retirado.',
      ],
      [
        'Tecido 02 · Biella',
        'Bouclê',
        'Fio anelado do fim de uma produção, macio o bastante para um casaco sem forro.',
      ],
      [
        'Tecido 03 · Bursa',
        'Melton',
        'Sarja loden densa e feltrada, à prova de chuva e sem bainha.',
      ],
    ],
    note: 'Cada casaco traz na etiqueta da gola o nome da sua tecelagem e da sua peça de tecido.',
  },
  season: {
    name: 'A estação',
    kicker: 'A estação',
    title: 'Da tecelagem à loja',
    stops: [
      ['Jan. 2027', 'Tecido escolhido', 'Compramos 1.582 metros de sobras de três tecelagens.'],
      ['Mar. 2027', 'Pedidos abertos', 'Vinte e quatro casacos apresentados a compradores em Paris.'],
      ['Jun. 2027', 'Começa o corte', 'Cada pedido cortado à mão na oficina do Porto.'],
      ['Set. 2027', 'Nas lojas', 'Casacos entregues a 40 lojas em 11 países.'],
    ],
    note: 'Pedidos feitos até 30 de abril de 2027 são entregues na primeira semana de setembro.',
  },
  making: {
    name: 'A confecção',
    kicker: 'Como nasce um casaco',
    title: 'Trinta e uma horas, em cinco etapas',
    steps: [
      ['1 h', 'Medir', 'Vinte e duas medidas, à mão'],
      ['5 h', 'Traçar', 'Um molde traçado para o tecido'],
      ['3 h', 'Cortar', 'Tesoura, giz e uma mesa comprida'],
      ['17 h', 'Costurar', 'Entretela, costuras e mangas montadas'],
      ['5 h', 'Acabar', 'Casas de botão feitas à mão'],
    ],
    note: 'Da primeira medida à última casa de botão, um casaco leva trinta e uma horas.',
  },
  cut: {
    name: 'O corte comum, e o nosso',
    kicker: 'Por que desperdício zero',
    title: 'O corte comum, e o nosso',
    before: [
      'O corte comum',
      '15% no chão',
      'Peças dispostas uma a uma, e os vãos entre elas varridos no fim do dia.',
    ],
    after: [
      'O corte Ourela',
      'Menos de 3% de sobra',
      'Peças que se encaixam no tecido, e cada retalho costurado de volta no casaco.',
    ],
  },
  waste: {
    name: 'Desperdício',
    kicker: 'Desperdício por casaco',
    title: 'Menos tecido no chão a cada estação',
    source: 'Sobra de tecido por casaco (%), coleções Outono-Inverno 2023–2026.',
    series: ['Corte comum', 'Ourela'],
    figures: [
      ['3%', 'do tecido de um casaco sobrou em 2026, contra 12% em 2023.'],
      ['0,36 m', 'de tecido poupado por casaco, frente ao corte comum.'],
    ],
  },
  mills: {
    name: 'As tecelagens',
    kicker: 'As tecelagens',
    title: 'Cinco tecidos, três tecelagens',
    note: 'Tecido comprado em janeiro de 2027 para a coleção Outono-Inverno 2027.',
    header: ['Tecido', 'Tecelagem', 'Metros', 'Sobra', 'Casacos'],
    rows: [
      ['Tweed espinha de peixe', 'Huddersfield', '520', '100%', '7'],
      ['Bouclê', 'Biella', '380', '100%', '5'],
      ['Melton', 'Bursa', '460', '70%', '6'],
      ['Flanela', 'Biella', '220', '100%', '4'],
      ['Pelo de camelo', 'Huddersfield', '260', '54%', '2'],
    ],
  },
  team: {
    name: 'O ateliê',
    kicker: 'O ateliê',
    title: 'As mãos por trás da coleção',
    people: [
      ['Ateliê', 'Inês Moreira', 'Chefe do ateliê, corta o casaco-piloto de cada molde'],
      ['Design', 'Aiko Mori', 'Designer, traça cada molde para o seu tecido'],
      ['Modelagem', 'Kofi Asante', 'Modelista, encaixa as peças no tecido'],
      ['Tecidos', 'Omar Khalil', 'Comprador de tecidos, conhece o estoque de cada uma das tecelagens'],
    ],
  },
  closing: {
    name: 'Encerramento',
    kicker: 'Obrigado',
    title: ['Nos vemos', 'na prova'],
    lines: [
      'Pedidos abertos até 30 de abril de 2027',
      'Showroom no Porto, com hora marcada',
      'Todos os casacos na arara, para provar',
    ],
    meta: 'Ourela · Casacos de sobras de lã',
  },
};
