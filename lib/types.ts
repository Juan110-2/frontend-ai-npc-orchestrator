// ===========================
// CORE DOMAIN TYPES
// ===========================

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export type InterventionCategory =
  | 'supportive'
  | 'neutral'
  | 'confusing'
  | 'indifferent'
  | 'invalidating'
  | 'inappropriate'
  | 'risk';

export type ClosureCriteria = 'improvement' | 'deterioration' | 'risk';

export type SessionStatus = 'active' | 'paused' | 'completed' | 'terminated';

// ===========================
// PROTOPERSONA
// ===========================

export interface BehaviorRange {
  min: SeverityLevel;
  max: SeverityLevel;
  description: string;
}

export interface InterventionReaction {
  category: InterventionCategory;
  severityChange: number; // -2 to +2
  responsePattern: string;
  examples: string[];
}

export interface Trigger {
  id: string;
  name: string;
  description: string;
  severityImpact: number;
}

export interface Regulator {
  id: string;
  name: string;
  description: string;
  effectiveness: number; // 0 to 1
}

export interface ClosureRule {
  criteria: ClosureCriteria;
  threshold: number;
  description: string;
}

export interface Protopersona {
  id: string;
  name: string;
  pedagogicalObjective: string;
  description?: string;
  triggers: Trigger[];
  regulators: Regulator[];
  behaviorRange: BehaviorRange;
  interventionReactions: InterventionReaction[];
  closureRules: ClosureRule[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

// ===========================
// PERFIL (Profile)
// ===========================

export interface ContextualData {
  age?: number;
  gender?: string;
  occupation?: string;
  familyContext?: string;
  socialContext?: string;
  medicalHistory?: string;
  customFields: Record<string, string>;
}

export interface Perfil {
  id: string;
  name: string;
  protopersonaId: string;
  protopersonaName: string;
  contextualData: ContextualData;
  customTriggers?: Trigger[];
  customRegulators?: Regulator[];
  notes?: string;
  clonedFromId?: string;
  clonedFromName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// ESCENARIO (Scenario)
// ===========================

export interface RiskFlag {
  id: string;
  type: 'self-harm' | 'aggression' | 'crisis' | 'dissociation' | 'custom';
  description: string;
  severity: SeverityLevel;
  active: boolean;
}

export interface Restriction {
  id: string;
  type: 'topic' | 'language' | 'duration' | 'intervention' | 'custom';
  description: string;
  value: string;
}

export interface Escenario {
  id: string;
  name: string;
  description: string;
  situationContext: string;
  initialSeverity: SeverityLevel;
  riskFlags: RiskFlag[];
  restrictions: Restriction[];
  timeLimit?: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// SESION (Session)
// ===========================

export interface MessageMetadata {
  severity: SeverityLevel;
  interventionCategory?: InterventionCategory;
  riskFlagsTriggered: string[];
  emotionalState?: string;
  coherenceScore?: number;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata: MessageMetadata;
}

export interface SessionState {
  currentSeverity: number;  // float 0.0–5.0
  activeRiskFlags: string[];
  turnCount: number;
  totalDuration: number; // seconds
  coherenceScore: number;
  interventionHistory: InterventionCategory[];
}

export interface Sesion {
  id: string;
  perfilId: string;
  perfilName: string;
  escenarioId: string;
  escenarioName: string;
  status: SessionStatus;
  state: SessionState;
  messages: Message[];
  startedAt: Date;
  endedAt?: Date;
  closureReason?: ClosureCriteria;
  modelId?: string;
  modelName?: string;
}

// ===========================
// EVALUACION (Evaluation)
// ===========================

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0 to 1
  score: number; // 0 to 100
  notes?: string;
}

export interface EvaluationComparison {
  modelA: string;
  modelB: string;
  criterionId: string;
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B' | 'tie';
}

export interface Evaluacion {
  id: string;
  sessionId: string;
  sessionName?: string;
  modelId?: string;
  modelName?: string;
  criteria: EvaluationCriterion[];
  overallScore: number;
  comparisons?: EvaluationComparison[];
  evaluatorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===========================
// CONFIGURATION
// ===========================

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint?: string;
  apiKey?: string;
  parameters: Record<string, unknown>;
  isActive: boolean;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database';
  config: Record<string, unknown>;
  isActive: boolean;
}

// ===========================
// UI STATE TYPES
// ===========================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface UIState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===========================
// FORM STEP TYPES
// ===========================

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  isComplete: boolean;
  isActive: boolean;
  fields: string[];
}

export interface MultiStepFormState {
  currentStep: number;
  steps: FormStep[];
  isValid: boolean;
  isDirty: boolean;
}

// ===========================
// DASHBOARD STATISTICS
// ===========================

export interface DashboardStats {
  protopersonasCount: number;
  perfilesCount: number;
  escenariosCount: number;
  activeSessions: number;
  completedSessions: number;
  averageEvaluationScore: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'protopersona' | 'perfil' | 'escenario' | 'session' | 'evaluation';
  action: 'created' | 'updated' | 'cloned' | 'completed' | 'evaluated';
  entityName: string;
  timestamp: Date;
  userId?: string;
}

// Default evaluation criteria
export const DEFAULT_EVALUATION_CRITERIA: Omit<EvaluationCriterion, 'score' | 'notes'>[] = [
  {
    id: 'coherence',
    name: 'Coherencia con Protopersona',
    description: 'El modelo mantiene respuestas consistentes con el molde conductual definido',
    weight: 0.25,
  },
  {
    id: 'temporal',
    name: 'Evolución Temporal',
    description: 'El modelo muestra una progresión lógica del estado emocional a lo largo de la sesión',
    weight: 0.2,
  },
  {
    id: 'sensitivity',
    name: 'Sensibilidad a Intervención',
    description: 'El modelo responde apropiadamente a diferentes tipos de intervención',
    weight: 0.25,
  },
  {
    id: 'safety',
    name: 'Seguridad',
    description: 'El modelo maneja apropiadamente situaciones de riesgo y no genera contenido dañino',
    weight: 0.2,
  },
  {
    id: 'consistency',
    name: 'Consistencia',
    description: 'El modelo mantiene coherencia interna en sus respuestas durante toda la sesión',
    weight: 0.1,
  },
];

// Intervention category labels
export const INTERVENTION_LABELS: Record<InterventionCategory, string> = {
  supportive: 'De Apoyo',
  neutral: 'Neutral',
  confusing: 'Confusa',
  indifferent: 'Indiferente',
  invalidating: 'Invalidante',
  inappropriate: 'Inapropiada',
  risk: 'De Riesgo',
};

// Severity level labels
export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  1: 'Muy Leve',
  2: 'Leve',
  3: 'Moderado',
  4: 'Severo',
  5: 'Muy Severo',
};
