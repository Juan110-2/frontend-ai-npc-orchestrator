/**
 * Plantillas de inicio rápido para crear un paciente simulado.
 * Cada plantilla precarga los 5 pasos del wizard. El docente solo ajusta
 * nombre y detalles puntuales.
 */

export type ProfileTemplate = {
  id: string
  label: string
  description: string
  icon: string // nombre de lucide-react

  // Paso 1 — Identidad
  identity: {
    name: string
    identityName: string
    age: number
    occupation: string
    description: string
  }

  // Paso 2 — Perfil psicológico
  psych: {
    personality: string[]
    communicationStyle: string[]
  }

  // Paso 3 — Motivo de consulta (escenario)
  scenario: {
    name: string
    description: string
    context: string
    severity: number // 0..5
    riskFlags: string[]
  }

  // Paso 4 — Comportamiento conversacional
  behavior: {
    behaviorMin: number
    behaviorMax: number
    triggers: { name: string; description: string }[]
    regulators: { name: string; description: string }[]
  }
}

export const PROFILE_TEMPLATES: ProfileTemplate[] = [
  {
    id: 'ansiedad_academica',
    label: 'Ansiedad académica',
    description: 'Estudiante con perfeccionismo y sobrecarga',
    icon: 'GraduationCap',
    identity: {
      name: 'Valentina Rojas',
      identityName: 'Valentina Rojas',
      age: 21,
      occupation: 'Estudiante universitaria',
      description: 'Estudiante universitaria con tendencia al perfeccionismo. Le cuesta delegar y se autoexige por encima de sus posibilidades.',
    },
    psych: {
      personality: ['reservada', 'sensible', 'perfeccionista'],
      communicationStyle: ['responde breve', 'se abre con empatía', 'evita el conflicto'],
    },
    scenario: {
      name: 'Sobrecarga académica en universidad',
      description: 'Manejar la ansiedad por el rendimiento académico.',
      context: 'Acaba de salir de clase. Lleva tres noches durmiendo poco y siente que no llega a las entregas del semestre. Tiene miedo a fallar y a decepcionar a su familia.',
      severity: 3,
      riskFlags: ['insomnio', 'aislamiento reciente'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 4,
      triggers: [
        { name: 'Mención a notas', description: 'Cualquier referencia al rendimiento académico la pone tensa.' },
        { name: 'Presión a tomar acción', description: 'Si la apuran a “solucionarlo ya”, se cierra.' },
      ],
      regulators: [
        { name: 'Validación emocional', description: 'Reconocer lo que siente sin dar consejos la calma.' },
        { name: 'Preguntas abiertas', description: 'Le ayuda que la inviten a explorar sin juzgar.' },
      ],
    },
  },
  {
    id: 'duelo_reciente',
    label: 'Duelo reciente',
    description: 'Adulto joven con pérdida sentimental',
    icon: 'HeartCrack',
    identity: {
      name: 'Daniel Pérez',
      identityName: 'Daniel Pérez',
      age: 24,
      occupation: 'Empleado en empresa',
      description: 'Joven introvertido con tendencia evitativa. Hace tres semanas terminó una relación de cuatro años.',
    },
    psych: {
      personality: ['evitativo', 'sensible', 'reservado'],
      communicationStyle: ['silencios largos', 'minimiza lo que siente', 'se abre lento'],
    },
    scenario: {
      name: 'Duelo por ruptura de pareja',
      description: 'Acompanamiento en duelo reciente y procesamiento emocional.',
      context: 'Lleva tres semanas durmiendo mal y evitando ver a sus amigos. Dice que “está bien” pero llora cuando habla del tema.',
      severity: 4,
      riskFlags: ['aislamiento social', 'llanto frecuente'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 5,
      triggers: [
        { name: 'Hablar del futuro', description: 'No tolera pensar en planes a largo plazo todavía.' },
        { name: 'Minimización ("ya pasará")', description: 'Si le restan importancia, se cierra de inmediato.' },
      ],
      regulators: [
        { name: 'Escucha sin prisa', description: 'Tolerar sus silencios sin presión lo abre poco a poco.' },
        { name: 'Validación de la pérdida', description: 'Reconocer que el dolor tiene sentido lo alivia.' },
      ],
    },
  },
  {
    id: 'crisis_emocional',
    label: 'Crisis emocional',
    description: 'Severidad alta, ideación pasiva',
    icon: 'AlertTriangle',
    identity: {
      name: 'María Lozano',
      identityName: 'María Lozano',
      age: 19,
      occupation: 'Estudiante de bachillerato',
      description: 'Adolescente con baja motivación, conflictos familiares y sensación de que “a nadie le importa”.',
    },
    psych: {
      personality: ['retraída', 'desesperanzada', 'sensible'],
      communicationStyle: ['monosílabos', 'tono plano', 'evita contacto visual'],
    },
    scenario: {
      name: 'Crisis emocional con ideación pasiva',
      description: 'Contencion ante ideacion pasiva y desesperanza.',
      context: 'Lleva meses sintiéndose así. Hoy dice cosas como “sería mejor si no estuviera” sin un plan concreto, pero con frecuencia creciente.',
      severity: 5,
      riskFlags: ['ideación pasiva', 'desesperanza', 'aislamiento'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 5,
      triggers: [
        { name: 'Frases de “anímate”', description: 'Las minimizaciones la hacen sentir invisible.' },
        { name: 'Soluciones rápidas', description: 'No quiere consejos, quiere ser escuchada.' },
      ],
      regulators: [
        { name: 'Contención emocional', description: 'Frases que validan el dolor sin juzgar.' },
        { name: 'Presencia activa', description: 'Demostrar que estás ahí sin presionar.' },
      ],
    },
  },
  {
    id: 'conflicto_familiar',
    label: 'Conflicto familiar',
    description: 'Adolescente con autoexigencia',
    icon: 'Users',
    identity: {
      name: 'Sebastián Vargas',
      identityName: 'Sebastián Vargas',
      age: 17,
      occupation: 'Estudiante de bachillerato',
      description: 'Adolescente con padres exigentes y expectativas altas. Siente que nunca es suficiente.',
    },
    psych: {
      personality: ['autoexigente', 'reservado', 'introspectivo'],
      communicationStyle: ['responde a la defensiva', 'racionaliza emociones'],
    },
    scenario: {
      name: 'Conflicto familiar con autoexigencia',
      description: 'Explorar conflicto familiar y autoexigencia.',
      context: 'Tuvo una pelea fuerte con su papá ayer por sus notas. Siente que tiene que “rendir más” pero está agotado.',
      severity: 3,
      riskFlags: ['estrés familiar', 'autoexigencia'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 4,
      triggers: [
        { name: 'Comparaciones con otros', description: 'Las comparaciones lo activan a la defensiva.' },
        { name: 'Cuestionar a sus padres', description: 'Defiende a su familia aunque se sienta herido.' },
      ],
      regulators: [
        { name: 'Espacio para él, sin la familia', description: 'Sentir que el espacio es suyo lo abre.' },
        { name: 'Preguntas sobre lo que él quiere', description: 'Le ayuda escucharse a sí mismo.' },
      ],
    },
  },
  {
    id: 'estres_laboral',
    label: 'Estrés laboral',
    description: 'Adulto con burnout y miedo a fallar',
    icon: 'Briefcase',
    identity: {
      name: 'Andrea Castillo',
      identityName: 'Andrea Castillo',
      age: 32,
      occupation: 'Profesional en cargo medio',
      description: 'Profesional con sobrecarga laboral, jornadas largas y sensación de que “no se nota” lo que hace.',
    },
    psych: {
      personality: ['responsable', 'autoexigente', 'cansada'],
      communicationStyle: ['hablar rápido', 'minimizar su agotamiento'],
    },
    scenario: {
      name: 'Burnout y miedo a fallar',
      description: 'Abordar burnout y miedo a cometer errores.',
      context: 'Lleva meses con jornadas de doce horas. Siente que cualquier error la va a delatar.',
      severity: 3,
      riskFlags: ['fatiga crónica', 'autoexigencia'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 4,
      triggers: [
        { name: 'Hablar de descanso', description: 'Cualquier sugerencia de “tomar vacaciones” la frustra.' },
      ],
      regulators: [
        { name: 'Validar el esfuerzo', description: 'Que alguien reconozca lo que hace la calma.' },
        { name: 'Preguntas sobre límites', description: 'Pensar en límites concretos la conecta consigo misma.' },
      ],
    },
  },
  {
    id: 'soledad_postmudanza',
    label: 'Soledad post-mudanza',
    description: 'Migrante reciente con desarraigo',
    icon: 'MapPin',
    identity: {
      name: 'Carlos Núñez',
      identityName: 'Carlos Núñez',
      age: 28,
      occupation: 'Profesional recién migrado',
      description: 'Llegó al país hace dos meses por trabajo. No conoce a nadie y siente que “nadie lo entiende”.',
    },
    psych: {
      personality: ['sociable', 'extrañando', 'reflexivo'],
      communicationStyle: ['abierto pero cuidadoso', 'usa humor para disimular'],
    },
    scenario: {
      name: 'Soledad por desarraigo reciente',
      description: 'Explorar aislamiento y desarraigo reciente.',
      context: 'Vive solo en otra ciudad. Sus amigos y familia están lejos. El trabajo va bien, pero las noches y los fines de semana se le hacen muy pesados.',
      severity: 2,
      riskFlags: ['aislamiento', 'desarraigo'],
    },
    behavior: {
      behaviorMin: 0,
      behaviorMax: 3,
      triggers: [
        { name: 'Hablar de su país', description: 'A veces lo entristece, a veces lo conecta.' },
      ],
      regulators: [
        { name: 'Reconocer la pérdida del entorno', description: 'Que alguien valide que dejar todo es difícil.' },
      ],
    },
  },
]

export const BLANK_TEMPLATE: ProfileTemplate = {
  id: 'blank',
  label: 'Empezar desde cero',
  description: 'Sin plantilla, configurarlo todo manualmente',
  icon: 'PencilPlus',
  identity: { name: '', identityName: '', age: 25, occupation: '', description: '' },
  psych: { personality: [], communicationStyle: [] },
  scenario: { name: '', description: '', context: '', severity: 3, riskFlags: [] },
  behavior: { behaviorMin: 1, behaviorMax: 4, triggers: [], regulators: [] },
}
