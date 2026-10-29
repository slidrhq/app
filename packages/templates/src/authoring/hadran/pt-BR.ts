import type { HadranCopy } from './copy';

export const ptBR: HadranCopy = {
  footer: 'Night Tram Records · Temporada 2027',
  hero: {
    name: 'Abertura',
    org: 'Night Tram Records · Lisboa',
    title: ['A temporada', 'começa hoje'],
    subtitle: ['Doze discos novos, uma turnê por dezoito cidades e uma escola para as próximas vozes'],
    meta: 'Lançamento · Depósito dos Bondes · 21 de janeiro de 2027',
  },
  section: {
    name: 'A temporada passada',
    part: 'Parte um',
    title: ['Rebobinando', 'a temporada'],
    subtitle: 'Nossa temporada 2026, em números e em som.',
  },
  setlist: {
    name: 'Repertório',
    title: 'O repertório desta noite',
    intro:
      'Quarenta minutos sobre a temporada que vem: o que a última nos ensinou, os doze discos que vamos lançar, as dezoito cidades da turnê e a nossa escola. Depois o bar abre e a banda toca.',
    items: [
      ['A temporada passada: ', 'trinta e um shows, nove discos, quase todos os lugares vendidos.'],
      ['Como gravamos: ', 'uma sala, um take, um gravador de rolo de 1974.'],
      ['A temporada 2027: ', 'doze álbuns e uma turnê por dezoito cidades.'],
      ['A escola: ', 'sessenta e quatro adolescentes aprendendo a tocar e a gravar.'],
    ],
  },
  season: {
    name: 'A temporada passada em números',
    kicker: 'A temporada 2026',
    title: 'Quatro números da última temporada',
    hero: {
      value: '92%',
      label: 'dos lugares vendidos',
      note: 'De 37.200 lugares em trinta e um shows, ante 78% em 2025.',
    },
    others: [
      ['9', 'discos novos, todos em vinil'],
      ['31', 'shows em nove cidades'],
      ['18.500', 'discos prensados no Porto'],
    ],
  },
  room: {
    name: 'Como gravamos',
    kicker: 'Como gravamos',
    title: 'Uma sala, um take',
    items: [
      [
        'A banda toca junta',
        'Sem overdubs nem metrônomo: tocamos como no palco.',
      ],
      [
        'Direto na fita',
        'Um gravador de rolo de 1974 dá calor a cada disco.',
      ],
      [
        'Uma semana por álbum',
        'Cinco dias para gravar, dois para mixar: a sala decide.',
      ],
    ],
  },
  depot: {
    name: 'Nosso palco',
    place: 'Depósito dos Bondes, Lisboa',
    title: ['Luzes acesas', 'às nove'],
    body: 'Um depósito de bondes de 1901, hoje nosso palco: 1.400 lugares em pé sob um telhado de ferro.',
  },
  quote: {
    name: 'O olhar de uma artista',
    text: 'Tocamos cada música como se o público pudesse pedir bis. Esse é todo o trabalho.',
    who: 'Amara Diallo',
    role: 'Cantora e guitarrista, na Night Tram desde 2023',
  },
  stages: {
    name: 'A temporada 2027',
    kicker: 'A temporada 2027',
    title: 'Três palcos, uma temporada',
    cards: [
      [
        'No disco',
        'Doze álbuns',
        'Da morna cabo-verdiana ao jazz coreano, tudo gravado ao vivo e prensado em vinil.',
      ],
      [
        'No palco',
        'Dezoito cidades',
        'De Lisboa a Dacar, com um novo artista abrindo cada noite.',
      ],
      [
        'Na sala de aula',
        'Sessenta e quatro alunos',
        'Aulas noturnas gratuitas para adolescentes: guitarra, canto, bateria e gravação.',
      ],
    ],
    note: 'Um euro de cada ingresso da turnê vai para a escola.',
  },
  calendar: {
    name: 'A temporada',
    kicker: 'Parada a parada',
    title: 'A temporada, de março a outubro',
    stops: [
      ['Março', 'O primeiro disco', 'O álbum do Maré Alta, gravado em uma noite.'],
      ['Maio', 'Uma escola nossa', 'Quatro salas de ensaio abrem para sessenta e quatro alunos.'],
      ['Julho', 'Noites do Depósito', 'Três noites ao ar livre no pátio do depósito.'],
      ['Outubro', 'Pé na estrada', 'A turnê começa em Lisboa e passa por dezoito cidades.'],
    ],
    note: 'Todo disco sai primeiro em vinil e, um mês depois, em todo lugar.',
  },
  making: {
    name: 'Da demo ao disco',
    kicker: 'Como nasce um disco',
    title: 'Um disco em cinco passos',
    steps: [
      ['Ouvir', 'Cada demo, até o fim'],
      ['Gravar', 'Uma sala, ao vivo na fita'],
      ['Mixar', 'De ouvido, em dois dias'],
      ['Prensar', 'De 300 cópias, no Porto'],
      ['Tocar', 'Lançado no Depósito'],
    ],
    note: 'Da primeira audição à noite de lançamento: quatro meses.',
  },
  school: {
    name: 'A escola',
    kicker: 'A escola',
    title: 'De uma sala a um conjunto',
    before: [
      '2025',
      'Doze alunos, uma sala',
      'Aulas três noites por semana numa sala de ensaio emprestada, com dois professores.',
    ],
    after: [
      '2027',
      'Sessenta e quatro alunos, um conjunto',
      'Quatro salas próprias, oito professores e um conjunto jovem que abre a turnê.',
    ],
  },
  growth: {
    name: 'Discos e ingressos',
    kicker: 'Vinil e ao vivo',
    title: 'Discos e ingressos, ambos em alta',
    source: 'Discos de vinil prensados e ingressos vendidos, em milhares, 2023–2026.',
    series: ['Discos de vinil', 'Ingressos de shows'],
    figures: [
      ['3×', 'mais discos prensados do que em 2023.'],
      ['34.200', 'ingressos vendidos em 2026, nossa melhor temporada.'],
    ],
  },
  tour: {
    name: 'A turnê',
    kicker: 'A turnê',
    title: 'Cinco das dezoito datas',
    note: 'Dezoito datas de 2 de outubro a 28 de novembro de 2027; ingressos à venda a partir de 1º de fevereiro.',
    header: ['Cidade', 'Data', 'Lugares', 'Atração principal', 'Show de abertura'],
    rows: [
      ['Lisboa', '2 de outubro', '1.400', 'Amara Diallo', 'O conjunto da escola'],
      ['Porto', '6 de outubro', '900', 'Maré Alta', 'Tomás Reis'],
      ['Madri', '10 de outubro', '1.100', 'Seo-yeon Park Trio', 'Mira Kaplan'],
      ['Paris', '15 de outubro', '1.600', 'Amara Diallo', 'Kofi Mensah'],
      ['Dacar', '7 de novembro', '2.000', 'Amara Diallo', 'Maré Alta'],
    ],
  },
  team: {
    name: 'A equipe',
    kicker: 'A equipe',
    title: 'As pessoas por trás dos discos',
    people: [
      ['Lisboa', 'Inês Carvalho', 'Fundadora, ainda ouve pessoalmente cada demo'],
      ['Dacar', 'Moussa Ndiaye', 'Produtor, grava cada álbum ao vivo'],
      ['Seul', 'Ji-woo Han', 'Gerente de turnê, dezoito cidades em 2027'],
      ['Haifa', 'Eitan Mizrahi', 'Diretor da escola, dá aulas de guitarra'],
    ],
  },
  closing: {
    name: 'Encerramento',
    kicker: 'Obrigado',
    title: ['Mais uma', 'música?'],
    lines: [
      'O disco do Maré Alta sai em 5 de março de 2027',
      'Ingressos da turnê à venda a partir de 1º de fevereiro',
      'Inscrições para a escola até 15 de abril',
    ],
    meta: 'Night Tram Records · Depósito dos Bondes, Lisboa',
  },
};
