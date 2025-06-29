'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home, FileText, Beaker } from 'lucide-react'
import Link from 'next/link'
import { UserNav } from './UserNav'
import { WorkspaceSidebarSection } from './workspace/WorkspaceSidebarSection'

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    title: 'Prompts',
    icon: FileText,
    href: '/prompts',
  },
]

const experimentItems = [
  {
    title: 'Combinatoric Chat',
    icon: Beaker,
    href: '/experiments/combinatoric-chat',
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Forgepad</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mx-2 my-2">
          <div className="h-px bg-sidebar-border" />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Experiments</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {experimentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mx-2 my-2">
          <div className="h-px bg-sidebar-border" />
        </div>
        
        <WorkspaceSidebarSection />
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  )
}
