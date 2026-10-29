import type { HonCopy } from './copy';

export const es: HonCopy = {
  footer: 'Larkfield Mutual · Resultados anuales 2026',
  hero: {
    name: 'Apertura',
    org: 'Larkfield Mutual · Resultados anuales 2026',
    title: ['Capital que se', 'queda en casa'],
    subtitle: ['El año de un banco que pertenece', 'a sus 412.000 socios'],
    meta: 'Asamblea General · 18 de marzo de 2027',
  },
  agenda: {
    name: 'Orden del día',
    title: 'Esta noche, en el orden del día',
    intro:
      'Cuarenta minutos sobre el año 2026 del banco que es suyo: cuánto prestamos, cuánto guardamos como capital y qué les volvió a ustedes, los socios. Después, las votaciones y sus preguntas.',
    items: [
      ['El año en cifras: ', 'crédito, capital y lo que volvió a los socios.'],
      ['Hogares verdes: ', 'los préstamos de rehabilitación, los que más crecieron este año.'],
      ['Su ahorro, trabajando: ', 'cómo un depósito se convierte en el préstamo de un vecino, en cinco pasos.'],
      ['Las votaciones: ', 'el consejo, los auditores y el dividendo de los socios.'],
    ],
  },
  section: {
    name: 'El año en cifras',
    part: 'Primera parte',
    title: ['El año en cifras'],
    subtitle: 'El crédito creció, y el capital creció más rápido.',
  },
  figures: {
    name: 'Cuatro cifras',
    kicker: 'El año en cifras',
    title: '2026 en cuatro cifras',
    hero: {
      value: '1.840\u00a0M€',
      label: 'prestados a hogares y negocios de los socios',
      note: 'Un 12\u00a0% más que en 2025, y cada euro financiado con el ahorro de los propios socios.',
    },
    others: [
      ['412.000', 'socios, 23.300 más que hace un año'],
      ['19,2\u00a0%', 'ratio de capital básico, frente al 10,5\u00a0% exigido'],
      ['22\u00a0M€', 'devueltos a los socios en mejores tipos'],
    ],
  },
  savings: {
    name: 'Ahorro y préstamos',
    kicker: 'Ahorro y crédito',
    title: 'Cada préstamo sale de los socios',
    source: 'Saldos a final de cada año, en miles de millones de euros, 2023–2026.',
    series: ['Ahorro de los socios', 'Préstamos a socios'],
    figures: [
      ['81\u00a0%', 'del ahorro de los socios vuelve a ellos como préstamos; el resto es margen de seguridad.'],
      ['+21\u00a0%', 'de crecimiento del ahorro desde 2023, sin pedir un euro a los mercados.'],
    ],
  },
  lines: {
    name: 'Cinco líneas',
    kicker: 'El balance',
    title: 'Dónde está el dinero de los socios',
    note: 'Saldos a 31 de diciembre de 2026; los tipos son lo que los socios cobraron o pagaron de media en el año.',
    header: ['Línea', 'Saldo, M€', 'Variación', 'Socios', 'Tipo medio'],
    rows: [
      ['Cuentas de ahorro', '4.120', '+6\u00a0%', '351.000', '2,1\u00a0%'],
      ['Depósitos a plazo', '2.180', '+9\u00a0%', '96.000', '3,0\u00a0%'],
      ['Hipotecas', '3.690', '+5\u00a0%', '41.500', '3,4\u00a0%'],
      ['Préstamos a pymes', '1.050', '+11\u00a0%', '8.200', '5,2\u00a0%'],
      ['Rehabilitación verde', '360', '+64\u00a0%', '6.900', '2,9\u00a0%'],
    ],
  },
  profit: {
    name: 'Adónde fue el beneficio',
    kicker: 'Beneficio 2026',
    title: 'Adónde fue el beneficio de 58\u00a0M€',
    cards: [
      [
        '22\u00a0M€ · 38\u00a0%',
        'De vuelta a los socios',
        'Tipos mejores que la media del mercado, en ahorro y en préstamos, todo el año.',
      ],
      [
        '31\u00a0M€ · 53\u00a0%',
        'Guardado como capital',
        'Cada euro guardado fortalece el banco y le permite prestar más el año que viene.',
      ],
      [
        '5\u00a0M€ · 9\u00a0%',
        'El fondo social',
        'Ayudas a 140 proyectos locales, cada uno elegido por votación de los socios.',
      ],
    ],
    note: 'Un banco mutualista no tiene accionistas externos a los que pagar, así que todo el beneficio se queda con sus socios.',
  },
  owners: {
    name: 'Por qué mutualista',
    kicker: 'Por qué un banco mutualista',
    title: 'De accionistas, o de socios',
    before: [
      'Un banco cotizado',
      'El beneficio se va de la ciudad',
      'Los dividendos van a los accionistas vivan donde vivan, el consejo responde a la cotización y una sucursal cierra en cuanto deja de dar dinero.',
    ],
    after: [
      'Larkfield Mutual',
      'El beneficio se queda con los socios',
      'Cada socio tiene un voto, sea cual sea su saldo; el beneficio le vuelve en mejores tipos y las sucursales de su ciudad siguen abiertas.',
    ],
  },
  homes: {
    name: 'Hogares verdes',
    kicker: 'La línea que más crece · Hogares verdes',
    title: 'Préstamos que ahorran energía',
    items: [
      [
        '6.900 hogares rehabilitados',
        'Aislamiento, bombas de calor y tejados solares, al 2,9\u00a0%, por debajo de nuestra hipoteca habitual.',
      ],
      [
        'Un tercio menos de energía',
        'Tras las obras, las casas de los socios consumen de media un 31\u00a0% menos de energía.',
      ],
      [
        'Asesoría antes del préstamo',
        'Un asesor energético visita primero cada casa, y el banco paga la visita.',
      ],
    ],
  },
  street: {
    name: 'Cerca de casa',
    place: 'Calle Mayor, Larkfield',
    title: ['Todo préstamo,', 'a menos de 20\u00a0km'],
    body: 'Solo prestamos donde nuestros socios viven y trabajan, para que su ahorro construya las calles que recorren cada día.',
  },
  quote: {
    name: 'La voz de una socia',
    text: [
      'Quien nos dijo que sí en el banco',
      'ya conocía nuestra calle. Aquel préstamo',
      'hoy son cuatro hornos y once empleos.',
    ],
    who: 'Amara Osei',
    role: 'Panadera, socia desde 2012',
  },
  lending: {
    name: 'El ahorro, trabajando',
    kicker: 'Cómo prestamos',
    title: 'Del ahorro al préstamo del vecino',
    steps: [
      ['Ahorrar', 'Un socio abre una cuenta de ahorro'],
      ['Reunir', 'El ahorro no sale de la ciudad'],
      ['Evaluar', 'Un asesor local conoce al prestatario'],
      ['Prestar', 'Decisión en diez días hábiles'],
      ['Devolver', 'Los intereses vuelven a los ahorradores'],
    ],
    note: 'Cada préstamo se decide en Larkfield, por gente que vive aquí, nunca solo por un lejano modelo de crédito.',
  },
  history: {
    name: 'Nuestra historia',
    kicker: 'Noventa y seis años',
    title: 'Construido socio a socio',
    stops: [
      ['1931', 'Fundado por estibadores', 'Doscientas familias juntan sus sueldos para prestarse.'],
      ['1974', 'Las primeras hipotecas', 'Los socios compran las casas que llevaban décadas alquilando.'],
      ['2009', 'Sin rescate', 'Atraviesa la crisis financiera sin un céntimo de dinero público.'],
      ['2026', '412.000 socios', 'El año de mayor crecimiento en dos décadas.'],
    ],
    note: 'En noventa y seis años el banco nunca ha pagado a un accionista externo, porque nunca ha tenido ninguno.',
  },
  team: {
    name: 'El equipo directivo',
    kicker: 'El equipo directivo',
    title: 'Quienes le rinden cuentas',
    people: [
      ['Dirección general', 'Margit Lindqvist', 'Entró como cajera de sucursal en 1994'],
      ['Finanzas', 'Kwame Asante', 'Director financiero, mantiene sólido el capital'],
      ['Riesgos', 'Priya Raman', 'Directora de riesgos, aprueba cada préstamo grande'],
      ['Socios', 'Tomás Herrera', 'Dirige 26 sucursales y el consejo de socios'],
    ],
  },
  closing: {
    name: 'Cierre',
    kicker: 'Gracias',
    title: ['Su banco,', 'su voto'],
    lines: [
      'La votación abre esta noche y cierra el 25 de marzo de 2027',
      'Resultados en cada sucursal el 26 de marzo de 2027',
      'Preguntas al consejo de socios, en cualquier sucursal',
    ],
    meta: 'Larkfield Mutual · De sus socios desde 1931',
  },
};
