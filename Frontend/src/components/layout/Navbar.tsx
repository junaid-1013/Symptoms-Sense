"use client";
import UserMenu from "@/components/common/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AppDropdown from "@/components/uiUtils/AppDropdown";
import { NAV_LINKS } from "@/config/constants";
import { useUser } from "@/contextApis/UserContext";
import { getUserInitials } from "@/utils/user";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useUser();

  return (
    <header className="flex items-center w-full bg-[#192a56] md:px-16 px-4 shadow-md">
      <div className="container">
        <div className="relative flex items-center justify-between">
          <div className="w-44">
            <Link href="/" className="block w-full py-5">
              <Image src="/Group.png" alt="logo" width={800} height={100} />
            </Link>
          </div>
          <div className="flex items-center justify-end gap-2 flex-1">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:flex-1 lg:justify-center">
              <ul className="flex items-center gap-8">
                {NAV_LINKS.map(({ label, href }) => (
                  <ListItem
                    key={label}
                    NavLink={href}
                    navItemStyles="text-white hover:text-gray-300 transition-colors"
                  >
                    {label}
                  </ListItem>
                ))}
              </ul>
            </nav>

            {/* Mobile Hamburger Menu */}
            <AppDropdown
              open={open}
              onOpenChange={setOpen}
              align="start"
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/10 focus:ring-2 focus:ring-white"
                  aria-label="Toggle menu"
                >
                  {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              }
              items={NAV_LINKS.map(({ label, href }) => ({
                type: "item" as const,
                key: label,
                children: label,
                href,
              }))}
              className="w-48 bg-white"
            />

            {/* Profile Dropdown */}
            <UserMenu
              trigger={
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-white rounded-full p-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={isAuthenticated ? user?.avatar_url || "/placeholder.svg" : undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-[#273c75] text-white font-semibold">
                      {isAuthenticated ? getUserInitials() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isAuthenticated && (
                    <span className="text-white text-sm font-medium hidden sm:inline">
                      {user?.name}
                    </span>
                  )}
                </button>
              }
              align="end"
              side="bottom"
              sideOffset={8}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

const ListItem = ({ children, navItemStyles, NavLink }: any) => {
  return (
    <li>
      <Link href={NavLink} className={`text-base font-medium ${navItemStyles}`}>
        {children}
      </Link>
    </li>
  );
};
