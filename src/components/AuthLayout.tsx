'use client'

import React from 'react'
import { AppSidebar } from '@/components/AppSidebar'
import { StatusBar } from '@/components/StatusBar'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BreadcrumbProvider } from '@/components/BreadcrumbContext'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen">
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4 bg-muted/30 sticky top-0 z-50">
            <SidebarTrigger className="-ml-1 h-7 w-7" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <StatusBar />
            </div>
            <ThemeToggle />
          </header>
          <div className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}
