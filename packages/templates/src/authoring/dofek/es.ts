import type { DofekCopy } from './copy';

export const es: DofekCopy = {
  footer: 'Salud del Distrito Costero · Informe 2027',
  hero: {
    name: 'Apertura',
    org: 'Salud del Distrito Costero · Informe de salud pública',
    title: ['Cuatro minutos', 'para un corazón'],
    subtitle: ['Cómo un distrito de 640.000 personas', 'aprendió a actuar antes que la ambulancia'],
    meta: 'Informe al consejo del distrito · 15 de abril de 2027',
  },
  agenda: {
    name: 'Orden del día',
    title: 'De qué hablaremos hoy',
    intro:
      'Veinte minutos sobre lo que ha cambiado el programa, lo que ocurre hoy en la calle cuando un corazón se detiene y lo que pedimos al consejo para 2027. Después responderemos a sus preguntas.',
    items: [
      ['Las cifras: ', 'qué ha cambiado para quienes sufren una parada cardiaca fuera del hospital.'],
      ['En la calle: ', 'cómo vecinos, voluntarios y desfibriladores actúan hoy juntos.'],
      ['Las personas: ', 'el equipo que dirige el programa y los voluntarios que lo acompañan.'],
      ['El año que viene: ', 'qué pedimos al consejo y para cuándo.'],
    ],
  },
  section: {
    name: 'Los primeros minutos',
    part: 'Primera parte',
    title: ['Los primeros', 'minutos'],
    subtitle: 'Por qué los minutos antes de que llegue la ambulancia deciden quién vuelve a casa.',
  },
  figures: {
    name: 'El año en cifras',
    kicker: 'El año en cifras',
    title: '2026 en cuatro cifras',
    hero: {
      value: '72',
      label: 'personas volvieron a casa tras una parada cardiaca',
      note: 'El doble que en 2023, el año anterior al inicio del programa.',
    },
    others: [
      ['6 min', 'a la primera descarga, antes 11'],
      ['920', 'desfibriladores públicos, todos localizados en el mapa'],
      ['58.000', 'vecinos formados en RCP'],
    ],
  },
  change: {
    name: 'Antes y ahora',
    kicker: 'Qué ha cambiado',
    title: 'De esperar a actuar',
    before: [
      '2023',
      'Esperar a la ambulancia',
      'Los testigos llamaban y esperaban. Dos de cada tres pacientes no recibían RCP hasta que llegaba la ambulancia, a los once minutos.',
    ],
    after: [
      '2026',
      'Actuar en los primeros minutos',
      'Los vecinos inician la RCP y un voluntario trae un desfibrilador. La primera descarga llega a los seis minutos, no a los once.',
    ],
  },
  chain: {
    name: 'La cadena de supervivencia',
    kicker: 'La cadena de supervivencia',
    title: 'Los primeros ocho minutos, paso a paso',
    steps: [
      ['00:00', 'Llamada', 'La operadora del 112 sigue en línea'],
      ['00:30', 'Aviso', 'Voluntarios a menos de 500 metros'],
      ['01:00', 'Compresiones', 'RCP hasta que llega la ayuda'],
      ['04:00', 'Descarga', 'El desfibrilador público más cercano'],
      ['08:00', 'Relevo', 'Los sanitarios toman el relevo'],
    ],
    note: 'Cada aviso se revisa en el plazo de una semana, junto con los voluntarios que acudieron.',
  },
  responders: {
    name: 'Voluntarios de guardia',
    kicker: 'Voluntarios de guardia',
    title: 'Ayuda a la vuelta de la esquina',
    items: [
      ['Avisados en segundos', 'Una aplicación avisa al momento a los voluntarios formados que están a menos de 500 metros.'],
      ['Un desfibrilador en camino', 'Un segundo voluntario trae el desfibrilador público más cercano.'],
      ['Antes que la sirena', 'En seis de cada diez avisos, un voluntario llegó al paciente antes que la ambulancia.'],
    ],
  },
  park: {
    name: 'En el parque',
    place: 'Parque de la Ribera, Distrito Costero',
    title: ['Dos horas en el parque,', 'una lección para la vida'],
    body: 'Una vez al mes, vecinos de todas las edades aprenden juntos RCP en el parque. Ya son 58.000 los que han aprendido.',
  },
  quote: {
    name: 'Palabras de una superviviente',
    text: 'Mi corazón se detuvo en una parada de autobús. Un desconocido lo mantuvo latiendo con sus manos hasta que una vecina llegó con un\u00a0desfibrilador.',
    who: 'Elif Kaya',
    role: 'Profesora de música del Casco Antiguo, hoy también voluntaria',
  },
  programmes: {
    name: 'Programas',
    kicker: 'Tres programas',
    title: 'Qué hace el programa',
    cards: [
      [
        'Programa 01',
        'RCP para todos',
        'Clases gratuitas de dos horas en colegios, empresas y centros cívicos.',
      ],
      [
        'Programa 02',
        'Voluntarios de guardia',
        'Los voluntarios cercanos reciben un aviso en cuanto se llama a la ambulancia.',
      ],
      [
        'Programa 03',
        'Desfibriladores en todas las calles',
        '920 desfibriladores públicos, en el mapa y revisados cada mes.',
      ],
    ],
    note: 'Con el servicio de ambulancias, los colegios y los ayuntamientos.',
  },
  milestones: {
    name: 'Hitos',
    kicker: 'Hitos',
    title: 'Cuatro años, cuatro pasos',
    stops: [
      ['2024', 'RCP en las aulas', 'Empiezan las clases en los 38 institutos.'],
      ['2025', 'Aviso por app', 'La aplicación arranca con 1.200 voluntarios.'],
      ['2026', '920 desfibriladores', 'Cada uno en el mapa y revisado cada mes.'],
      ['2027', 'Desde los 10 años', 'Clases de RCP en todos los colegios de primaria.'],
    ],
    note: 'Elegidos con supervivientes y equipos de ambulancia.',
  },
  trend: {
    name: 'Resultados',
    kicker: 'Resultados',
    title: 'Más RCP, más personas vuelven a casa',
    source:
      'Porcentaje de las paradas cardiacas extrahospitalarias, 2023–2026. Registro de paradas cardiacas del distrito.',
    series: ['RCP antes de la ambulancia', 'Alta del hospital'],
    figures: [
      ['67\u00a0%', 'de los pacientes recibió RCP de un testigo en 2026, frente al 36\u00a0%.'],
      ['16\u00a0%', 'volvió a casa desde el hospital, el doble que en 2023.'],
    ],
  },
  areas: {
    name: 'Las cinco zonas',
    kicker: 'Las cinco zonas',
    title: 'Cómo está cada zona',
    note: 'Datos de 2026, del registro de paradas cardiacas del distrito, enero de 2027.',
    header: ['Zona', 'Desfibriladores', 'Vecinos formados', 'RCP por testigos', 'Primera descarga'],
    rows: [
      ['El Puerto', '240', '16.200', '72\u00a0%', '5 min'],
      ['Casco Antiguo', '210', '13.900', '70\u00a0%', '5 min'],
      ['Campos del Norte', '180', '11.400', '66\u00a0%', '6 min'],
      ['La Ribera', '170', '10.300', '63\u00a0%', '7 min'],
      ['Pueblos de la sierra', '120', '6.200', '58\u00a0%', '9 min'],
    ],
  },
  team: {
    name: 'El equipo',
    kicker: 'El equipo del programa',
    title: 'Quienes hacen los cuatro minutos',
    people: [
      ['Cardiología', 'Amara Mensah', 'Cardióloga, responsable clínica del programa'],
      ['Ambulancias', 'Tomás Herrera', 'Jefe de técnicos de emergencias, dirige el centro coordinador'],
      ['Voluntarios', 'Noa Katz', 'Enfermera, forma y acompaña a los voluntarios'],
      ['Registro', 'Kenji Morita', 'Epidemiólogo, lleva el registro de paradas cardiacas'],
    ],
  },
  closing: {
    name: 'Cierre',
    kicker: 'Gracias',
    title: ['Cada minuto', 'cuenta'],
    lines: [
      'Clases gratuitas de RCP cada mes en el Parque de la Ribera',
      'Próximo informe: 14 de octubre de 2027, Casa del Distrito',
      'Inscripción de voluntarios en cualquier centro de salud',
    ],
    meta: 'Salud del Distrito Costero · Programa Cuatro Minutos',
  },
};
