'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import AuthLayout from '@/components/AuthLayout'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  // TODO: Replace with actual auth state management
  const user = useMemo(() => ({ plan: 'approved' }), []) // Temporary mock user

  useEffect(() => {
    // If user is authenticated but pending approval, redirect to pending page
    if (user && user.plan === 'pending' && pathname !== '/pending-approval') {
      router.push('/pending-approval')
    }
    // If user is approved but on pending page, redirect to dashboard
    else if (user && user.plan !== 'pending' && pathname === '/pending-approval') {
      router.push('/dashboard')
    }
  }, [user, pathname, router])

  // For pending users, just show the content without the auth layout
  if (user?.plan === 'pending') {
    return <>{children}</>
  }

  // For approved users, show the auth layout
  return <AuthLayout>{children}</AuthLayout>
}