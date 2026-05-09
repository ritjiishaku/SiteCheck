'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types'

const roleRedirects: Record<string, string> = {
  SuperAdmin: '/dashboard/super-admin',
  Admin: '/dashboard/admin',
  Manager: '/dashboard/manager',
  Medic: '/dashboard/medic',
}

export function useAuthGuard(allowedRoles: UserRole[]) {
  const router = useRouter()

  useEffect(() => {
    async function check() {
      const token = localStorage.getItem('token')
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()

        if (!data.success || !data.data) {
          localStorage.removeItem('token')
          router.replace('/login')
          return
        }

        const role = data.data.role as UserRole
        if (!allowedRoles.includes(role)) {
          const dest = roleRedirects[role] || '/login'
          router.replace(dest)
        }
      } catch {
        router.replace('/login')
      }
    }

    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
