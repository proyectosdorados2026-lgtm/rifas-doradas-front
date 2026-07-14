'use client'

import { usePathname } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { isPublicAdminPath } from '@/config/adminNav'

export default function AdminRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'
  if (isPublicAdminPath(pathname)) {
    return <>{children}</>
  }
  return <AdminShell>{children}</AdminShell>
}
