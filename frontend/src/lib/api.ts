import type {
  AuthResponse, BestTime, Category, ChatResponse, ChatTurn, CrowdStatus, Destination, DestinationInput, Footprint,
  Forecast, Insights, Overview, PlanRequest, PlanResponse, Review, ReviewInput, TripDetail, TripRequest, TripSettings,
  TripSummary, User
} from './types'

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

// The auth provider registers how to read the current token and what to do when it is rejected.
let getToken: () => string | null = () => null
let onUnauthorized: () => void = () => {}

export function configureAuth(tokenGetter: () => string | null, unauthorizedHandler: () => void) {
  getToken = tokenGetter
  onUnauthorized = unauthorizedHandler
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  })
  // an expired or revoked token: sign out so the user is sent to the login page
  if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized()
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json()
      if (err.message) message = err.message
    } catch { /* response had no JSON body */ }
    throw new ApiError(message, res.status)
  }
  return (res.status === 204 ? null : await res.json()) as T
}

function query(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : ''
}

export const api = {
  register: (body: { fullName: string; email: string; password: string; country?: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body }),
  me: () => request<User>('/auth/me'),
  trips: () => request<TripSummary[]>('/trips'),
  trip: (id: number) => request<TripDetail>(`/trips/${id}`),
  createTrip: (body: TripRequest) => request<TripDetail>('/trips', { method: 'POST', body }),
  updateTrip: (id: number, body: TripRequest) => request<TripDetail>(`/trips/${id}`, { method: 'PUT', body }),
  deleteTrip: (id: number) => request<null>(`/trips/${id}`, { method: 'DELETE' }),
  evaluate: (body: TripSettings & { days: number[][] }) =>
    request<PlanResponse>('/planner/evaluate', { method: 'POST', body }),
  destinations: (p: { category?: Category | ''; month?: number; search?: string } = {}) =>
    request<Destination[]>(`/destinations${query(p)}`),
  createDestination: (body: DestinationInput) => request<Destination>('/destinations', { method: 'POST', body }),
  deleteDestination: (id: number) => request<null>(`/destinations/${id}`, { method: 'DELETE' }),
  plan: (body: PlanRequest) => request<PlanResponse>('/planner/itinerary', { method: 'POST', body }),
  chat: (body: { message: string; history: ChatTurn[]; language: string }) =>
    request<ChatResponse>('/assistant/chat', { method: 'POST', body }),
  aiStatus: () => request<{ aiEnabled: boolean; mode: string }>('/assistant/status'),
  overview: () => request<Overview>('/analytics/overview'),
  forecast: (id: number) => request<Forecast>(`/analytics/forecast/${id}`),
  insights: (id: number) => request<Insights>(`/analytics/insights/${id}`),
  reviews: (destinationId?: number) => request<Review[]>(`/reviews${query({ destinationId })}`),
  addReview: (body: ReviewInput) => request<Review>('/reviews', { method: 'POST', body }),
  crowds: (hour?: number | null) => request<CrowdStatus[]>(`/mobility/crowds${query({ hour })}`),
  bestTime: (id: number) => request<BestTime>(`/mobility/best-time/${id}`),
  checkIn: (destinationId: number, groupSize = 1) =>
    request<unknown>('/mobility/check-in', { method: 'POST', body: { destinationId, groupSize } }),
  footprint: (distanceKm: number, travellers: number) =>
    request<Footprint>(`/sustainability/footprint${query({ distanceKm, travellers })}`)
}
