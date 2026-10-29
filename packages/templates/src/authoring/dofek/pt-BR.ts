import type { DofekCopy } from './copy';

export const ptBR: DofekCopy = {
  footer: 'Saúde do Distrito Litorâneo · Informe 2027',
  hero: {
    name: 'Abertura',
    org: 'Saúde do Distrito Litorâneo · Informe de saúde pública',
    title: ['Quatro minutos', 'por um coração'],
    subtitle: ['Como um distrito de 640 mil pessoas', 'aprendeu a agir antes da ambulância'],
    meta: 'Informe ao conselho distrital · 15 de abril de 2027',
  },
  agenda: {
    name: 'Pauta',
    title: 'O que vamos ver hoje',
    intro:
      'Vinte minutos sobre o que o programa mudou, o que acontece hoje na rua quando um coração para e o que pedimos ao conselho para 2027. Depois, abrimos espaço para as perguntas de vocês.',
    items: [
      ['Os números: ', 'o que mudou para quem sofre uma parada cardíaca fora do hospital.'],
      ['Na rua: ', 'como vizinhos, voluntários e desfibriladores agem juntos hoje.'],
      ['As pessoas: ', 'a equipe que conduz o programa e os voluntários ao seu lado.'],
      ['O próximo ano: ', 'o que pedimos ao conselho, e até quando.'],
    ],
  },
  section: {
    name: 'Os primeiros minutos',
    part: 'Parte um',
    title: ['Os primeiros', 'minutos'],
    subtitle: 'Por que os minutos antes da chegada da ambulância decidem quem volta para casa.',
  },
  figures: {
    name: 'O ano em números',
    kicker: 'O ano em números',
    title: '2026 em quatro números',
    hero: {
      value: '72',
      label: 'pessoas sobreviveram a uma parada cardíaca e voltaram para casa',
      note: 'O dobro de 2023, o ano anterior ao início do programa.',
    },
    others: [
      ['6 min', 'até o primeiro choque, antes 11'],
      ['920', 'desfibriladores públicos no mapa'],
      ['58 mil', 'moradores treinados em RCP'],
    ],
  },
  change: {
    name: 'Antes e agora',
    kicker: 'O que mudou',
    title: 'Da espera à ação',
    before: [
      '2023',
      'Esperando a ambulância',
      'Quem presenciava ligava e esperava. Dois em cada três pacientes ficavam sem RCP até o socorro chegar, em média onze minutos depois.',
    ],
    after: [
      '2026',
      'Agindo nos primeiros minutos',
      'Vizinhos começam a RCP e um voluntário traz um desfibrilador. O primeiro choque vem aos seis minutos, não aos onze.',
    ],
  },
  chain: {
    name: 'A cadeia de sobrevivência',
    kicker: 'A cadeia de sobrevivência',
    title: 'Os primeiros oito minutos, passo a passo',
    steps: [
      ['00:00', 'Ligação', 'A atendente do 192 fica na linha'],
      ['00:30', 'Alerta', 'Voluntários a até 500 metros'],
      ['01:00', 'Compressões', 'RCP até a ajuda chegar'],
      ['04:00', 'Choque', 'O desfibrilador público mais próximo'],
      ['08:00', 'Passagem', 'A equipe do SAMU assume'],
    ],
    note: 'Cada chamado é revisado em até uma semana, junto com os voluntários que atenderam.',
  },
  responders: {
    name: 'Voluntários de plantão',
    kicker: 'Voluntários de plantão',
    title: 'Ajuda logo ali na esquina',
    items: [
      ['Alertados em segundos', 'Um aplicativo alerta na hora os voluntários treinados que estão a até 500 metros.'],
      ['Um desfibrilador a caminho', 'Um segundo voluntário corre para buscar o desfibrilador público mais próximo.'],
      ['Antes da sirene', 'Em seis de cada dez chamados, um voluntário chegou ao paciente antes da ambulância.'],
    ],
  },
  park: {
    name: 'No parque',
    place: 'Parque da Beira-Rio, Distrito Litorâneo',
    title: ['Duas horas no parque,', 'um saber para a vida'],
    body: 'Uma vez por mês, moradores de todas as idades aprendem RCP juntos no parque. Já são 58 mil.',
  },
  quote: {
    name: 'Palavras de uma sobrevivente',
    text: 'Meu coração parou num ponto de ônibus. Um desconhecido o manteve batendo com as mãos até uma vizinha chegar com um\u00a0desfibrilador.',
    who: 'Elif Kaya',
    role: 'Professora de música da Cidade Velha, hoje também voluntária',
  },
  programmes: {
    name: 'Programas',
    kicker: 'Três programas',
    title: 'O que o programa faz',
    cards: [
      [
        'Programa 01',
        'RCP para todos',
        'Aulas gratuitas de duas horas em escolas, empresas e centros comunitários.',
      ],
      [
        'Programa 02',
        'Voluntários de plantão',
        'Voluntários por perto são alertados assim que a ambulância é chamada.',
      ],
      [
        'Programa 03',
        'Desfibriladores em todas as ruas',
        '920 desfibriladores públicos, mapeados e verificados todo mês.',
      ],
    ],
    note: 'Em parceria com o SAMU, as escolas e as prefeituras.',
  },
  milestones: {
    name: 'Marcos',
    kicker: 'Marcos',
    title: 'Quatro anos, quatro passos',
    stops: [
      ['2024', 'RCP nas escolas', 'Aulas começam nas 38 escolas de ensino médio.'],
      ['2025', 'Alerta no celular', 'O aplicativo entra no ar com 1.200 voluntários.'],
      ['2026', '920 desfibriladores', 'Cada um mapeado e verificado todo mês.'],
      ['2027', 'Desde os dez anos', 'Aulas de RCP em todas as escolas do fundamental.'],
    ],
    note: 'Escolhidos com sobreviventes e equipes do SAMU.',
  },
  trend: {
    name: 'Resultados',
    kicker: 'Resultados',
    title: 'Mais RCP, mais gente de volta para casa',
    source:
      'Percentual das paradas cardíacas fora do hospital, 2023–2026. Registro distrital de paradas cardíacas.',
    series: ['RCP antes da ambulância', 'Alta hospitalar'],
    figures: [
      ['67%', 'dos pacientes receberam RCP de quem passava, ante 36% em 2023.'],
      ['16%', 'tiveram alta e voltaram para casa, o dobro de 2023.'],
    ],
  },
  areas: {
    name: 'As cinco regiões',
    kicker: 'As cinco regiões',
    title: 'Como está cada região',
    note: 'Dados de 2026, do registro distrital de paradas cardíacas, janeiro de 2027.',
    header: ['Região', 'Desfibriladores', 'Moradores treinados', 'RCP antes da ambulância', 'Primeiro choque'],
    rows: [
      ['Porto', '240', '16.200', '72%', '5 min'],
      ['Cidade Velha', '210', '13.900', '70%', '5 min'],
      ['Campos do Norte', '180', '11.400', '66%', '6 min'],
      ['Beira-Rio', '170', '10.300', '63%', '7 min'],
      ['Vilas da Serra', '120', '6.200', '58%', '9 min'],
    ],
  },
  team: {
    name: 'A equipe',
    kicker: 'A equipe do programa',
    title: 'Quem faz os quatro minutos',
    people: [
      ['Cardiologia', 'Amara Mensah', 'Cardiologista, líder clínica do programa'],
      ['SAMU', 'Tomás Herrera', 'Socorrista-chefe, comanda a central de regulação'],
      ['Voluntários', 'Noa Katz', 'Enfermeira, treina e acompanha os voluntários'],
      ['Registro', 'Kenji Morita', 'Epidemiologista, mantém o registro de paradas cardíacas'],
    ],
  },
  closing: {
    name: 'Encerramento',
    kicker: 'Obrigado',
    title: ['Cada minuto', 'conta'],
    lines: [
      'Aulas gratuitas de RCP todo mês no Parque da Beira-Rio',
      'Próximo informe: 14 de outubro de 2027, Casa do Distrito',
      'Seja voluntário em qualquer posto de saúde do distrito',
    ],
    meta: 'Saúde do Distrito Litorâneo · Programa Quatro Minutos',
  },
};
