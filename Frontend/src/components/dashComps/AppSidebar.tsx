"use client"
import { NavMain } from "@/components/dashComps/NavMain"
import { NavSecondary } from "@/components/dashComps/NavSecondary"
import { NavUser } from "@/components/dashComps/NavUser"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CLIINIC_SIDE_PANEL_ITEMS } from "@/config/constants"
import Image from "next/image"
import Link from "next/link"
import * as React from "react"

export function AppSidebar({ selectedSection, onSelectSection, ...props }: {
  selectedSection: string;
  onSelectSection: (section: string) => void;
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={"/logo-green.png"} width={200} height={100} alt="" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Separator />
        <NavMain
          items={CLIINIC_SIDE_PANEL_ITEMS.navMain}
          selectedSection={selectedSection}
          onSelectSection={onSelectSection}
        />
        <NavSecondary items={CLIINIC_SIDE_PANEL_ITEMS.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}