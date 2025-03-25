"use client";

import { ChevronsUpDown, LifeBuoy, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/user-context";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { SettingsDialog } from "./settings-dialog";

export function NavUser({
  user,
  isNavbar = false,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    id: string;
  };
  isNavbar?: boolean;
}) {
  const { isMobile } = useSidebar();
  const { signout, updateUserProfile, currentUser } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { setTheme } = useTheme();
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(
    "soundEnabled",
    true,
  );

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    setTimeout(() => {
      setIsSettingsOpen(true);
    }, 10);
  };

  const handleSaveSettings = async (settings: {
    name: string;
    avatar: string;
    theme: string;
    sound: boolean;
  }) => {
    // Update user profile
    await updateUserProfile({
      name: settings.name,
      avatar: settings.avatar,
    });

    // Apply theme using next-themes
    setTheme(settings.theme);

    // Update sound preference using the hook setter
    setSoundEnabled(settings.sound);
  };

  // Use currentUser.img for the avatar if available, otherwise fall back to prop
  const currentAvatar = currentUser?.img || user.avatar;
  const currentName = currentUser?.name || user.name;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              {isNavbar ? (
                <Avatar className="w-8 h-8 rounded-lg cursor-pointer">
                  <AvatarImage src={currentAvatar} alt={currentName} />
                  <AvatarFallback className="rounded-lg">
                    {currentName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarImage src={currentAvatar} alt={currentName} />
                    <AvatarFallback className="rounded-lg">
                      {currentName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-sm leading-tight text-left">
                    <span className="font-semibold truncate">
                      {currentName}
                    </span>
                    <span className="text-xs truncate">{user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="w-8 h-8 rounded-lg">
                    <AvatarImage src={currentAvatar} alt={currentName} />
                    <AvatarFallback className="rounded-lg">
                      {currentName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-sm leading-tight text-left">
                    <span className="font-semibold truncate">
                      {currentName}
                    </span>
                    <span className="text-xs truncate">{user.email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* <DropdownMenuItem>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem> */}

                <DropdownMenuItem
                  asChild
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  <a href="mailto:support@intelliq.dev">
                    <LifeBuoy />
                    Support
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSettingsClick();
                  }}
                >
                  <Settings />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        user={user}
        onSave={handleSaveSettings}
        soundEnabled={soundEnabled}
      />
    </>
  );
}
