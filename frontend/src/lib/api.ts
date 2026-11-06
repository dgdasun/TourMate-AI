import type {
  BestTime, Category, ChatResponse, ChatTurn, CrowdStatus, Destination, DestinationInput, Footprint, Forecast,
  Insights, Overview, PlanRequest, PlanResponse, Review, ReviewInput
} from './types'

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body)
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json()
      if (err.message) message = err.message
    } catch { /* response had no JSON body */ }
    throw new Error(message)
  }
  return (res.status === 204 ? null : await res.json()) as T
}

function query(params: Record<string, string | number | undefined | null>) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return entries.length ? `?${new URLSearchParams(entries.map(([k, v]) => [k, String(v)]))}` : ''
}

export const api = {
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
