import type { RakiaCopy } from './copy';

export const es: RakiaCopy = {
  footer: 'Observatorio de Meridian Peak · Primera luz 2027',
  hero: {
    name: 'Apertura',
    org: 'Observatorio de Meridian Peak · Sesión de primera luz',
    title: ['Primera', 'luz'],
    subtitle: ['Un telescopio de 2,4 metros abre su ojo a la noche'],
    meta: 'Meridian Peak · 2410 metros · 12 de marzo de 2027',
  },
  section: {
    name: 'El telescopio',
    part: 'Primera parte',
    title: ['El telescopio'],
    subtitle: 'Doce años, de un boceto a un espejo.',
  },
  agenda: {
    name: 'Esta noche',
    title: 'Esta noche, en cuatro partes',
    intro:
      'Cuarenta minutos sobre el telescopio que recibe esta semana su primera luz de estrellas, lo que observará en su primera temporada y cómo cada universidad socia compartirá sus noches. Después abrimos la cúpula.',
    items: [
      ['El telescopio: ', 'doce años desde el primer boceto hasta un espejo pulido de 2,4 metros.'],
      ['El sitio: ', 'por qué Meridian Peak es más oscuro y estable que cualquier lugar medido.'],
      ['La primera temporada: ', 'tres programas de investigación y los objetos que observan primero.'],
      ['Compartir las noches: ', 'cómo un socio pide tiempo y cómo participa el público.'],
    ],
  },
  figures: {
    name: 'En cifras',
    kicker: 'El telescopio en cifras',
    title: 'Dieciséis veces más luz',
    hero: {
      value: '16×',
      label: 'la luz de nuestro viejo telescopio de 60 cm',
      note: 'Un espejo cuatro veces más ancho reúne dieciséis veces más luz: fotografiar una galaxia tenue lleva minutos, no horas.',
    },
    others: [
      ['2,4 m', 'de diámetro del espejo primario'],
      ['2410 m', 'sobre el mar, por encima de la bruma'],
      ['291', 'noches despejadas al año, de media'],
    ],
  },
  mirror: {
    name: 'El espejo',
    kicker: 'Dentro de la cúpula',
    title: 'Un espejo pulido durante dos años',
    items: [
      ['Fundido en una sola pieza', 'El vidrio se enfrió tres meses en su molde para no agrietarse.'],
      [
        'Pulido a 18 nanómetros',
        'Su superficie se aparta de la curva perfecta menos de una milésima de cabello.',
      ],
      [
        'Plata, no aluminio',
        'Una capa de plata refleja más infrarrojo, donde más brillan las estrellas frías.',
      ],
    ],
  },
  site: {
    name: 'El sitio',
    place: 'Meridian Peak, 2410 metros',
    title: ['Más oscuro que todo', 'lo que medimos'],
    body: 'Cinco años de pruebas apenas hallaron resplandor de ciudades, y sí un aire lo bastante estable para ver estrellas nítidas casi todas las noches.',
  },
  quote: {
    name: 'En la primera luz',
    text: 'Durante doce años construimos una máquina para un solo instante: la primera luz de las estrellas llegando a su espejo.',
    who: 'Amara Okafor',
    role: 'Directora del Observatorio de Meridian Peak',
  },
  programmes: {
    name: 'La primera temporada',
    kicker: 'Tres programas de investigación',
    title: 'Lo que miramos primero',
    cards: [
      [
        'Programa 01',
        'Otros mundos',
        'Cronometrar la leve caída de luz de una estrella cuando un planeta pasa por delante.',
      ],
      [
        'Programa 02',
        'Asteroides cercanos',
        'Hallar pronto asteroides pequeños y fijar sus órbitas en pocos días.',
      ],
      [
        'Programa 03',
        'Estrellas pulsantes',
        'Seguir estrellas cuyo brillo sube y baja: las varas de medir del cosmos.',
      ],
    ],
    note: 'Cada programa comparte sus noches con las universidades socias, y sus datos con todos al cabo de un año.',
  },
  milestones: {
    name: 'Hitos',
    kicker: 'Del vidrio a la luz de las estrellas',
    title: 'Cuatro años, cuatro hitos',
    stops: [
      ['2024', 'Se funde el espejo', 'El vidrio se enfría tres meses antes de empezar el pulido.'],
      ['2025', 'Se alza la cúpula', 'Una cúpula de 14 metros se levanta en la cumbre en una sola temporada.'],
      ['2026', 'Llega la óptica', 'El espejo pulido sube la carretera de montaña a paso de peatón.'],
      ['2027', 'Primera luz', 'El telescopio toma su primera imagen del cielo el 12 de marzo.'],
    ],
    note: 'El espejo pasó dos de estos cuatro años en la máquina de pulir.',
  },
  nights: {
    name: 'Compartir las noches',
    kicker: 'Cómo se reparten las noches',
    title: 'De una pregunta a una imagen, en cinco pasos',
    steps: [
      ['Proponer', 'Un socio pide noches'],
      ['Evaluar', 'Un comité ordena cada solicitud'],
      ['Programar', 'Noches según la Luna'],
      ['Observar', 'El telescopio trabaja hasta el alba'],
      ['Compartir', 'Datos al socio, luego a todos'],
    ],
    note: 'Dos convocatorias al año; casi todos los programas aprobados observan antes de seis semanas.',
  },
  views: {
    name: 'Antes y ahora',
    kicker: 'El mismo trozo de cielo',
    title: 'Lo que muestra dieciséis veces más luz',
    before: [
      'Desde 1998',
      'El telescopio de 60 centímetros',
      'Tras una hora de exposición: una mancha tenue de galaxia y unas decenas de estrellas.',
    ],
    after: [
      'Desde 2027',
      'El telescopio de 2,4 metros',
      'Tras cuatro minutos: los brazos espirales de la galaxia y cientos de estrellas.',
    ],
  },
  clear: {
    name: 'Noches despejadas',
    kicker: 'Cinco años de pruebas de sitio',
    title: 'Noches despejadas, estación por estación',
    source: 'Noches despejadas seis horas o más, media de las pruebas de 2022–2026.',
    seasons: ['Invierno', 'Primavera', 'Verano', 'Otoño'],
    series: ['Noches despejadas', 'Noches de buen seeing'],
    figures: [
      ['291', 'noches despejadas al año: cuatro de cada cinco.'],
      ['0,7″', 'el desenfoque típico por el aire: la mitad que en el sitio viejo.'],
    ],
  },
  targets: {
    name: 'Primeros objetivos',
    kicker: 'La primera temporada',
    title: 'Cinco objetos para las primeras noches',
    note: 'Noches programadas de marzo a junio de 2027; distancias redondeadas.',
    header: ['Objeto', 'Tipo', 'Años luz', 'Noches', 'Programa'],
    rows: [
      ['Nebulosa de Orión', 'Cuna de estrellas', '1350', '3', 'Primera luz'],
      ['Cúmulo del Pesebre', 'Cúmulo estelar', '577', '5', 'Calibración'],
      ['Galaxia del Remolino', 'Galaxia espiral', '23 millones', '8', 'Noches públicas'],
      ['Delta Cephei', 'Estrella pulsante', '890', '10', 'Estrellas pulsantes'],
      ['55 Cancri', 'Estrella con cinco planetas', '41', '12', 'Otros mundos'],
    ],
  },
  team: {
    name: 'El equipo',
    kicker: 'Junto al telescopio',
    title: 'Las personas detrás de la primera luz',
    people: [
      ['Dirección', 'Amara Okafor', 'Directora, lidera el proyecto desde el primer boceto'],
      ['Óptica', 'Tomás Arriaga', 'Ingeniero óptico, guio dos años de pulido'],
      ['Datos', 'Hana Sato', 'Científica de datos, limpia las imágenes de cada noche'],
      ['Noches públicas', 'Yonatan Levi', 'Educador, sube escuelas y visitantes hasta la cúpula'],
    ],
  },
  closing: {
    name: 'Cierre',
    kicker: 'Gracias',
    title: ['Cielos', 'despejados'],
    lines: [
      'Noche pública de primera luz: sábado 13 de marzo de 2027',
      'Centro de visitantes de Meridian Peak, desde el atardecer',
      'Los socios piden noches desde el 1 de abril de 2027',
    ],
    meta: 'Observatorio de Meridian Peak · 2410 metros sobre el mar',
  },
};
