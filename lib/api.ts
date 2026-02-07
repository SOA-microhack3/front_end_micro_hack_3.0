"use client"

import type {
  Booking,
  BookingStatus,
  Carrier,
  Driver,
  AuditLog,
  Notification,
  Operator,
  Port,
  Terminal,
  Truck,
  User,
} from "@/lib/types"
import type { UserRole } from "@/lib/types"

export type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    fullName: string
    role: User["role"]
  }
}

type ApiEnvelope<T> = {
  success: boolean
  data: T
  timestamp: string
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"

const ACCESS_TOKEN_KEY = "portflow_access_token"
const REFRESH_TOKEN_KEY = "portflow_refresh_token"
const USER_KEY = "portflow_user"

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredUser() {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function persistAuth(auth: AuthResponse) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken)
  window.localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken)
  window.localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      id: auth.user.id,
      email: auth.user.email,
      fullName: auth.user.fullName,
      role: auth.user.role,
    })
  )
}

export function setStoredUser(user: User) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers = new Headers(options.headers || {})
  headers.set("Content-Type", "application/json")

  if (withAuth) {
    const token = getStoredAccessToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await res.text()
  let json: ApiEnvelope<T> | null = null
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>
    } catch {
      json = null
    }
  }

  if (!res.ok) {
    const message =
      (json as any)?.message || res.statusText || "Request failed"
    throw new ApiError(message, res.status)
  }

  return json ? json.data : ({} as T)
}

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    false
  )
}

export async function registerUser(payload: {
  fullName: string
  email: string
  password: string
  role: UserRole
}) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function logout() {
  return apiRequest<{ message: string }>("/auth/logout", { method: "POST" })
}

export async function getMe() {
  return apiRequest<User>("/users/me")
}

export async function updateUser(
  userId: string,
  payload: { fullName?: string; email?: string }
) {
  return apiRequest<User>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function getCarriers() {
  return apiRequest<Carrier[]>("/carriers")
}

export async function getCarrierMe() {
  return apiRequest<Carrier>("/carriers/me")
}

export async function createCarrier(payload: { name: string; userId: string }) {
  return apiRequest<Carrier>("/carriers", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getOperators() {
  return apiRequest<Operator[]>("/operators")
}

export async function getOperatorMe() {
  return apiRequest<Operator>("/operators/me")
}

export async function createOperator(payload: {
  userId: string
  portId: string
  terminalId: string
}) {
  return apiRequest<Operator>("/operators", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getTerminals(portId?: string) {
  const query = portId ? `?portId=${portId}` : ""
  return apiRequest<Terminal[]>(`/terminals${query}`)
}

export async function getPorts() {
  return apiRequest<Port[]>("/ports")
}

export async function createTerminal(payload: {
  name: string
  portId: string
  maxCapacity: number
}) {
  return apiRequest<Terminal>("/terminals", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getTrucks(carrierId?: string) {
  const query = carrierId ? `?carrierId=${carrierId}` : ""
  return apiRequest<Truck[]>(`/trucks${query}`)
}

export async function createTruck(payload: {
  plateNumber: string
  carrierId: string
}) {
  return apiRequest<Truck>("/trucks", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getDrivers(carrierId?: string) {
  const query = carrierId ? `?carrierId=${carrierId}` : ""
  return apiRequest<Driver[]>(`/drivers${query}`)
}

export async function getDriverMe() {
  return apiRequest<Driver>("/drivers/me")
}

export async function createDriver(payload: {
  userId: string
  carrierId: string
}) {
  return apiRequest<Driver>("/drivers", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getBookings(params?: {
  status?: BookingStatus
  carrierId?: string
  terminalId?: string
}) {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.carrierId) query.set("carrierId", params.carrierId)
  if (params?.terminalId) query.set("terminalId", params.terminalId)
  const qs = query.toString()
  return apiRequest<Booking[]>(`/bookings${qs ? `?${qs}` : ""}`)
}

export async function createBooking(payload: {
  terminalId: string
  truckId: string
  driverId: string
  slotStart: string
  slotsCount?: number
  carrierId?: string
}) {
  return apiRequest<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function confirmBooking(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/confirm`, {
    method: "POST",
  })
}

export async function rejectBooking(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/reject`, {
    method: "POST",
  })
}

export async function cancelBooking(bookingId: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, {
    method: "POST",
  })
}

export async function bulkConfirmBookings(bookingIds: string[]) {
  return apiRequest<{ confirmed: number; failed: string[] }>(
    "/bookings/bulk/confirm",
    {
      method: "POST",
      body: JSON.stringify({ bookingIds }),
    }
  )
}

export async function bulkRejectBookings(
  bookingIds: string[],
  reason?: string
) {
  return apiRequest<{ rejected: number; failed: string[] }>(
    "/bookings/bulk/reject",
    {
      method: "POST",
      body: JSON.stringify({ bookingIds, reason }),
    }
  )
}

export async function reassignBookingSlot(
  bookingId: string,
  newSlotStart: string
) {
  return apiRequest<Booking>(`/bookings/${bookingId}/reassign-slot`, {
    method: "POST",
    body: JSON.stringify({ newSlotStart }),
  })
}

export async function modifyBooking(
  bookingId: string,
  modifications: {
    truckId?: string
    driverId?: string
    terminalId?: string
    slotStart?: string
  }
) {
  return apiRequest<Booking>(`/bookings/${bookingId}/modify`, {
    method: "POST",
    body: JSON.stringify(modifications),
  })
}

export async function manualOverride(bookingId: string, reason: string) {
  return apiRequest<Booking>(`/bookings/${bookingId}/override`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  })
}

// Dashboard API functions for operators
export async function getOperatorExceptions(
  terminalId: string,
  date?: string
) {
  const query = new URLSearchParams({ terminalId })
  if (date) query.set("date", date)
  return apiRequest<any[]>(`/dashboard/operator/exceptions?${query.toString()}`)
}

export async function getExceptionSummary(terminalId: string) {
  return apiRequest<{
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
  }>(`/dashboard/operator/exception-summary?terminalId=${terminalId}`)
}

export async function getRealTimeTerminalStatus(terminalId: string) {
  return apiRequest<{
    terminalId: string
    timestamp: string
    currentSlot: {
      start: string
      end: string
      trucksInSlot: number
      bookings: any[]
    }
    upcomingArrivals: number
    todaySummary: {
      total: number
      pending: number
      confirmed: number
      consumed: number
      cancelled: number
    }
    utilizationRate: number
  }>(`/dashboard/operator/realtime-status?terminalId=${terminalId}`)
}

export async function getTerminalCapacity(terminalId: string, date?: string) {
  const query = new URLSearchParams()
  if (date) query.set("date", date)
  const qs = query.toString()
  return apiRequest<any>(`/terminals/${terminalId}/capacity${qs ? `?${qs}` : ""}`)
}

export async function updateTerminalCapacity(
  terminalId: string,
  maxCapacity: number
) {
  return apiRequest<any>(`/terminals/${terminalId}`, {
    method: "PUT",
    body: JSON.stringify({ maxCapacity }),
  })
}

export async function getAvailability(terminalId: string, date?: string) {
  const query = new URLSearchParams({ terminalId })
  if (date) query.set("date", date)
  return apiRequest<{ slots: any[]; maxCapacity: number }>(
    `/bookings/availability?${query.toString()}`
  )
}

export async function generateQr(bookingId: string) {
  return apiRequest<{
    id: string
    bookingId: string
    jwtToken: string
    qrCodeData: string
    expiresAt: string
    usedAt?: string
  }>(`/qrcodes/booking/${bookingId}`)
}

export async function scanQr(token: string) {
  return apiRequest<{
    valid: boolean
    message: string
    booking?: {
      id: string
      bookingReference: string
      truckPlate: string
      driverName: string
      slotStart: string
      slotEnd: string
      terminalName: string
    }
  }>("/qrcodes/scan", {
    method: "POST",
    body: JSON.stringify({ token }),
  })
}

export async function chatWithAi(message: string) {
  return apiRequest<{ response: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export async function getNotifications() {
  return apiRequest<Notification[]>("/notifications")
}

export async function getUnreadCount() {
  return apiRequest<{ count: number }>("/notifications/unread-count")
}

export async function markNotificationsRead(notificationIds: string[]) {
  return apiRequest<{ message: string }>("/notifications/mark-read", {
    method: "POST",
    body: JSON.stringify({ notificationIds }),
  })
}

export async function markAllNotificationsRead() {
  return apiRequest<{ message: string }>("/notifications/mark-all-read", {
    method: "POST",
  })
}

export async function getOperatorOverview(terminalId: string) {
  return apiRequest<any>(`/dashboard/operator/overview?terminalId=${terminalId}`)
}

export async function getOperatorPendingApprovals(terminalId: string) {
  return apiRequest<any[]>(
    `/dashboard/operator/pending-approvals?terminalId=${terminalId}`
  )
}

export async function getOperatorTodayTraffic(terminalId: string) {
  return apiRequest<any[]>(
    `/dashboard/operator/today-traffic?terminalId=${terminalId}`
  )
}

export async function getCarrierOverview(carrierId: string) {
  return apiRequest<any>(`/dashboard/carrier/overview?carrierId=${carrierId}`)
}

export async function getCarrierUpcomingBookings(carrierId: string) {
  return apiRequest<any[]>(
    `/dashboard/carrier/upcoming-bookings?carrierId=${carrierId}`
  )
}

export async function getCarrierFleetStatus(carrierId: string) {
  return apiRequest<any>(`/dashboard/carrier/fleet-status?carrierId=${carrierId}`)
}

export async function getLogs(params?: {
  entityType?: string
  action?: string
  actorId?: string
}) {
  const query = new URLSearchParams()
  if (params?.entityType) query.set("entityType", params.entityType)
  if (params?.action) query.set("action", params.action)
  if (params?.actorId) query.set("actorId", params.actorId)
  const qs = query.toString()
  return apiRequest<AuditLog[]>(`/logs${qs ? `?${qs}` : ""}`)
}

export { ApiError }
