"use client"

import React, { createContext, useContext, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Bot,
  DoorOpen,
  Truck,
  Users,
  Building,
  UserCog,
  Building2,
  FileText,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
} from "lucide-react"
import type { UserRole } from "@/lib/types"

type NavPage =
  | "dashboard"
  | "bookings"
  | "slots"
  | "ai_assistant"
  | "gate"
  | "fleet"
  | "drivers"
  | "carriers"
  | "operators"
  | "terminals"
  | "audit_logs"
  | "settings"

interface AppSidebarProps {
  currentPage: NavPage
  onNavigate: (page: NavPage) => void
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)
  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState
  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  )
}

const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar()
  return (
    <motion.div
      className={cn(
        "h-screen px-4 py-4 hidden md:flex md:flex-col bg-card w-[300px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "70px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar()
  return (
    <div className="md:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: "easeInOut",
            }}
            className={cn(
              "fixed h-full w-full inset-0 bg-background p-10 z-[100] flex flex-col justify-between",
              className
            )}
          >
            <div
              className="absolute right-10 top-10 z-50 text-foreground cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

const navItems: {
  key: NavPage
  icon: typeof LayoutDashboard
  roles: UserRole[]
}[] = [
    { key: "dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OPERATOR", "CARRIER", "DRIVER"] },
    { key: "bookings", icon: CalendarCheck, roles: ["ADMIN", "OPERATOR", "CARRIER"] },
    { key: "slots", icon: Clock, roles: ["ADMIN", "OPERATOR", "CARRIER"] },
    { key: "ai_assistant", icon: Bot, roles: ["CARRIER"] },
    { key: "gate", icon: DoorOpen, roles: ["OPERATOR"] },
    { key: "fleet", icon: Truck, roles: ["ADMIN", "CARRIER"] },
    { key: "drivers", icon: Users, roles: ["ADMIN", "CARRIER"] },
    { key: "carriers", icon: Building, roles: ["ADMIN"] },
    { key: "operators", icon: UserCog, roles: ["ADMIN"] },
    { key: "terminals", icon: Building2, roles: ["ADMIN", "OPERATOR"] },
    { key: "audit_logs", icon: FileText, roles: ["ADMIN"] },
    { key: "settings", icon: Settings, roles: ["ADMIN", "OPERATOR", "CARRIER", "DRIVER"] },
  ]

export function AppSidebar({
  currentPage,
  onNavigate,
  open,
  setOpen,
  animate = true,
}: AppSidebarProps) {
  const { t, lang, setLang } = useI18n()
  const { user, logout } = useAuth()
  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      <SidebarBody>
        <div className="flex flex-col h-full min-h-0">
          <div className="flex items-center px-2 py-2">
            <SidebarLogo />
          </div>

          <div className="mt-8 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {filteredNav.map((item) => {
              const Icon = item.icon
              const active = currentPage === item.key
              return (
                <SidebarLink
                  key={item.key}
                  label={t(item.key)}
                  active={active}
                  icon={<Icon className="h-6 w-6" />}
                  onClick={() => onNavigate(item.key)}
                />
              )
            })}
          </div>

          <div className="mt-auto pt-6 flex flex-col gap-3">
            <SidebarLink
              label={lang === "fr" ? "العربية" : "Francais"}
              icon={<Globe className="h-6 w-6" />}
              onClick={() => setLang(lang === "fr" ? "ar" : "fr")}
            />

            {user && (
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-bold">
                  {user.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <SidebarLabel className="flex-1">
                  <div className="text-sm font-medium truncate">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.role}
                  </div>
                </SidebarLabel>
                <button
                  type="button"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title={t("sign_out")}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </SidebarBody>
    </SidebarProvider>
  )
}

function SidebarLogo() {
  const { open, animate } = useSidebar()
  const expanded = animate ? open : true
  const transition = { duration: 0.25, ease: "easeInOut" }

  return (
    <motion.div
      className="relative flex h-10 items-center overflow-hidden rounded-xl bg-white text-black shadow-sm ring-1 ring-black/10"
      animate={{ width: expanded ? 180 : 40 }}
      transition={transition}
    >
      <motion.span
        className="absolute inset-0 flex items-center justify-center text-lg font-black tracking-tight"
        animate={{
          opacity: expanded ? 0 : 1,
          scale: expanded ? 0.92 : 1,
        }}
        transition={transition}
      >
        A
      </motion.span>
      <motion.div
        className="absolute inset-0 flex items-center justify-start px-3"
        animate={{
          opacity: expanded ? 1 : 0,
          x: expanded ? 0 : 8,
        }}
        transition={transition}
      >
        <img src="/APCS_New_Logo.svg" alt="APCS" className="h-8 w-auto" />
      </motion.div>
    </motion.div>
  )
}

function SidebarLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open, animate } = useSidebar()
  return (
    <motion.span
      animate={{
        display: animate ? (open ? "inline-block" : "none") : "inline-block",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className={cn(
        "text-neutral-700 dark:text-neutral-200 text-sm whitespace-pre",
        className
      )}
    >
      {children}
    </motion.span>
  )
}

function SidebarLink({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}) {
  const { open, animate } = useSidebar()
  const isCollapsed = animate && !open
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-lg transition-all",
        isCollapsed ? "justify-center" : "justify-start",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <div className="flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block"
      >
        {label}
      </motion.span>
    </button>
  )
}
