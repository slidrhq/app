import type { TeferCopy } from './copy';

export const es: TeferCopy = {
  footer: 'Ourela · Otoño-Invierno 2027',
  hero: {
    name: 'Apertura',
    org: 'Ourela · Abrigos hechos en Oporto',
    title: ['Abrigos', 'para durar'],
    subtitle: ['Veinticuatro abrigos cortados en telas que las fábricas no lograron vender'],
    meta: 'Presentación a compradores · París · 4 de marzo de 2027',
  },
  section: {
    name: 'La tela',
    part: 'Primera parte',
    title: ['La tela'],
    subtitle: 'De dónde viene cada metro de la colección.',
  },
  agenda: {
    name: 'Orden del día',
    title: 'Sobre la mesa esta mañana',
    intro:
      'Cuarenta minutos sobre una colección de veinticuatro abrigos: de dónde viene su tela, cómo la cortamos para que casi nada quede en el suelo y cómo pedirla para el otoño. Después, los abrigos mismos, en el perchero.',
    items: [
      ['La tela: ', '1840 metros de tres fábricas textiles, y por qué el 86\u00a0% era excedente.'],
      ['El corte: ', 'patrones que dejan en el suelo el 3\u00a0% de la tela, no el 15\u00a0%.'],
      ['El taller: ', 'treinta y una horas de trabajo a mano en cada abrigo, en Oporto.'],
      ['Los pedidos: ', 'cómo pedir para septiembre, y qué seguimos haciendo a medida.'],
    ],
  },
  cloth: {
    name: 'La tela en cifras',
    kicker: 'La tela en cifras',
    title: 'Una colección cortada en excedentes',
    hero: {
      value: '86\u00a0%',
      label: 'de la lana es excedente de fábrica',
      note: '1582 de los 1840 metros salieron de los almacenes sin vender de tres fábricas.',
    },
    others: [
      ['24', 'abrigos en la colección'],
      ['3', 'fábricas: Biella, Huddersfield y Bursa'],
      ['31', 'horas de trabajo a mano en cada abrigo'],
    ],
  },
  cutting: {
    name: 'El corte',
    kicker: 'Corte sin desperdicio',
    title: 'Cómo se corta un abrigo',
    items: [
      [
        'Piezas que encajan',
        'Cada patrón se traza para que sus piezas encajen sobre la tela como un rompecabezas.',
      ],
      ['Retales con oficio', 'Lo que sobra se convierte en bolsillos, vistas y bajocuello.'],
      ['Un sastre, un abrigo', 'Cada abrigo lo cortan y lo cosen las mismas manos.'],
    ],
  },
  workroom: {
    name: 'El taller',
    place: 'El taller · Oporto',
    title: ['Cosido donde', 'se corta'],
    body: 'Doce sastres, una mesa larga y la luz del norte de una antigua fábrica de algodón.',
  },
  quote: {
    name: 'Desde el taller',
    text: 'Un abrigo se termina en la mesa de corte, mucho antes de que alguien lo luzca en una pasarela.',
    who: 'Inês Moreira',
    role: 'Jefa de taller, Ourela',
  },
  cloths: {
    name: 'Tres telas',
    kicker: 'Tres telas',
    title: 'Las telas de la temporada',
    cards: [
      [
        'Tela 01 · Huddersfield',
        'Tweed de espiga',
        'Lana pesada color granate, de un pedido que nadie recogió.',
      ],
      [
        'Tela 02 · Biella',
        'Bouclé',
        'Hilo rizado del final de una tirada, tan suave que el abrigo no necesita forro.',
      ],
      [
        'Tela 03 · Bursa',
        'Melton',
        'Una sarga loden densa y abatanada que frena la lluvia y no necesita dobladillo.',
      ],
    ],
    note: 'Cada abrigo lleva en la etiqueta del cuello el nombre de su fábrica y de su pieza.',
  },
  season: {
    name: 'La temporada',
    kicker: 'La temporada',
    title: 'De la fábrica a la tienda',
    stops: [
      ['Ene. 2027', 'Tela elegida', 'Compramos 1582 metros de excedente a tres fábricas.'],
      ['Mar. 2027', 'Se abren los pedidos', 'Veinticuatro abrigos ante los compradores en París.'],
      ['Jun. 2027', 'Empieza el corte', 'Cada pedido se corta a mano en el taller de Oporto.'],
      ['Sept. 2027', 'En las tiendas', 'Abrigos entregados a 40 tiendas en 11 países.'],
    ],
    note: 'Los pedidos hechos antes del 30 de abril de 2027 se entregan la primera semana de septiembre.',
  },
  making: {
    name: 'La confección',
    kicker: 'Cómo se hace un abrigo',
    title: 'Treinta y una horas, en cinco pasos',
    steps: [
      ['1\u00a0h', 'Medir', 'Veintidós medidas, tomadas a mano'],
      ['5\u00a0h', 'Trazar', 'Un patrón trazado según la tela'],
      ['3\u00a0h', 'Cortar', 'Tijeras y tiza en una mesa larga'],
      ['17\u00a0h', 'Coser', 'Entretela, costuras y mangas montadas'],
      ['5\u00a0h', 'Rematar', 'Ojales hechos a mano'],
    ],
    note: 'De la primera medida al último ojal, un abrigo lleva treinta y una horas.',
  },
  cut: {
    name: 'El corte de siempre, y el nuestro',
    kicker: 'Por qué sin desperdicio',
    title: 'El corte de siempre, y el nuestro',
    before: [
      'El corte de siempre',
      'Un 15\u00a0% al suelo',
      'Piezas colocadas una a una, y los huecos entre ellas barridos al final del día.',
    ],
    after: [
      'El corte Ourela',
      'Menos de un 3\u00a0% de sobrante',
      'Piezas que encajan sobre la tela, y cada retal cosido de nuevo en el abrigo.',
    ],
  },
  waste: {
    name: 'Desperdicio',
    kicker: 'Desperdicio por abrigo',
    title: 'Menos tela en el suelo cada temporada',
    source: 'Tela sobrante por abrigo (%), colecciones Otoño-Invierno 2023–2026.',
    series: ['Corte habitual', 'Ourela'],
    figures: [
      ['3\u00a0%', 'de la tela de un abrigo sobró en 2026, frente al 12\u00a0% de 2023.'],
      ['0,36\u00a0m', 'de tela ahorrados en cada abrigo frente al corte habitual.'],
    ],
  },
  mills: {
    name: 'Las fábricas',
    kicker: 'Las fábricas',
    title: 'Cinco telas, tres fábricas',
    note: 'Tela comprada en enero de 2027 para la colección Otoño-Invierno 2027.',
    header: ['Tela', 'Fábrica', 'Metros', 'Excedente', 'Abrigos'],
    rows: [
      ['Tweed de espiga', 'Huddersfield', '520', '100\u00a0%', '7'],
      ['Bouclé', 'Biella', '380', '100\u00a0%', '5'],
      ['Melton', 'Bursa', '460', '70\u00a0%', '6'],
      ['Franela', 'Biella', '220', '100\u00a0%', '4'],
      ['Pelo de camello', 'Huddersfield', '260', '54\u00a0%', '2'],
    ],
  },
  team: {
    name: 'El taller',
    kicker: 'El taller',
    title: 'Las manos detrás de la colección',
    people: [
      ['Taller', 'Inês Moreira', 'Jefa de taller, corta el primer abrigo de cada patrón'],
      ['Diseño', 'Aiko Mori', 'Diseñadora, traza cada patrón según su tela'],
      ['Patronaje', 'Kofi Asante', 'Patronista, encaja las piezas sobre la tela'],
      ['Telas', 'Omar Khalil', 'Comprador de telas, conoce el stock de cada fábrica'],
    ],
  },
  closing: {
    name: 'Cierre',
    kicker: 'Gracias',
    title: ['Nos vemos', 'en la prueba'],
    lines: [
      'Pedidos hasta el 30 de abril de 2027',
      'El showroom de Oporto, con cita previa',
      'Todos los abrigos, listos para probar',
    ],
    meta: 'Ourela · Abrigos de excedentes de lana',
  },
};
