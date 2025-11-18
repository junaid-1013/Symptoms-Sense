"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/contextApis/UserContext";
import { useLogout } from "@/hooks/useLogout";
import { getUserInitials } from "@/utils/user";
import { LogOut, User, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface UserMenuProps {
    trigger: ReactNode;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
    className?: string;
}

const UserMenu = ({
    trigger,
    align = "end",
    side = "bottom",
    sideOffset = 4,
    className,
}: UserMenuProps) => {
    const { user, isAuthenticated } = useUser();
    const { onLogout } = useLogout();
    const router = useRouter();

    const profilePath = user?.user_type === "doctor" ? "/doctorProfile" : user?.user_type === "admin" ? "/adminDashboard" : "/profile";

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    const handleLogout = () => {
        onLogout();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                side={side}
                sideOffset={sideOffset}
                className={className ?? "w-56"}
            >
                {isAuthenticated ? (
                    <>
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user?.avatar_url || ""} alt={user?.name || ""} />
                                    <AvatarFallback>
                                        {getUserInitials(user?.name || user?.email || "U")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="truncate font-medium">{user?.name}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user?.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                handleNavigate(profilePath);
                            }}
                        >
                            <UserCircle className="mr-2 h-4 w-4" />
                            Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(event) => {
                                event.preventDefault();
                                handleLogout();
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex items-center gap-2 py-1.5 text-sm">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        <User className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="font-medium">Welcome</span>
                                    <span className="text-xs text-muted-foreground">
                                        Sign in or create an account
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                handleNavigate("/login");
                            }}
                        >
                            Sign In
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={(event) => {
                                event.preventDefault();
                                handleNavigate("/register");
                            }}
                        >
                            Create Account
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default UserMenu;