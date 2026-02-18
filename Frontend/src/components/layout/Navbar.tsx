"use client";
import UserMenu from "@/components/common/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AppDropdown from "@/components/uiUtils/AppDropdown";
import { NAV_LINKS } from "@/config/constants";
import { useUser } from "@/contextApis/UserContext";
import { getUserInitials } from "@/utils/user";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user } = useUser();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#0f1d3a]/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-white/5"
          : "bg-[#192a56]"
      }`}
    >
      <div className="container mx-auto px-4 md:px-10">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo ── */}
          <Link href="/" className="flex-shrink-0 group">
            <Image
              src="/Group.png"
              alt="Symptoms Sense"
              width={160}
              height={40}
              className="h-8 w-auto transition-opacity duration-200 group-hover:opacity-80"
            />
          </Link>

          {/* ── Desktop centre pill nav ── */}
          <nav className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-2 py-1.5 gap-0.5 backdrop-blur-sm">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="relative px-4 py-1.5 text-[13px] font-medium text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-all duration-200"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {/* Sign In (unauthenticated, desktop only) */}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="hidden lg:inline-flex items-center gap-2 text-[13px] font-semibold text-white border border-white/20 rounded-full px-5 py-1.5 hover:bg-white/10 transition-all duration-200"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <AppDropdown
              open={open}
              onOpenChange={setOpen}
              align="end"
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/10 rounded-full"
                  aria-label="Toggle menu"
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              }
              items={NAV_LINKS.map(({ label, href }) => ({
                type: "item" as const,
                key: label,
                children: label,
                href,
              }))}
              className="w-52 bg-white"
            />

            {/* User avatar / dropdown */}
            <UserMenu
              trigger={
                <button className="flex items-center gap-2 focus:outline-none rounded-full p-0.5 ring-1 ring-white/20 hover:ring-white/40 transition-all duration-200">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={isAuthenticated ? user?.avatar_url || "/placeholder.svg" : undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="bg-[#273c75] text-white text-xs font-semibold">
                      {isAuthenticated ? getUserInitials() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {isAuthenticated && (
                    <span className="text-white text-sm font-medium hidden sm:inline pr-2">
                      {user?.name}
                    </span>
                  )}
                </button>
              }
              align="end"
              side="bottom"
              sideOffset={10}
            />
          </div>

        </div>
      </div>

      {/* Bottom glow accent line */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      )}
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
