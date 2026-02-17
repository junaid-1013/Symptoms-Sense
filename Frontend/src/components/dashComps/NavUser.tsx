"use client";
import UserMenu from "@/components/common/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser } from "@/contextApis/UserContext";
import { getUserInitials } from "@/utils/user";
import { MoreVerticalIcon } from "lucide-react";

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user } = useUser()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserMenu
          trigger={
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.avatar_url || ""} alt={user?.name} />
                <AvatarFallback className="rounded-lg">
                  {getUserInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          }
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}