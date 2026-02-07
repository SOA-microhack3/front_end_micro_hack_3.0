import type { UserRole } from "./types"

export function roleToPath(role: UserRole) {
  switch (role) {
    case "ADMIN":
      return "/desktop/admin"
    case "OPERATOR":
      return "/phone/operator"
    case "CARRIER":
      return "/desktop/carrier"
    case "DRIVER":
      return "/phone/driver"
    default:
      return "/signin"
  }
}
