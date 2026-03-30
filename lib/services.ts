/**
 * Abstract Service Layer for API Integration
 * 
 * This module provides a decoupled interface for all backend operations.
 * Replace the mock implementations with actual API calls when integrating.
 */

import type {
  Protopersona,
  Perfil,
  Escenario,
  Sesion,
  Message,
  Evaluacion,
  PaginatedResponse,
  DashboardStats,
  ModelConfig,
  SessionStatus,
} from './types';

// ===========================
// BASE API CONFIGURATION
// ===========================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return { data, success: true };
  } catch (error) {
    return {
      data: null as unknown as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ===========================
// PROTOPERSONA SERVICE
// ===========================

export const protopersonaService = {
  async getAll(page = 1, pageSize = 10): Promise<PaginatedResponse<Protopersona>> {
    const result = await apiRequest<PaginatedResponse<Protopersona>>(
      `/protopersonas?page=${page}&pageSize=${pageSize}`
    );
    return result.data || { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
  },

  async getById(id: string): Promise<Protopersona | null> {
    const result = await apiRequest<Protopersona>(`/protopersonas/${id}`);
    return result.data || null;
  },

  async create(data: Omit<Protopersona, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Protopersona> {
    const result = await apiRequest<Protopersona>('/protopersonas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, data: Partial<Protopersona>): Promise<Protopersona> {
    const result = await apiRequest<Protopersona>(`/protopersonas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/protopersonas/${id}`, {
      method: 'DELETE',
    });
    if (!result.success) throw new Error(result.error);
  },
};

// ===========================
// PERFIL SERVICE
// ===========================

export const perfilService = {
  async getAll(page = 1, pageSize = 10): Promise<PaginatedResponse<Perfil>> {
    const result = await apiRequest<PaginatedResponse<Perfil>>(
      `/perfiles?page=${page}&pageSize=${pageSize}`
    );
    return result.data || { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
  },

  async getById(id: string): Promise<Perfil | null> {
    const result = await apiRequest<Perfil>(`/perfiles/${id}`);
    return result.data || null;
  },

  async create(data: Omit<Perfil, 'id' | 'createdAt' | 'updatedAt'>): Promise<Perfil> {
    const result = await apiRequest<Perfil>('/perfiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async createFromProtopersona(protopersonaId: string, name: string): Promise<Perfil> {
    const result = await apiRequest<Perfil>('/perfiles/from-protopersona', {
      method: 'POST',
      body: JSON.stringify({ protopersonaId, name }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async clone(id: string, newName: string, modifications?: Partial<Perfil>): Promise<Perfil> {
    const result = await apiRequest<Perfil>(`/perfiles/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newName, modifications }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, data: Partial<Perfil>): Promise<Perfil> {
    const result = await apiRequest<Perfil>(`/perfiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/perfiles/${id}`, {
      method: 'DELETE',
    });
    if (!result.success) throw new Error(result.error);
  },
};

// ===========================
// ESCENARIO SERVICE
// ===========================

export const escenarioService = {
  async getAll(page = 1, pageSize = 10): Promise<PaginatedResponse<Escenario>> {
    const result = await apiRequest<PaginatedResponse<Escenario>>(
      `/escenarios?page=${page}&pageSize=${pageSize}`
    );
    return result.data || { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
  },

  async getById(id: string): Promise<Escenario | null> {
    const result = await apiRequest<Escenario>(`/escenarios/${id}`);
    return result.data || null;
  },

  async create(data: Omit<Escenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Escenario> {
    const result = await apiRequest<Escenario>('/escenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, data: Partial<Escenario>): Promise<Escenario> {
    const result = await apiRequest<Escenario>(`/escenarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/escenarios/${id}`, {
      method: 'DELETE',
    });
    if (!result.success) throw new Error(result.error);
  },
};

// ===========================
// SESSION SERVICE
// ===========================

export const sessionService = {
  async getAll(page = 1, pageSize = 10, status?: SessionStatus): Promise<PaginatedResponse<Sesion>> {
    const statusParam = status ? `&status=${status}` : '';
    const result = await apiRequest<PaginatedResponse<Sesion>>(
      `/sessions?page=${page}&pageSize=${pageSize}${statusParam}`
    );
    return result.data || { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
  },

  async getById(id: string): Promise<Sesion | null> {
    const result = await apiRequest<Sesion>(`/sessions/${id}`);
    return result.data || null;
  },

  async start(perfilId: string, escenarioId: string, modelId?: string): Promise<Sesion> {
    const result = await apiRequest<Sesion>('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ perfilId, escenarioId, modelId }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    const result = await apiRequest<Message>(`/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async getHistory(sessionId: string): Promise<Message[]> {
    const result = await apiRequest<Message[]>(`/sessions/${sessionId}/messages`);
    return result.data || [];
  },

  async pause(sessionId: string): Promise<Sesion> {
    const result = await apiRequest<Sesion>(`/sessions/${sessionId}/pause`, {
      method: 'POST',
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async resume(sessionId: string): Promise<Sesion> {
    const result = await apiRequest<Sesion>(`/sessions/${sessionId}/resume`, {
      method: 'POST',
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async end(sessionId: string, reason?: string): Promise<Sesion> {
    const result = await apiRequest<Sesion>(`/sessions/${sessionId}/end`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
};

// ===========================
// EVALUATION SERVICE
// ===========================

export const evaluationService = {
  async getAll(page = 1, pageSize = 10): Promise<PaginatedResponse<Evaluacion>> {
    const result = await apiRequest<PaginatedResponse<Evaluacion>>(
      `/evaluations?page=${page}&pageSize=${pageSize}`
    );
    return result.data || { items: [], total: 0, page: 1, pageSize: 10, hasMore: false };
  },

  async getById(id: string): Promise<Evaluacion | null> {
    const result = await apiRequest<Evaluacion>(`/evaluations/${id}`);
    return result.data || null;
  },

  async getBySessionId(sessionId: string): Promise<Evaluacion | null> {
    const result = await apiRequest<Evaluacion>(`/evaluations/session/${sessionId}`);
    return result.data || null;
  },

  async create(data: Omit<Evaluacion, 'id' | 'createdAt' | 'updatedAt'>): Promise<Evaluacion> {
    const result = await apiRequest<Evaluacion>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, data: Partial<Evaluacion>): Promise<Evaluacion> {
    const result = await apiRequest<Evaluacion>(`/evaluations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async compare(sessionIds: string[]): Promise<Evaluacion[]> {
    const result = await apiRequest<Evaluacion[]>('/evaluations/compare', {
      method: 'POST',
      body: JSON.stringify({ sessionIds }),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
};

// ===========================
// DASHBOARD SERVICE
// ===========================

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const result = await apiRequest<DashboardStats>('/dashboard/stats');
    return result.data || {
      protopersonasCount: 0,
      perfilesCount: 0,
      escenariosCount: 0,
      activeSessions: 0,
      completedSessions: 0,
      averageEvaluationScore: 0,
      recentActivity: [],
    };
  },
};

// ===========================
// MODEL CONFIGURATION SERVICE
// ===========================

export const modelService = {
  async getAll(): Promise<ModelConfig[]> {
    const result = await apiRequest<ModelConfig[]>('/models');
    return result.data || [];
  },

  async getById(id: string): Promise<ModelConfig | null> {
    const result = await apiRequest<ModelConfig>(`/models/${id}`);
    return result.data || null;
  },

  async create(data: Omit<ModelConfig, 'id'>): Promise<ModelConfig> {
    const result = await apiRequest<ModelConfig>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async update(id: string, data: Partial<ModelConfig>): Promise<ModelConfig> {
    const result = await apiRequest<ModelConfig>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },

  async delete(id: string): Promise<void> {
    const result = await apiRequest(`/models/${id}`, {
      method: 'DELETE',
    });
    if (!result.success) throw new Error(result.error);
  },

  async test(id: string): Promise<{ success: boolean; latency: number }> {
    const result = await apiRequest<{ success: boolean; latency: number }>(`/models/${id}/test`, {
      method: 'POST',
    });
    if (!result.success) throw new Error(result.error);
    return result.data;
  },
};
