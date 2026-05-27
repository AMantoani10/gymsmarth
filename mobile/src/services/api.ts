import { API_BASE_URL } from '../contexts/AuthContext';

/**
 * Serviço de API genérico — suporta todos os métodos HTTP.
 * Inclui tratamento de erros e timeout automático.
 */
export async function api(
  path: string,
  token?: string | null,
  options?: RequestInit
) {
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Garante que o path sempre comece com /api (servidor monta em app.use('/api', routes))
  const apiPath = path.startsWith('/api') ? path : `/api${path}`;
  const url = `${API_BASE_URL}${apiPath}`;
  console.log(`[API] ${options?.method || 'GET'} ${url}`);

  try {
    const res = await fetch(url, { ...options, headers });
    return res;
  } catch (error: any) {
    console.error(`[API ERROR] ${url}:`, error.message);
    throw error;
  }
}

// ─── Helper Methods ──────────────────────────────────────────────

export function apiGet(path: string, token?: string | null) {
  return api(path, token, { method: 'GET' });
}

export function apiPost(path: string, body: any, token?: string | null) {
  return api(path, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPut(path: string, body: any, token?: string | null) {
  return api(path, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function apiDelete(path: string, token?: string | null, body?: any) {
  return api(path, token, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// ─── Admin: Students ──────────────────────────────────────────────

export async function fetchStudents(token: string | null) {
  const res = await apiGet('/admin/students', token);
  if (!res.ok) throw new Error('Erro ao buscar alunos');
  return res.json();
}

export async function createStudent(data: any, token: string | null) {
  const res = await apiPost('/admin/students', data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao cadastrar aluno');
  return json;
}

export async function updateStudent(id: string, data: any, token: string | null) {
  const res = await apiPut(`/admin/students/${id}`, data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar aluno');
  return json;
}

export async function deleteStudent(id: string, token: string | null) {
  const res = await apiDelete(`/admin/students/${id}`, token);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Erro ao excluir aluno');
  }
}

export async function renewStudent(id: string, token: string | null) {
  const res = await apiPost(`/admin/students/${id}/renew`, {}, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao renovar plano');
  return json;
}

// ─── Admin: Plans ──────────────────────────────────────────────

export async function fetchPlans(token: string | null) {
  const res = await apiGet('/admin/plans', token);
  if (!res.ok) throw new Error('Erro ao buscar planos');
  return res.json();
}

export async function createPlan(data: any, token: string | null) {
  const res = await apiPost('/admin/plans', data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao criar plano');
  return json;
}

export async function updatePlan(id: string, data: any, token: string | null) {
  const res = await apiPut(`/admin/plans/${id}`, data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar plano');
  return json;
}

export async function deletePlan(id: string, token: string | null) {
  const res = await apiDelete(`/admin/plans/${id}`, token);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Erro ao excluir plano');
  }
}

// ─── Admin: Workouts (Treinos) ──────────────────────────────────

export async function fetchWorkouts(token: string | null) {
  const res = await apiGet('/admin/treinos', token);
  if (!res.ok) throw new Error('Erro ao buscar treinos');
  return res.json();
}

export async function createWorkout(data: any, token: string | null) {
  const res = await apiPost('/admin/treinos', data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao criar treino');
  return json;
}

export async function updateWorkout(id: string, data: any, token: string | null) {
  const res = await apiPut(`/admin/treinos/${id}`, data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar treino');
  return json;
}

export async function deleteWorkout(id: string, token: string | null) {
  const res = await apiDelete(`/admin/treinos/${id}`, token);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || 'Erro ao excluir treino');
  }
}

// ─── Admin: Notifications ──────────────────────────────────────

export async function fetchNotifications(token: string | null) {
  const res = await apiGet('/admin/notifications', token);
  if (!res.ok) throw new Error('Erro ao buscar notificações');
  return res.json();
}

export async function dismissNotification(id: string, type: string, token: string | null) {
  const res = await apiPost(`/admin/notifications/${id}/dismiss`, { type }, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao fechar notificação');
  return json;
}

// ─── Admin: Logs ──────────────────────────────────────────────

export async function fetchLogs(dias: number, token: string | null) {
  const res = await apiGet(`/admin/logs?dias=${dias}`, token);
  if (!res.ok) throw new Error('Erro ao buscar logs');
  return res.json();
}

// ─── Student: Training ──────────────────────────────────────────────

export async function fetchTrainingSessions(token: string | null) {
  const res = await apiGet('/training/all', token);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao buscar treinos');
  }
  return res.json();
}

export async function saveCarga(exercicio: string, carga: string, token: string | null) {
  const res = await apiPost('/training/carga', { exercicio, carga }, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao salvar carga');
  return json;
}

export async function getHistoricoCarga(exercicio: string, token: string | null) {
  const res = await apiGet(`/training/carga/${encodeURIComponent(exercicio)}`, token);
  if (!res.ok) throw new Error('Erro ao buscar histórico de carga');
  return res.json();
}

export async function logSession(sessao_id: string, observacao: string, token: string | null) {
  const res = await apiPost('/training/log', { sessao_id, observacao }, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao registrar sessão');
  return json;
}

// ─── Student: Exams ──────────────────────────────────────────────

export async function analyzeExam(examText: string, fileData: string | undefined, fileMimeType: string | undefined, token: string | null) {
  const res = await apiPost('/exams/analyze', { examText, fileData, fileMimeType }, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao enviar exame');
  return json;
}

// ─── Auth/Profile ──────────────────────────────────────────────

export async function updateProfile(data: any, token: string | null) {
  const res = await apiPut('/auth/profile', data, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro ao atualizar perfil');
  return json;
}
