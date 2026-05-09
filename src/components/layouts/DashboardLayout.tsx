'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Menu, X, LogOut, Wifi, WifiOff, Lock, UserPlus, FileText, LayoutDashboard, Pill, FileSpreadsheet, Settings, Shield } from 'lucide-react'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { flushSyncQueue } from '@/lib/offline/syncManager'

interface Props {
  children: ReactNode
  title: string
  medicName: string
  role: string
  companyName?: string
}

const linkIcon: Record<string, typeof UserPlus> = {
  '/dashboard/patient-intake': UserPlus,
  '/dashboard/medic': FileText,
  '/dashboard/manager': LayoutDashboard,
  '/dashboard/drugs': Pill,
  '/dashboard/reports': FileSpreadsheet,
  '/dashboard/admin': Settings,
  '/dashboard/super-admin': Shield,
}

const sidebarLinks = [
  { href: '/dashboard/patient-intake', label: 'New Patient', roles: ['Medic', 'Manager', 'Admin', 'SuperAdmin'] },
  { href: '/dashboard/medic', label: 'My Records', roles: ['Medic'] },
  { href: '/dashboard/manager', label: 'Dashboard', roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { href: '/dashboard/drugs', label: 'Drug Inventory', roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { href: '/dashboard/reports', label: 'Reports', roles: ['Manager', 'Admin', 'SuperAdmin'] },
  { href: '/dashboard/admin', label: 'Settings', roles: ['Admin', 'SuperAdmin'] },
  { href: '/dashboard/super-admin', label: 'Admin Panel', roles: ['SuperAdmin'] },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function DashboardLayout({ children, title, medicName, role, companyName }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); flushSyncQueue() }
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    flushSyncQueue()
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const [locked, setLocked] = useState(() => typeof window !== 'undefined' && sessionStorage.getItem('sc_locked') === 'true')

  useEffect(() => {
    if (locked) {
      sessionStorage.setItem('sc_locked', 'true')
    } else {
      sessionStorage.removeItem('sc_locked')
    }
  }, [locked])

  useIdleTimer({
    timeout: 600000,
    onIdle: () => {
      localStorage.removeItem('token')
      setLocked(true)
    },
  })

  const visibleLinks = sidebarLinks.filter((l) => l.roles.includes(role))
  const initials = getInitials(medicName)

  if (locked) {
    return (
      <div className="min-h-screen bg-neutral-900/80 flex items-center justify-center px-4">
        <div className="bg-sand-50 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="text-headline-md font-semibold text-neutral-900 mb-2">Session locked</h2>
          <p className="text-body-sm text-neutral-500 mb-6">
            Your session was locked due to 10 minutes of inactivity.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('sc_locked')
              router.push('/login')
            }}
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-md bg-primary-500 text-white text-body-md font-semibold hover:bg-primary-700 transition-colors w-full"
          >
            Sign in again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh bg-neutral-50 font-sans flex overflow-hidden">
      <OfflineBanner />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between min-h-14 px-4 bg-white border-b border-neutral-100 safe-area-top">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-1 text-neutral-500 hover:text-neutral-900 rounded-sm transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex-1 text-center min-w-0 px-2">
          <p className="text-body-sm font-semibold text-neutral-900 truncate">{title}</p>
          <p className="text-micro text-neutral-400 truncate capitalize">{role}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-label-sm font-semibold">
            {initials}
          </span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 top-14 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-black/30 animate-[fadeIn_150ms_ease-out]" />
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-dvh w-72 lg:w-[260px] bg-primary-900 text-white flex flex-col
          transition-transform duration-200 ease-out will-change-transform
          lg:translate-x-0 lg:static lg:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-6 h-16 shrink-0 safe-area-top">
          <h1 className="text-display-sm font-bold tracking-tight">SiteCheck</h1>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-primary-100 hover:text-white transition-colors -mr-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-3 py-2 text-body-md overflow-y-auto">
          {visibleLinks.map((link) => {
            const Icon = linkIcon[link.href]
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 min-h-[44px] px-3 py-2 rounded-md transition-colors
                  ${active
                    ? 'bg-primary-700 text-white font-semibold'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                  }
                `}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Online/offline indicator */}
        <div className="px-6 py-3 flex items-center gap-2 text-label-sm border-t border-primary-700 shrink-0">
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-secondary-300" />
              <span className="text-primary-100">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-tertiary-300" />
              <span className="text-tertiary-100">Offline — saving locally</span>
            </>
          )}
        </div>

        {/* User info + Logout */}
        <div className="p-3 shrink-0 safe-area-bottom">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-label-sm font-semibold shrink-0">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-medium text-white truncate">{medicName}</p>
              <p className="text-micro text-primary-200 truncate capitalize">{companyName || role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full min-h-[44px] px-3 py-2 rounded-md text-primary-100 hover:bg-primary-700 hover:text-white transition-colors text-body-md"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 h-dvh">
        <header className="hidden lg:flex h-16 bg-white border-b border-neutral-100 items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-headline-md font-semibold text-neutral-900">{title}</h2>
            <p className="text-label-sm text-neutral-400 mt-0.5 capitalize">
              {companyName && <>{companyName} &middot; </>}{role}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-body-sm text-neutral-500">
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5 text-secondary-500" />
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-tertiary-500" />
              )}
            </div>
            <span className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white text-label-sm font-semibold">
              {initials}
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto lg:pt-0 pt-14">
          <div className="p-4 sm:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
