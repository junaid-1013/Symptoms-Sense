"use client"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, MailIcon, type LucideIcon } from "lucide-react"

export function NavMain({
  items,
  selectedSection,
  onSelectSection,
}: {
  items: {
    title: string
    icon?: LucideIcon
  }[]
  selectedSection: string
  onSelectSection: (title: string) => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Dashboard"
              className={`${selectedSection === "Dashboard" ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 ease-linear" : ""}`}
              isActive={selectedSection === "Dashboard"}
              onClick={() => onSelectSection("Dashboard")}
            >
              <LayoutDashboardIcon />
              <span>Dashboard</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <MailIcon />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={`${selectedSection === item.title ? "!bg-primary !text-primary-foreground hover:!bg-primary/90 ease-linear" : ""}`}
                isActive={selectedSection === item.title}
                onClick={() => onSelectSection(item.title)}
              >
                {item.icon && <item.icon size={22} />}<span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}