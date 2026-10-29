import type { HonCopy } from './copy';

export const ptBR: HonCopy = {
  footer: 'Larkfield Mutual · Resultados anuais 2026',
  hero: {
    name: 'Abertura',
    org: 'Larkfield Mutual · Resultados anuais 2026',
    title: ['Capital que fica', 'perto de casa'],
    subtitle: ['O ano de um banco que pertence', 'aos seus 412 mil associados'],
    meta: 'Assembleia Geral · 18 de março de 2027',
  },
  agenda: {
    name: 'Pauta',
    title: 'A pauta desta noite',
    intro:
      'Quarenta minutos sobre o ano de 2026 do banco que é de vocês: quanto emprestamos, quanto guardamos como capital e o que voltou para vocês, associados. Depois, as votações e as suas perguntas.',
    items: [
      ['O ano em números: ', 'crédito, capital e o que voltou para os associados.'],
      ['Casas verdes: ', 'os empréstimos para reforma, a linha que mais cresceu no ano.'],
      ['Sua poupança trabalhando: ', 'como um depósito vira o empréstimo de um vizinho, em cinco passos.'],
      ['As votações: ', 'o conselho, os auditores e o dividendo dos associados.'],
    ],
  },
  section: {
    name: 'O ano em números',
    part: 'Parte um',
    title: ['O ano em números'],
    subtitle: 'O crédito cresceu, e o capital cresceu mais rápido.',
  },
  figures: {
    name: 'Quatro números',
    kicker: 'O ano em números',
    title: '2026 em quatro números',
    hero: {
      value: '€ 1,84 bi',
      label: 'emprestados para casas e negócios dos associados',
      note: 'Alta de 12% sobre 2025, e cada euro veio da poupança dos próprios associados.',
    },
    others: [
      ['412.000', 'associados, 23.300 a mais que há um ano'],
      ['19,2%', 'índice de capital principal, ante 10,5% exigidos'],
      ['€ 22 mi', 'devolvidos aos associados em taxas melhores'],
    ],
  },
  savings: {
    name: 'Poupança e empréstimos',
    kicker: 'Poupança e crédito',
    title: 'Cada empréstimo vem da poupança',
    source: 'Saldos no fim de cada ano, em bilhões de euros, 2023–2026.',
    series: ['Poupança dos associados', 'Empréstimos aos associados'],
    figures: [
      ['81%', 'da poupança dos associados volta para eles em empréstimos; o resto é margem de segurança.'],
      ['+21%', 'de crescimento da poupança desde 2023, sem um euro tomado no mercado.'],
    ],
  },
  lines: {
    name: 'Cinco linhas',
    kicker: 'O balanço',
    title: 'Onde está o dinheiro dos associados',
    note: 'Saldos em 31 de dezembro de 2026; as taxas são o que os associados receberam ou pagaram, em média, no ano.',
    header: ['Linha', 'Saldo, € mi', 'Variação', 'Associados', 'Taxa média'],
    rows: [
      ['Contas de poupança', '4.120', '+6%', '351.000', '2,1%'],
      ['Depósitos a prazo', '2.180', '+9%', '96.000', '3,0%'],
      ['Financiamento imobiliário', '3.690', '+5%', '41.500', '3,4%'],
      ['Crédito a pequenas empresas', '1.050', '+11%', '8.200', '5,2%'],
      ['Crédito para reforma verde', '360', '+64%', '6.900', '2,9%'],
    ],
  },
  profit: {
    name: 'Para onde foi o lucro',
    kicker: 'Lucro de 2026',
    title: 'Para onde foi o lucro de € 58 mi',
    cards: [
      [
        '€ 22 mi · 38%',
        'De volta aos associados',
        'Taxas melhores que a média do mercado na poupança e nos empréstimos, o ano todo.',
      ],
      [
        '€ 31 mi · 53%',
        'Guardado como capital',
        'Cada euro guardado fortalece o banco e permite emprestar mais no ano que vem.',
      ],
      [
        '€ 5 mi · 9%',
        'O fundo comunitário',
        'Apoio a 140 projetos locais, cada um escolhido pelo voto dos associados.',
      ],
    ],
    note: 'Um banco mútuo não tem acionistas de fora para remunerar, então todo o lucro fica com os associados.',
  },
  owners: {
    name: 'Por que um banco mútuo',
    kicker: 'Por que um banco mútuo',
    title: 'De acionistas, ou de associados',
    before: [
      'Um banco de capital aberto',
      'O lucro vai embora da cidade',
      'Os dividendos vão para acionistas onde quer que morem, o conselho responde ao preço da ação e uma agência fecha quando deixa de dar lucro.',
    ],
    after: [
      'Larkfield Mutual',
      'O lucro fica com os associados',
      'Cada associado tem um voto, seja qual for o saldo; o lucro volta como taxas melhores, e as agências da cidade continuam abertas.',
    ],
  },
  homes: {
    name: 'Casas verdes',
    kicker: 'A linha que mais cresce · Casas verdes',
    title: 'Crédito que reduz a conta de luz',
    items: [
      [
        '6.900 casas reformadas',
        'Isolamento, bombas de calor e telhados solares a 2,9%, abaixo da nossa taxa imobiliária padrão.',
      ],
      [
        'Um terço a menos de energia',
        'Depois da obra, as casas dos associados gastam em média 31% menos energia.',
      ],
      [
        'Orientação antes do crédito',
        'Um consultor de energia visita cada casa primeiro, e o banco paga a visita.',
      ],
    ],
  },
  street: {
    name: 'Perto de casa',
    place: 'Rua Principal, Larkfield',
    title: ['Todo crédito', 'num raio de 20 km'],
    body: 'Só emprestamos onde nossos associados moram e trabalham, para que a poupança deles construa as ruas por onde passam todo dia.',
  },
  quote: {
    name: 'A voz de uma associada',
    text: [
      'Quem disse sim no banco já conhecia',
      'a nossa rua. Aquele empréstimo hoje são',
      'quatro fornos e onze empregos.',
    ],
    who: 'Amara Osei',
    role: 'Padeira, associada desde 2012',
  },
  lending: {
    name: 'A poupança trabalhando',
    kicker: 'Como o crédito funciona',
    title: 'Da sua poupança ao vizinho',
    steps: [
      ['Poupar', 'Um associado abre uma conta poupança'],
      ['Reunir', 'A poupança fica na cidade, sem especular'],
      ['Avaliar', 'Um gerente local conhece quem pede'],
      ['Emprestar', 'Decisão em até dez dias úteis'],
      ['Retornar', 'Os juros voltam para quem poupa'],
    ],
    note: 'Cada empréstimo é decidido em Larkfield, por quem mora aqui, nunca só por um modelo de crédito distante.',
  },
  history: {
    name: 'Nossa história',
    kicker: 'Noventa e seis anos',
    title: 'Um associado de cada vez',
    stops: [
      ['1931', 'Fundado por estivadores', 'Duzentas famílias juntam os salários para emprestar umas às outras.'],
      ['1974', 'Os primeiros financiamentos', 'Os associados começam a comprar as casas que alugavam havia décadas.'],
      ['2009', 'Sem resgate', 'Atravessa a crise financeira sem um centavo de dinheiro público.'],
      ['2026', '412.000 associados', 'O ano de maior crescimento em duas décadas.'],
    ],
    note: 'Em noventa e seis anos, o banco nunca pagou um acionista de fora, porque nunca teve um.',
  },
  team: {
    name: 'A diretoria',
    kicker: 'A diretoria',
    title: 'Quem presta contas a você',
    people: [
      ['Presidência', 'Margit Lindqvist', 'Entrou como caixa de agência em 1994'],
      ['Finanças', 'Kwame Asante', 'Diretor financeiro, mantém o capital forte'],
      ['Riscos', 'Priya Raman', 'Diretora de riscos, aprova cada grande empréstimo'],
      ['Associados', 'Tomás Herrera', 'Comanda 26 agências e o conselho de associados'],
    ],
  },
  closing: {
    name: 'Encerramento',
    kicker: 'Obrigado',
    title: ['Seu banco,', 'seu voto'],
    lines: [
      'A votação abre hoje à noite e fecha em 25 de março de 2027',
      'Resultados em todas as agências em 26 de março de 2027',
      'Perguntas ao conselho de associados, em qualquer agência',
    ],
    meta: 'Larkfield Mutual · Dos seus associados desde 1931',
  },
};
