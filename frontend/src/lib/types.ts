// Mirrors the Spring Boot DTOs in backend/tourmate/src/main/java/com/tourmate/dto

export type Category = 'BEACH' | 'HERITAGE' | 'CULTURAL' | 'WILDLIFE' | 'NATURE' | 'HILL_COUNTRY' | 'ADVENTURE' | 'CITY'
export type ClimateZone = 'WEST_SOUTH' | 'EAST' | 'CULTURAL_TRIANGLE' | 'HILL_COUNTRY' | 'NORTH'
export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'CLOSED'
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
export type Budget = 'BUDGET' | 'MID_RANGE' | 'LUXURY'
export type Transport = 'CAR' | 'EV' | 'TRAIN' | 'BUS' | 'TUK_TUK'
export type Pace = 'RELAXED' | 'BALANCED' | 'PACKED'
export type Role = 'TRAVELLER' | 'MANAGER'

export interface User {
  id: number
  fullName: string
  email: string
  role: Role
  country: string | null
  createdAt: string
}

export interface AuthResponse {
  token: string
  /** seconds */
  expiresIn: number
  user: User
}

export interface TripSummary {
  id: number
  title: string
  days: number
  travelMonth: number
  travellers: number | null
  budget: Budget
  transport: Transport
  destinations: string
  totalCostUsd: number
  carbonKg: number
  createdAt: string
  updatedAt: string | null
}

export interface StopInput {
  destinationId: number
  note: string | null
}

/** Trip settings shared by evaluating and saving. */
export interface TripSettings {
  month: number
  travellers: number
  budget: Budget
  transport: Transport
  interests: Category[]
}

export interface TripRequest extends TripSettings {
  title: string
  notes: string | null
  days: StopInput[][]
}

export interface TripDetail extends TripRequest {
  id: number
  createdAt: string
  updatedAt: string | null
}

export interface Destination {
  id: number
  name: string
  province: string
  category: Category
  climateZone: ClimateZone
  description: string
  latitude: number
  longitude: number
  entryFeeUsd: number
  avgVisitHours: number
  dailyCapacity: number
  ecoScore: number
  tags: string[]
  weatherScore: number
  bestMonths: string[]
}

export type DestinationInput = Omit<Destination, 'id' | 'tags' | 'weatherScore' | 'bestMonths'> & { tags: string }

export interface PlanRequest {
  days: number
  month: number
  interests: Category[]
  budget: Budget
  transport: Transport
  pace: Pace
  travellers: number
}

export interface Stop {
  destinationId: number
  name: string
  category: Category
  province: string
  matchScore: number
  weatherScore: number
  expectedCrowd: CrowdLevel
  entryFeeUsd: number
  visitHours: number
  reason: string
}

export interface DayPlan {
  day: number
  baseTown: string
  stops: Stop[]
  travelKm: number
  travelHours: number
}

export interface PlanResponse {
  days: number
  month: string
  travellers: number
  transport: string
  itinerary: DayPlan[]
  cost: { accommodation: number; food: number; entryFees: number; transport: number; total: number; perPerson: number }
  totalDistanceKm: number
  carbonKg: number
  carbonSavedVsCarKg: number
  ecoTips: string[]
  aiSummary: string
  aiPowered: boolean
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  reply: string
  aiPowered: boolean
  suggestions: string[]
}

export interface Review {
  id: number
  destinationId: number
  destinationName: string
  visitorName: string
  country: string
  rating: number
  comment: string
  sentimentScore: number
  sentimentLabel: Sentiment
  aspects: string[]
  createdAt: string
}

export interface ReviewInput {
  destinationId: number
  visitorName: string
  country: string
  rating: number
  comment: string
}

export interface ForecastPoint {
  period: string
  year: number
  month: number
  actual: number | null
  fitted: number | null
  forecast: number | null
}

export interface Forecast {
  destinationId: number
  destinationName: string
  points: ForecastPoint[]
  growthRatePct: number
  mapePct: number
  peakMonth: string
  quietMonth: string
  insight: string
}

export interface CrowdStatus {
  destinationId: number
  name: string
  category: Category
  province: string
  estimatedVisitorsNow: number
  hourlyCapacity: number
  occupancy: number
  level: CrowdLevel
  alternativeId: number | null
  alternativeName: string | null
}

export interface BestTime {
  destinationId: number
  destinationName: string
  date: string
  hourlyCapacity: number
  hours: { hour: number; expectedVisitors: number; occupancy: number; level: CrowdLevel }[]
  bestHour: number
  advice: string
}

export interface Footprint {
  distanceKm: number
  travellers: number
  modes: { mode: Transport; label: string; co2Kg: number; costUsd: number; hours: number; treesToOffset: number }[]
  recommendation: string
}

export interface Insights {
  destinationId: number
  destinationName: string
  reviewCount: number
  avgRating: number
  avgSentiment: number
  sentimentBreakdown: Record<Sentiment, number>
  aspectMentions: Record<string, number>
  negativeAspects: Record<string, number>
  recommendations: string[]
}

export interface Overview {
  totalDestinations: number
  totalReviews: number
  avgRating: number
  avgSentiment: number
  tripsPlanned: number
  checkInsToday: number
  aiEnabled: boolean
  destinationsByCategory: Record<string, number>
  sentimentBreakdown: Record<Sentiment, number>
  popularInterests: Record<string, number>
  nationalTrend: { period: string; actual: number | null; forecast: number | null }[]
  busiestNow: CrowdStatus[]
  recentReviews: Review[]
}
