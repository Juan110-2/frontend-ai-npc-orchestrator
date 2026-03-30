/**
 * Mock Data for Development and Demo
 * Replace with real API calls in production
 */

import type {
  Protopersona,
  Perfil,
  Escenario,
  Sesion,
  Evaluacion,
  DashboardStats,
  ActivityItem,
  DEFAULT_EVALUATION_CRITERIA,
} from './types';

// ===========================
// MOCK PROTOPERSONAS
// ===========================

export const mockProtopersonas: Protopersona[] = [
  {
    id: 'proto-1',
    name: 'Paciente Ansioso',
    pedagogicalObjective: 'Entrenar la identificación de patrones de ansiedad generalizada y respuestas terapéuticas apropiadas',
    description: 'Perfil base para simular pacientes con trastorno de ansiedad generalizada',
    triggers: [
      { id: 't1', name: 'Incertidumbre', description: 'Situaciones con resultados impredecibles', severityImpact: 2 },
      { id: 't2', name: 'Evaluación social', description: 'Percepción de ser juzgado por otros', severityImpact: 1 },
      { id: 't3', name: 'Pérdida de control', description: 'Situaciones donde no puede controlar el resultado', severityImpact: 2 },
    ],
    regulators: [
      { id: 'r1', name: 'Respiración consciente', description: 'Técnicas de respiración guiada', effectiveness: 0.7 },
      { id: 'r2', name: 'Validación emocional', description: 'Reconocimiento de emociones sin juicio', effectiveness: 0.8 },
      { id: 'r3', name: 'Reestructuración cognitiva', description: 'Identificación de pensamientos distorsionados', effectiveness: 0.6 },
    ],
    behaviorRange: {
      min: 1,
      max: 4,
      description: 'Rango de ansiedad leve a severa, sin llegar a crisis de pánico',
    },
    interventionReactions: [
      { category: 'supportive', severityChange: -1, responsePattern: 'Muestra alivio gradual', examples: ['Gracias por entenderme', 'Me siento escuchado'] },
      { category: 'neutral', severityChange: 0, responsePattern: 'Mantiene estado actual', examples: ['Hmm, entiendo', 'Sí, supongo'] },
      { category: 'confusing', severityChange: 1, responsePattern: 'Aumenta confusión e inquietud', examples: ['No entiendo qué quiere decir', 'Eso me confunde más'] },
      { category: 'invalidating', severityChange: 2, responsePattern: 'Escalada de ansiedad', examples: ['Usted no entiende', 'Esto no me ayuda'] },
      { category: 'risk', severityChange: 2, responsePattern: 'Puede activar respuesta de evitación', examples: ['No quiero seguir hablando de esto'] },
    ],
    closureRules: [
      { criteria: 'improvement', threshold: 2, description: 'Reducción de 2 niveles de severidad sostenida' },
      { criteria: 'deterioration', threshold: 4, description: 'Alcance de severidad 4 por más de 3 turnos' },
      { criteria: 'risk', threshold: 1, description: 'Activación de cualquier flag de riesgo crítico' },
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-20'),
    version: 3,
  },
  {
    id: 'proto-2',
    name: 'Paciente Depresivo',
    pedagogicalObjective: 'Practicar abordaje de síntomas depresivos y activación conductual',
    description: 'Perfil base para simular pacientes con episodio depresivo mayor',
    triggers: [
      { id: 't1', name: 'Pérdida', description: 'Recordatorios de pérdidas significativas', severityImpact: 2 },
      { id: 't2', name: 'Rechazo', description: 'Experiencias reales o percibidas de rechazo', severityImpact: 2 },
      { id: 't3', name: 'Fracaso', description: 'Situaciones interpretadas como fracasos personales', severityImpact: 1 },
    ],
    regulators: [
      { id: 'r1', name: 'Activación conductual', description: 'Planificación de actividades placenteras', effectiveness: 0.6 },
      { id: 'r2', name: 'Conexión social', description: 'Fomento de interacciones positivas', effectiveness: 0.5 },
    ],
    behaviorRange: {
      min: 2,
      max: 5,
      description: 'Rango de depresión leve a severa, incluyendo ideación pasiva',
    },
    interventionReactions: [
      { category: 'supportive', severityChange: -1, responsePattern: 'Leve mejora en ánimo', examples: ['Tal vez tenga razón'] },
      { category: 'neutral', severityChange: 0, responsePattern: 'Respuestas mínimas', examples: ['Sí', 'No sé'] },
      { category: 'invalidating', severityChange: 2, responsePattern: 'Retraimiento emocional', examples: ['Para qué sigo intentando'] },
    ],
    closureRules: [
      { criteria: 'improvement', threshold: 2, description: 'Expresión de esperanza o planes futuros' },
      { criteria: 'risk', threshold: 1, description: 'Expresión de ideación suicida activa' },
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    version: 2,
  },
  {
    id: 'proto-3',
    name: 'Adolescente en Crisis',
    pedagogicalObjective: 'Entrenar manejo de crisis y comunicación con adolescentes',
    description: 'Perfil para simular adolescentes en situaciones de crisis emocional',
    triggers: [
      { id: 't1', name: 'Conflicto familiar', description: 'Discusiones o tensiones familiares', severityImpact: 2 },
      { id: 't2', name: 'Presión académica', description: 'Expectativas escolares percibidas como excesivas', severityImpact: 1 },
      { id: 't3', name: 'Problemas con pares', description: 'Conflictos o exclusión social', severityImpact: 2 },
    ],
    regulators: [
      { id: 'r1', name: 'Validación sin juicio', description: 'Aceptación incondicional de emociones', effectiveness: 0.8 },
      { id: 'r2', name: 'Autonomía', description: 'Respeto por decisiones propias', effectiveness: 0.7 },
    ],
    behaviorRange: {
      min: 2,
      max: 5,
      description: 'Alta variabilidad emocional típica de crisis adolescente',
    },
    interventionReactions: [
      { category: 'supportive', severityChange: -1, responsePattern: 'Apertura gradual', examples: ['Al menos alguien entiende'] },
      { category: 'confusing', severityChange: 1, responsePattern: 'Frustración y cierre', examples: ['Los adultos nunca entienden'] },
      { category: 'inappropriate', severityChange: 2, responsePattern: 'Hostilidad defensiva', examples: ['No me trate como un niño'] },
    ],
    closureRules: [
      { criteria: 'improvement', threshold: 2, description: 'Disposición a buscar ayuda o hablar con adulto de confianza' },
      { criteria: 'risk', threshold: 1, description: 'Expresión de autolesión o ideación suicida' },
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
    version: 1,
  },
];

// ===========================
// MOCK PERFILES
// ===========================

export const mockPerfiles: Perfil[] = [
  {
    id: 'perf-1',
    name: 'María García - Ansiedad Laboral',
    protopersonaId: 'proto-1',
    protopersonaName: 'Paciente Ansioso',
    contextualData: {
      age: 34,
      gender: 'Femenino',
      occupation: 'Gerente de proyectos en empresa tecnológica',
      familyContext: 'Casada, dos hijos pequeños',
      socialContext: 'Red de apoyo limitada, familia extendida en otra ciudad',
      customFields: {
        'Motivo de consulta': 'Dificultad para dormir y preocupación constante por el trabajo',
        'Duración síntomas': '6 meses',
      },
    },
    notes: 'Presenta síntomas de ansiedad generalizada exacerbados por presión laboral reciente',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'perf-2',
    name: 'Carlos Mendoza - Duelo',
    protopersonaId: 'proto-2',
    protopersonaName: 'Paciente Depresivo',
    contextualData: {
      age: 52,
      gender: 'Masculino',
      occupation: 'Contador, actualmente de licencia',
      familyContext: 'Viudo desde hace 8 meses, hijos adultos independientes',
      medicalHistory: 'Hipertensión controlada',
      customFields: {
        'Motivo de consulta': 'Incapacidad para retomar actividades cotidianas tras pérdida',
        'Tratamiento previo': 'Ninguno',
      },
    },
    notes: 'Duelo complicado con características depresivas. Evaluar riesgo.',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: 'perf-3',
    name: 'Sofía Martínez - Crisis Adolescente',
    protopersonaId: 'proto-3',
    protopersonaName: 'Adolescente en Crisis',
    contextualData: {
      age: 16,
      gender: 'Femenino',
      occupation: 'Estudiante de preparatoria',
      familyContext: 'Padres divorciados, vive con madre',
      socialContext: 'Cambio reciente de escuela',
      customFields: {
        'Motivo de consulta': 'Cambios de humor, aislamiento, bajo rendimiento escolar',
        'Referido por': 'Orientadora escolar',
      },
    },
    notes: 'Importante evaluar relación con ambos padres y adaptación al nuevo entorno escolar',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
  {
    id: 'perf-4',
    name: 'María García - Variante Postvacacional',
    protopersonaId: 'proto-1',
    protopersonaName: 'Paciente Ansioso',
    contextualData: {
      age: 34,
      gender: 'Femenino',
      occupation: 'Gerente de proyectos - recién regresada de vacaciones',
      familyContext: 'Casada, dos hijos pequeños',
      customFields: {
        'Motivo de consulta': 'Ansiedad anticipatoria por reincorporación laboral',
        'Contexto especial': 'Primera sesión después de 3 semanas de vacaciones',
      },
    },
    clonedFromId: 'perf-1',
    clonedFromName: 'María García - Ansiedad Laboral',
    notes: 'Clonado para explorar escenario de reincorporación laboral',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
  },
];

// ===========================
// MOCK ESCENARIOS
// ===========================

export const mockEscenarios: Escenario[] = [
  {
    id: 'esc-1',
    name: 'Primera Consulta - Evaluación Inicial',
    description: 'Escenario de primera sesión para establecer rapport y evaluar motivo de consulta',
    situationContext: 'El paciente acude a consulta por primera vez. No ha tenido experiencia previa con terapia psicológica. Viene referido por su médico de cabecera.',
    initialSeverity: 3,
    riskFlags: [],
    restrictions: [
      { id: 'res-1', type: 'duration', description: 'Límite de tiempo', value: '45 minutos' },
    ],
    timeLimit: 45,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'esc-2',
    name: 'Crisis Aguda - Intervención',
    description: 'Escenario de alta intensidad emocional que requiere intervención en crisis',
    situationContext: 'El paciente llega a sesión visiblemente alterado después de un evento estresante significativo (pérdida de empleo, ruptura, conflicto grave).',
    initialSeverity: 4,
    riskFlags: [
      { id: 'rf-1', type: 'crisis', description: 'Paciente en estado de crisis aguda', severity: 4, active: true },
    ],
    restrictions: [
      { id: 'res-1', type: 'intervention', description: 'Priorizar estabilización', value: 'No profundizar en trauma' },
      { id: 'res-2', type: 'topic', description: 'Evitar exploración de historia', value: 'Enfocarse en el presente' },
    ],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'esc-3',
    name: 'Sesión de Seguimiento - Progreso',
    description: 'Sesión de seguimiento para evaluar progreso terapéutico',
    situationContext: 'Quinta sesión del proceso terapéutico. El paciente ha mostrado mejoría gradual y ha implementado algunas técnicas aprendidas.',
    initialSeverity: 2,
    riskFlags: [],
    restrictions: [],
    timeLimit: 50,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'esc-4',
    name: 'Evaluación de Riesgo',
    description: 'Escenario para practicar evaluación y manejo de riesgo suicida',
    situationContext: 'El paciente menciona indirectamente pensamientos de desesperanza y "no querer seguir así". Se requiere evaluación cuidadosa de riesgo.',
    initialSeverity: 4,
    riskFlags: [
      { id: 'rf-1', type: 'self-harm', description: 'Posible ideación suicida pasiva', severity: 4, active: true },
    ],
    restrictions: [
      { id: 'res-1', type: 'intervention', description: 'Protocolo de seguridad', value: 'Evaluación directa requerida' },
    ],
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
];

// ===========================
// MOCK SESIONES
// ===========================

export const mockSesiones: Sesion[] = [
  {
    id: 'ses-1',
    perfilId: 'perf-1',
    perfilName: 'María García - Ansiedad Laboral',
    escenarioId: 'esc-1',
    escenarioName: 'Primera Consulta - Evaluación Inicial',
    status: 'completed',
    state: {
      currentSeverity: 2,
      activeRiskFlags: [],
      turnCount: 24,
      totalDuration: 2340,
      coherenceScore: 87,
      interventionHistory: ['neutral', 'supportive', 'supportive', 'neutral', 'supportive'],
    },
    messages: [
      {
        id: 'msg-1',
        sessionId: 'ses-1',
        role: 'system',
        content: 'Sesión iniciada. Perfil: María García - Ansiedad Laboral. Escenario: Primera Consulta.',
        timestamp: new Date('2024-02-15T10:00:00'),
        metadata: { severity: 3, riskFlagsTriggered: [] },
      },
      {
        id: 'msg-2',
        sessionId: 'ses-1',
        role: 'assistant',
        content: 'Buenas tardes. Gracias por venir. Sé que dar el paso de buscar ayuda puede ser difícil. ¿Cómo se encuentra hoy?',
        timestamp: new Date('2024-02-15T10:00:30'),
        metadata: { severity: 3, riskFlagsTriggered: [], emotionalState: 'neutral' },
      },
      {
        id: 'msg-3',
        sessionId: 'ses-1',
        role: 'user',
        content: 'Hola. La verdad es que estoy nerviosa. No sabía si venir o no. Mi esposo insistió mucho.',
        timestamp: new Date('2024-02-15T10:01:15'),
        metadata: { severity: 3, interventionCategory: 'neutral', riskFlagsTriggered: [] },
      },
    ],
    startedAt: new Date('2024-02-15T10:00:00'),
    endedAt: new Date('2024-02-15T10:39:00'),
    closureReason: 'improvement',
    modelId: 'gpt-4',
    modelName: 'GPT-4 Turbo',
  },
  {
    id: 'ses-2',
    perfilId: 'perf-2',
    perfilName: 'Carlos Mendoza - Duelo',
    escenarioId: 'esc-2',
    escenarioName: 'Crisis Aguda - Intervención',
    status: 'active',
    state: {
      currentSeverity: 4,
      activeRiskFlags: ['rf-1'],
      turnCount: 8,
      totalDuration: 720,
      coherenceScore: 92,
      interventionHistory: ['supportive', 'supportive', 'neutral'],
    },
    messages: [],
    startedAt: new Date('2024-03-10T14:30:00'),
    modelId: 'claude-3',
    modelName: 'Claude 3 Opus',
  },
  {
    id: 'ses-3',
    perfilId: 'perf-3',
    perfilName: 'Sofía Martínez - Crisis Adolescente',
    escenarioId: 'esc-4',
    escenarioName: 'Evaluación de Riesgo',
    status: 'paused',
    state: {
      currentSeverity: 4,
      activeRiskFlags: ['rf-1'],
      turnCount: 12,
      totalDuration: 1080,
      coherenceScore: 85,
      interventionHistory: ['neutral', 'supportive', 'confusing', 'supportive'],
    },
    messages: [],
    startedAt: new Date('2024-03-08T16:00:00'),
    modelId: 'gpt-4',
    modelName: 'GPT-4 Turbo',
  },
];

// ===========================
// MOCK EVALUACIONES
// ===========================

export const mockEvaluaciones: Evaluacion[] = [
  {
    id: 'eval-1',
    sessionId: 'ses-1',
    sessionName: 'María García - Primera Consulta',
    modelId: 'gpt-4',
    modelName: 'GPT-4 Turbo',
    criteria: [
      { id: 'coherence', name: 'Coherencia con Protopersona', description: '', weight: 0.25, score: 88, notes: 'Buena adherencia al perfil ansioso' },
      { id: 'temporal', name: 'Evolución Temporal', description: '', weight: 0.2, score: 85, notes: 'Progresión natural del estado emocional' },
      { id: 'sensitivity', name: 'Sensibilidad a Intervención', description: '', weight: 0.25, score: 90, notes: 'Respuestas apropiadas a intervenciones de apoyo' },
      { id: 'safety', name: 'Seguridad', description: '', weight: 0.2, score: 95, notes: 'Sin contenido problemático' },
      { id: 'consistency', name: 'Consistencia', description: '', weight: 0.1, score: 82, notes: 'Algunas inconsistencias menores' },
    ],
    overallScore: 88,
    evaluatorNotes: 'Simulación efectiva para entrenamiento de primera consulta. Recomendado para estudiantes de nivel intermedio.',
    createdAt: new Date('2024-02-15T11:00:00'),
    updatedAt: new Date('2024-02-15T11:30:00'),
  },
];

// ===========================
// MOCK DASHBOARD STATS
// ===========================

export const mockDashboardStats: DashboardStats = {
  protopersonasCount: mockProtopersonas.length,
  perfilesCount: mockPerfiles.length,
  escenariosCount: mockEscenarios.length,
  activeSessions: mockSesiones.filter(s => s.status === 'active').length,
  completedSessions: mockSesiones.filter(s => s.status === 'completed').length,
  averageEvaluationScore: 88,
  recentActivity: [
    { id: 'act-1', type: 'session', action: 'created', entityName: 'Carlos Mendoza - Crisis Aguda', timestamp: new Date('2024-03-10T14:30:00') },
    { id: 'act-2', type: 'perfil', action: 'cloned', entityName: 'María García - Variante Postvacacional', timestamp: new Date('2024-03-01T09:00:00') },
    { id: 'act-3', type: 'evaluation', action: 'completed', entityName: 'María García - Primera Consulta', timestamp: new Date('2024-02-15T11:30:00') },
    { id: 'act-4', type: 'protopersona', action: 'updated', entityName: 'Adolescente en Crisis', timestamp: new Date('2024-03-10T08:00:00') },
    { id: 'act-5', type: 'escenario', action: 'created', entityName: 'Evaluación de Riesgo', timestamp: new Date('2024-03-05T12:00:00') },
  ],
};
