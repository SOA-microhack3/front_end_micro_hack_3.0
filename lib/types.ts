export type UserRole = 'ADMIN' | 'OPERATOR' | 'CARRIER' | 'DRIVER'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CONSUMED' | 'CANCELLED' | 'REJECTED'
export type OperatorStatus = 'ACTIVE' | 'SUSPENDED'
export type TruckStatus = 'ACTIVE' | 'SUSPENDED'
export type DriverStatus = 'ACTIVE' | 'SUSPENDED'
export type LogActorType = 'USER' | 'AI' | 'SYSTEM'
export type Language = 'fr' | 'ar'

export interface User {
  id: string
  fullName: string
  email: string
  role: UserRole
  createdAt?: string
  avatar?: string
}

export interface Port {
  id: string
  name: string
  countryCode?: string
  slotDuration?: number
  timezone: string
  createdAt?: string
}

export interface Terminal {
  id: string
  portId: string
  name: string
  maxCapacity: number
  createdAt?: string
}

export interface Operator {
  id: string
  userId: string
  portId: string
  terminalId: string
  status: OperatorStatus
  user?: User
  port?: Port
}

export interface Carrier {
  id: string
  userId: string
  name: string
  createdAt?: string
  user?: User
}

export interface Driver {
  id: string
  carrierId: string
  userId: string
  status: DriverStatus
  user?: {
    id: string
    fullName: string
    email: string
  }
}

export interface Truck {
  id: string
  carrierId: string
  plateNumber: string
  status: TruckStatus
  createdAt?: string
}

export interface Booking {
  id: string
  bookingReference: string
  terminalId: string
  truckId: string
  carrierId: string
  driverId: string
  slotStart: string
  slotEnd: string
  slotsCount: number
  status: BookingStatus
  containerMatricule?: string
  createdAt?: string
  terminal?: {
    id: string
    name: string
  }
  truck?: {
    id: string
    plateNumber: string
  }
  driver?: {
    id: string
    user?: {
      fullName: string
    }
  }
}

export interface QRCode {
  id: string
  bookingId: string
  jwtToken: string
  qrCodeData: string
  expiresAt: string
  usedAt?: string
  createdAt?: string
}

export interface AuditLog {
  id: string
  actorType: LogActorType
  actorId?: string
  entityType: string
  entityId: string
  action: string
  description: string
  createdAt: string
}

export interface SlotAvailability {
  slotStart: string
  slotEnd: string
  bookedCount: number
  availableCount: number
}

export interface Notification {
  id: string
  type: 'EMAIL' | 'PUSH' | 'SOCKET'
  source: 'SYSTEM' | 'ADMIN' | 'CARRIER'
  message: string
  readAt?: string
  createdAt: string
}

export interface DashboardStats {
  totalBookingsToday: number
  activeTrucks: number
  gateEntriesToday: number
  capacityUtilization: number
  bookingsByStatus: { status: BookingStatus; count: number }[]
  hourlyTraffic: { hour: string; entries: number; exits: number }[]
  terminalOccupancy: { terminal: string; occupancy: number; capacity: number }[]
}
