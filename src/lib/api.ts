const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://sothforge-api.onrender.com'
let accessToken: string | null = null
let refreshPromise: Promise<boolean> | null = null

export type User = { id: string; username: string; email: string; avatar?: string | null }
export type Organization = { id: string; name: string; description?: string | null }
export type Project = {
  id: string
  organizationId: string
  name: string
  description?: string | null
  status?: ProjectStatus
  startDate?: string | null
  endDate?: string | null
}
export type Board = { id: string; projectId: string; name: string; description?: string | null }
export type Task = {
  id: string
  boardId: string
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string | null
  estimatedHours?: number | null
  assignedToId?: string | null
  createdAt?: string
  updatedAt?: string
  labels?: Label[]
}
export type Comment = {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt?: string
  author?: User
}
export type Label = { id: string; organizationId: string; name: string; color: string }
export type Member = {
  id?: string
  userId: string
  organizationId: string
  role: Role
  user?: User
}
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'ARCHIVED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type AuthResponse = { accessToken: string; refreshToken: string }

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public requestId?: string,
  ) {
    super(message)
  }
}
export const getRefreshToken = () =>
  typeof window === 'undefined' ? null : sessionStorage.getItem('sothforge_refresh_token')
export const setTokens = (tokens: AuthResponse) => {
  accessToken = tokens.accessToken
  sessionStorage.setItem('sothforge_refresh_token', tokens.refreshToken)
}
export const clearTokens = () => {
  accessToken = null
  if (typeof window !== 'undefined') sessionStorage.removeItem('sothforge_refresh_token')
}
const unwrap = <T>(payload: unknown): T =>
  payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data: T }).data
    : (payload as T)
const listFrom = <T>(payload: unknown, keys: string[] = []): T[] => {
  const value = unwrap<unknown>(payload)
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    for (const key of keys) {
      const candidate = (value as Record<string, unknown>)[key]
      if (Array.isArray(candidate)) return candidate as T[]
    }
  }
  return []
}
const normalizeMemberRecord = (item: Record<string, unknown>, index: number): Member => {
  const user = item.user as User | undefined
  return {
    id: typeof item.id === 'string' ? item.id : undefined,
    userId: String(item.userId ?? user?.id ?? item.id ?? `member-${index}`),
    organizationId: String(item.organizationId ?? ''),
    role: (item.role as Role) ?? 'VIEWER',
    user,
  }
}
const normalizeMembers = (payload: unknown): Member[] =>
  listFrom<Record<string, unknown>>(payload, ['members', 'items']).map(normalizeMemberRecord)
const normalizeMember = (payload: unknown): Member => {
  const value = unwrap<unknown>(payload)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const nested = value as Record<string, unknown>
    const list = nested.member ?? nested.data
    if (list && typeof list === 'object' && !Array.isArray(list))
      return normalizeMemberRecord(list as Record<string, unknown>, 0)
    return normalizeMemberRecord(nested, 0)
  }
  return normalizeMembers(value)[0] ?? { userId: '', organizationId: '', role: 'VIEWER' }
}
const normalizeList = <T>(payload: unknown, keys: string[] = []) => listFrom<T>(payload, keys)

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('X-Request-Id', crypto.randomUUID())
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (response.status === 401 && retry && getRefreshToken()) {
    refreshPromise ??= api<AuthResponse>(
      '/auth/refresh',
      { method: 'POST', body: JSON.stringify({ refreshToken: getRefreshToken() }) },
      false,
    )
      .then((tokens) => {
        setTokens(unwrap(tokens))
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
    if (await refreshPromise) return api<T>(path, init, false)
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message || 'No se pudo completar la solicitud.'
    throw new ApiError(response.status, message, body?.requestId)
  }
  if (response.status === 204) return undefined as T
  return unwrap<T>(await response.json())
}
export const authApi = {
  login: (body: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: { username: string; email: string; password: string }) =>
    api<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  logout: () =>
    api<void>(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken: getRefreshToken() }) },
      false,
    ),
  logoutAll: () => api<void>('/auth/logout-all', { method: 'POST' }, false),
}
export const usersApi = {
  me: () => api<User>('/users/me'),
  update: (body: { username?: string; email?: string; avatar?: string }) =>
    api<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api<void>('/users/me/password', { method: 'PATCH', body: JSON.stringify(body) }),
}
export const organizationsApi = {
  list: () =>
    api<unknown>('/organizations').then((payload) =>
      normalizeList<Organization>(payload, ['organizations', 'items']),
    ),
  get: (id: string) => api<Organization>(`/organizations/${id}`),
  create: (body: { name: string; description?: string }) =>
    api<Organization>('/organizations', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; description?: string }) =>
    api<Organization>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/organizations/${id}`, { method: 'DELETE' }),
  projects: (id: string) =>
    api<unknown>(`/organizations/${id}/projects`).then((payload) =>
      normalizeList<Project>(payload, ['projects', 'items']),
    ),
  members: (id: string) => api<unknown>(`/organizations/${id}/members`).then(normalizeMembers),
  labels: (id: string) =>
    api<unknown>(`/organizations/${id}/labels`).then((payload) =>
      normalizeList<Label>(payload, ['labels', 'items']),
    ),
  leave: (id: string) => api<void>(`/organizations/${id}/members/me`, { method: 'DELETE' }),
}
export const organizationAdminApi = {
  addMember: (id: string, userId: string) =>
    api<unknown>(`/organizations/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }).then(normalizeMember),
  createLabel: (id: string, body: { name: string; color: string }) =>
    api<Label>(`/organizations/${id}/labels`, { method: 'POST', body: JSON.stringify(body) }),
  updateMemberRole: (organizationId: string, userId: string, role: Role) =>
    api<unknown>(`/organizations/${organizationId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }).then(normalizeMember),
  removeMember: (organizationId: string, userId: string) =>
    api<void>(`/organizations/${organizationId}/members/${userId}`, { method: 'DELETE' }),
  transferOwnership: (organizationId: string, userId: string) =>
    api<unknown>(`/organizations/${organizationId}/transfer-ownership`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }).then(normalizeMember),
}
export const projectsApi = {
  get: (id: string) => api<Project>(`/projects/${id}`),
  boards: (id: string) =>
    api<unknown>(`/projects/${id}/boards`).then((payload) =>
      normalizeList<Board>(payload, ['boards', 'items']),
    ),
  create: (id: string, body: { name: string; description?: string }) =>
    api<Project>(`/organizations/${id}/projects`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Project>) =>
    api<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/projects/${id}`, { method: 'DELETE' }),
}
export const boardsApi = {
  get: (id: string) => api<Board>(`/boards/${id}`),
  tasks: (id: string) =>
    api<unknown>(`/boards/${id}/tasks`).then((payload) =>
      normalizeList<Task>(payload, ['tasks', 'items']),
    ),
  create: (id: string, body: { name: string; description?: string }) =>
    api<Board>(`/projects/${id}/boards`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; description?: string }) =>
    api<Board>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/boards/${id}`, { method: 'DELETE' }),
}
export const tasksApi = {
  get: (id: string) => api<Task>(`/tasks/${id}`),
  create: (id: string, body: Record<string, unknown>) =>
    api<Task>(`/boards/${id}/tasks`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    api<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/tasks/${id}`, { method: 'DELETE' }),
  assign: (id: string, userId: string) =>
    api<Task>(`/tasks/${id}/assignee`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }),
  removeAssignee: (id: string) => api<void>(`/tasks/${id}/assignee`, { method: 'DELETE' }),
  status: (id: string, status: TaskStatus) =>
    api<Task>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  priority: (id: string, priority: TaskPriority) =>
    api<Task>(`/tasks/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    }),
  comments: (id: string) =>
    api<unknown>(`/tasks/${id}/comments`).then((payload) =>
      normalizeList<Comment>(payload, ['comments', 'items']),
    ),
  addComment: (id: string, content: string) =>
    api<Comment>(`/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
}
export const commentsApi = {
  get: (id: string) => api<Comment>(`/comments/${id}`),
  update: (id: string, content: string) =>
    api<Comment>(`/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  remove: (id: string) => api<void>(`/comments/${id}`, { method: 'DELETE' }),
}
export const labelsApi = {
  get: (id: string) => api<Label>(`/labels/${id}`),
  update: (id: string, body: { name?: string; color?: string }) =>
    api<Label>(`/labels/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/labels/${id}`, { method: 'DELETE' }),
  assign: (taskId: string, labelId: string) =>
    api<void>(`/tasks/${taskId}/labels/${labelId}`, { method: 'POST' }),
  removeFromTask: (taskId: string, labelId: string) =>
    api<void>(`/tasks/${taskId}/labels/${labelId}`, { method: 'DELETE' }),
}
