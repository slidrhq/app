import type { SadeCopy } from './copy';

export const es: SadeCopy = {
  footer: 'Commonfield · Informe de cosecha 2026',
  hero: {
    name: 'Apertura',
    org: 'Commonfield · Cooperativa de productores',
    title: ['Raíces hondas,', 'silos llenos'],
    subtitle: ['Cómo 212 fincas familiares cosecharon', 'más grano con menos agua'],
    meta: 'Asamblea de socios · 14 de enero de 2027',
  },
  section: {
    name: 'La temporada',
    part: 'Primera parte',
    title: ['La temporada', 'en el campo'],
    subtitle: 'De la primera lluvia a la última carga que entró en el silo.',
  },
  agenda: {
    name: 'Orden del día',
    title: 'Lo que veremos esta mañana',
    intro:
      'Cuarenta minutos sobre la cosecha de 2026: qué cultivamos, cuánta agua hizo falta y qué nos contó el suelo. Después, el plan para la temporada 2027 y tiempo para sus preguntas.',
    items: [
      ['La cosecha: ', '18.400 toneladas de grano de 212 fincas, y adónde fueron.'],
      ['El agua: ', 'cómo el goteo y los cultivos de cobertura redujeron el agua por tonelada.'],
      ['El suelo: ', 'lo que tres años de análisis muestran bajo nuestros campos.'],
      ['La temporada 2027: ', 'el banco de semillas, la maquinaria compartida y el calendario.'],
    ],
  },
  figures: {
    name: 'La cosecha en cifras',
    kicker: 'La cosecha en cifras',
    title: '2026 en cuatro cifras',
    hero: {
      value: '18.400',
      label: 'toneladas de grano cosechadas',
      note: 'Un 12\u00a0% más que en 2025, en las mismas 9.600 hectáreas y con menos agua.',
    },
    others: [
      ['212', 'fincas familiares en la cooperativa'],
      ['9.600', 'hectáreas cultivadas'],
      ['31\u00a0%', 'menos agua por tonelada que en 2023'],
    ],
  },
  project: {
    name: 'Proyecto del año',
    kicker: 'Proyecto del año · Riego por goteo',
    title: 'El agua a la raíz, no al surco',
    items: [
      [
        'Una línea para cada hilera',
        'Líneas enterradas en 1.400 hectáreas riegan cada hilera en la raíz, de noche, cuando se pierde poca agua.',
      ],
      [
        'Sensores en el suelo',
        'Sondas de humedad a 30 y 60\u00a0cm indican a las bombas cuándo regar y cuándo esperar.',
      ],
      [
        'Pagado en tres temporadas',
        'Las bombas compartidas y la tubería comprada al por mayor reducen a la mitad el coste de cada finca, y el agua ahorrada paga el resto.',
      ],
    ],
  },
  fields: {
    name: 'Desde arriba',
    place: 'Los campos del norte, desde el dron',
    title: ['Cada campo,', 'cada semana, desde arriba'],
    body: 'Nuestro dron cartografía las 9.600 hectáreas cada semana, así el agrónomo ve una mancha seca antes de que se note desde la carretera.',
  },
  quote: {
    name: 'La voz de un socio',
    text: 'Mi abuelo araba este campo cada otoño. Lo dejamos, y ahora la tierra guarda la lluvia más tiempo del que nadie recuerda.',
    who: 'Omar Khalil',
    role: 'Cultiva trigo duro en 80 hectáreas, socio desde 1998',
  },
  programmes: {
    name: 'Programas',
    kicker: 'Tres programas',
    title: 'Lo que hacemos juntos',
    cards: [
      [
        'Programa 01',
        'Cultivos de cobertura',
        'Veza y trébol entre cosechas alimentan el suelo y evitan que el viento se lo lleve.',
      ],
      [
        'Programa 02',
        'Riego por goteo',
        'Bombas compartidas, tubería al por mayor y una cuadrilla que equipa una finca entera en una semana.',
      ],
      [
        'Programa 03',
        'Banco de semillas',
        'Cuarenta variedades locales, probadas en nuestras parcelas de ensayo y prestadas a los socios en cada siembra.',
      ],
    ],
    note: 'Cualquier finca socia puede unirse a cualquier programa; la cooperativa paga la primera temporada.',
  },
  season: {
    name: 'La próxima temporada',
    kicker: 'La temporada 2027',
    title: 'El año 2027, estación por estación',
    stops: [
      ['Invierno', 'Reservas de semillas', 'Los socios reservan variedades para la siembra.'],
      ['Primavera', 'Goteo, segunda fase', 'Sesenta fincas más se suman a las bombas compartidas.'],
      ['Verano', 'Cosecha', 'Las cosechadoras compartidas siguen un único calendario de reservas.'],
      ['Otoño', 'Siembra', 'La cobertura deja paso al trigo y al garbanzo.'],
    ],
    note: 'Cada fecha se fija con los socios al comienzo de cada temporada.',
  },
  joining: {
    name: 'El cambio',
    kicker: 'Sumarse al cambio',
    title: 'Cómo cambia una finca, en cinco pasos',
    steps: [
      ['Análisis del suelo', 'Muestras por campo'],
      ['Plan de campo', 'Trazado con un agrónomo'],
      ['Cobertura', 'Sembrada tras la cosecha'],
      ['Goteo', 'Instalado por la cuadrilla común'],
      ['Primera cosecha', 'Pesada y comparada'],
    ],
    note: 'Del primer análisis del suelo a la primera cosecha con el nuevo plan pasan unos catorce meses.',
  },
  soil: {
    name: 'Bajo nuestros campos',
    kicker: 'Por qué dejamos de arar',
    title: 'El mismo suelo, dos formas de cultivar',
    before: [
      'Hasta 2023',
      'Arado cada otoño',
      'Se formó una suela dura a 25\u00a0cm. La lluvia escurría por el suelo desnudo, y las raíces se detenían donde empezaba la suela.',
    ],
    after: [
      'Desde 2024',
      'Sin arado, con cobertura',
      'Las raíces llegan ya a 90\u00a0cm y las lombrices han vuelto. El mismo suelo absorbe el doble de lluvia.',
    ],
  },
  water: {
    name: 'El agua',
    kicker: 'El agua',
    title: 'Menos agua por cada tonelada',
    source: 'Metros cúbicos de agua de riego por tonelada de grano, 2023–2026.',
    series: ['Fincas de Commonfield', 'Media regional'],
    figures: [
      ['31\u00a0%', 'menos agua por tonelada desde 2023, en las 212 fincas.'],
      ['359', 'metros cúbicos por tonelada en 2026; la región aún usa 524.'],
    ],
  },
  crops: {
    name: 'Los cultivos',
    kicker: 'Los cultivos',
    title: 'Cinco cultivos de la cosecha 2026',
    note: 'Datos de 2026, de la báscula y de los registros de campo de la cooperativa.',
    header: ['Cultivo', 'Hectáreas', 'Toneladas', 'Toneladas por ha', 'Agua, m³ por tonelada'],
    rows: [
      ['Trigo duro', '4.200', '9.240', '2,2', '340'],
      ['Cebada', '2.100', '4.410', '2,1', '300'],
      ['Garbanzo', '1.600', '2.240', '1,4', '410'],
      ['Lenteja', '900', '1.080', '1,2', '380'],
      ['Girasol', '800', '1.430', '1,8', '570'],
    ],
  },
  team: {
    name: 'El equipo',
    kicker: 'El equipo de la cooperativa',
    title: 'Las personas detrás de la cosecha',
    people: [
      ['Presidenta del consejo', 'Nadia Haddad', 'Cultiva trigo y garbanzo en 64 hectáreas'],
      ['Agrónomo jefe', 'Tomás Ferreira', 'Dirige el laboratorio de suelos y los vuelos del dron'],
      ['Ingeniero hidráulico', 'Kwame Asante', 'Diseñó la red de goteo compartida'],
      ['Guardiana de semillas', 'Mei Lin', 'Prueba cuarenta variedades locales en parcelas de ensayo'],
    ],
  },
  closing: {
    name: 'Cierre',
    kicker: 'Gracias',
    title: ['Nos vemos', 'en el campo'],
    lines: [
      'Jornada en las parcelas de ensayo: 22 de abril de 2027',
      'Reservas de semillas desde el 1 de febrero de 2027',
      'El informe completo está en cada finca socia',
    ],
    meta: 'Commonfield · Cooperativa de productores',
  },
};
