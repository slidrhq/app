import type { SadeCopy } from './copy';

export const ptBR: SadeCopy = {
  footer: 'Commonfield · Relatório da safra 2026',
  hero: {
    name: 'Abertura',
    org: 'Commonfield · Cooperativa de produtores',
    title: ['Raízes fundas,', 'silos cheios'],
    subtitle: ['Como 212 propriedades familiares colheram', 'mais grãos com menos água'],
    meta: 'Assembleia de associados · 14 de janeiro de 2027',
  },
  section: {
    name: 'A safra',
    part: 'Parte um',
    title: ['A safra', 'no campo'],
    subtitle: 'Da primeira chuva à última carga despejada no silo.',
  },
  agenda: {
    name: 'Pauta',
    title: 'O que vamos ver nesta manhã',
    intro:
      'Quarenta minutos sobre a safra de 2026: o que plantamos, quanta água foi preciso e o que o solo nos contou. Depois, o plano para a safra 2027 e tempo para as suas perguntas.',
    items: [
      ['A colheita: ', '18.400 toneladas de grãos de 212 propriedades, e para onde foram.'],
      ['A água: ', 'como o gotejamento e as plantas de cobertura cortaram a água por tonelada.'],
      ['O solo: ', 'o que três anos de análises mostram sob os nossos campos.'],
      ['A safra 2027: ', 'o banco de sementes, as máquinas compartilhadas e o calendário.'],
    ],
  },
  figures: {
    name: 'A colheita em números',
    kicker: 'A colheita em números',
    title: '2026 em quatro números',
    hero: {
      value: '18.400',
      label: 'toneladas de grãos colhidas',
      note: '12% a mais que em 2025, nos mesmos 9.600 hectares e com menos água.',
    },
    others: [
      ['212', 'propriedades familiares na cooperativa'],
      ['9.600', 'hectares cultivados'],
      ['31%', 'menos água por tonelada que em 2023'],
    ],
  },
  project: {
    name: 'Projeto do ano',
    kicker: 'Projeto do ano · Gotejamento',
    title: 'Água na raiz, não no sulco',
    items: [
      [
        'Uma linha para cada fileira',
        'Linhas enterradas em 1.400 hectares regam cada fileira na raiz, à noite, quando pouca água se perde.',
      ],
      [
        'Sensores no solo',
        'Sondas de umidade a 30 e 60 cm dizem às bombas quando irrigar e quando esperar.',
      ],
      [
        'Pago em três safras',
        'Bombas compartilhadas e tubos comprados em grupo cortam pela metade o custo de cada propriedade, e a água poupada paga o resto.',
      ],
    ],
  },
  fields: {
    name: 'Do alto',
    place: 'Os campos do norte, vistos do drone',
    title: ['Cada campo,', 'toda semana, do alto'],
    body: 'Nosso drone mapeia os 9.600 hectares toda semana, e o agrônomo vê uma mancha seca antes que ela apareça da estrada.',
  },
  quote: {
    name: 'A voz de um associado',
    text: 'Meu avô arava este campo todo outono. Nós paramos, e hoje a terra segura a chuva por mais tempo do que qualquer um de nós se lembra.',
    who: 'Omar Khalil',
    role: 'Planta trigo duro em 80 hectares, associado desde 1998',
  },
  programmes: {
    name: 'Programas',
    kicker: 'Três programas',
    title: 'O que fazemos juntos',
    cards: [
      [
        'Programa 01',
        'Plantas de cobertura',
        'Ervilhaca e trevo entre as safras alimentam o solo e impedem que o vento o leve embora.',
      ],
      [
        'Programa 02',
        'Gotejamento',
        'Bombas compartilhadas, tubos comprados em grupo e uma equipe que instala uma propriedade inteira em uma semana.',
      ],
      [
        'Programa 03',
        'Banco de sementes',
        'Quarenta variedades locais, testadas nas nossas parcelas e emprestadas aos associados a cada plantio.',
      ],
    ],
    note: 'Toda propriedade associada pode entrar em qualquer programa; a cooperativa paga a primeira safra.',
  },
  season: {
    name: 'A próxima safra',
    kicker: 'A safra 2027',
    title: 'O ano que vem, estação por estação',
    stops: [
      ['Inverno', 'Reserva de sementes', 'Os associados reservam as variedades do plantio.'],
      ['Primavera', 'Gotejamento, 2ª fase', 'Mais sessenta propriedades usam as bombas comuns.'],
      ['Verão', 'Colheita', 'As colheitadeiras compartilhadas seguem uma única agenda.'],
      ['Outono', 'Plantio', 'Trigo e grão-de-bico tomam o lugar da cobertura.'],
    ],
    note: 'Cada data é definida com os associados no início de cada estação.',
  },
  joining: {
    name: 'A transição',
    kicker: 'Rumo à transição',
    title: 'A transição de uma fazenda em cinco passos',
    steps: [
      ['Análise do solo', 'Amostras por campo'],
      ['Plano do campo', 'Feito com um agrônomo'],
      ['Cobertura', 'Semeada após a colheita'],
      ['Gotejamento', 'Instalado pela equipe'],
      ['Primeira colheita', 'Pesada e comparada'],
    ],
    note: 'Da primeira análise do solo à primeira colheita no novo plano, são cerca de quatorze meses.',
  },
  soil: {
    name: 'Sob os nossos campos',
    kicker: 'Por que paramos de arar',
    title: 'O mesmo solo, dois jeitos de cultivar',
    before: [
      'Até 2023',
      'Arado todo outono',
      'Uma camada compactada se formou a 25 cm. A chuva escorria pela terra nua, e as raízes paravam onde a camada começava.',
    ],
    after: [
      'Desde 2024',
      'Plantio direto, com cobertura',
      'As raízes já chegam a 90 cm, e as minhocas voltaram. O mesmo solo absorve o dobro de chuva.',
    ],
  },
  water: {
    name: 'Água',
    kicker: 'Água',
    title: 'Menos água para cada tonelada',
    source: 'Metros cúbicos de água de irrigação por tonelada de grãos, 2023–2026.',
    series: ['Propriedades Commonfield', 'Média regional'],
    figures: [
      ['31%', 'menos água por tonelada desde 2023, nas 212 fazendas.'],
      ['359', 'm³ por tonelada em 2026; a região ainda gasta 524.'],
    ],
  },
  crops: {
    name: 'As culturas',
    kicker: 'As culturas',
    title: 'Cinco culturas da safra 2026',
    note: 'Dados de 2026, da balança rodoviária e dos registros de campo da cooperativa.',
    header: ['Cultura', 'Hectares', 'Toneladas', 'Toneladas por ha', 'Água, m³ por tonelada'],
    rows: [
      ['Trigo duro', '4.200', '9.240', '2,2', '340'],
      ['Cevada', '2.100', '4.410', '2,1', '300'],
      ['Grão-de-bico', '1.600', '2.240', '1,4', '410'],
      ['Lentilha', '900', '1.080', '1,2', '380'],
      ['Girassol', '800', '1.430', '1,8', '570'],
    ],
  },
  team: {
    name: 'A equipe',
    kicker: 'A equipe da cooperativa',
    title: 'As pessoas por trás da colheita',
    people: [
      ['Presidente do conselho', 'Nadia Haddad', 'Planta trigo e grão-de-bico em 64 hectares'],
      ['Agrônomo-chefe', 'Tomás Ferreira', 'Dirige o laboratório de solos e os voos do drone'],
      ['Engenheiro hídrico', 'Kwame Asante', 'Projetou a rede de gotejamento compartilhada'],
      ['Guardiã das sementes', 'Mei Lin', 'Testa quarenta variedades locais nas parcelas de ensaio'],
    ],
  },
  closing: {
    name: 'Encerramento',
    kicker: 'Obrigado',
    title: ['Até breve', 'no campo'],
    lines: [
      'Dia de campo nas parcelas de ensaio: 22 de abril de 2027',
      'Reservas de sementes a partir de 1º de fevereiro de 2027',
      'O relatório completo está em cada propriedade associada',
    ],
    meta: 'Commonfield · Cooperativa de produtores',
  },
};
