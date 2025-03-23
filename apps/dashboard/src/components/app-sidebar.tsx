"use client";

import * as React from "react";
import {
  UsersRound,
  UserRound,
  House,
  GalleryVerticalEnd,
  Settings2,
  History,
  Bookmark,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/user-context";

const data = {
  user: {
    name: "",
    email: "",
    avatar: "",
    id: "",
  },
  teams: [
    {
      name: "IntelliQ",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: House,
    },
    {
      title: "Quiz Me",
      url: "/single-player/quiz",
      icon: UserRound,
    },
    {
      title: "Multiplayer",
      url: "/multiplayer",
      icon: UsersRound,
    },
    {
      title: "History",
      url: "/history",
      icon: History,
    },
    {
      title: "Bookmarks",
      url: "/bookmarks",
      icon: Bookmark,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentUser } = useAuth();
  const { state, isMobile } = useSidebar();
  if (currentUser) {
    data.user.avatar = currentUser.img;
    data.user.name = currentUser.name;
    data.user.email = currentUser.email;
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 flex flex-col gap-2">
        <div
          className={`flex items-center ${state === "collapsed" && !isMobile ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`flex items-center ${state === "collapsed" && !isMobile ? "justify-center" : "gap-2"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md dark:bg-white dark:text-black bg-black text-white font-bold text-xl">
              IQ
            </div>
            {(state === "expanded" || isMobile) && (
              <span className="text-xl font-bold text-black dark:text-white">
                IntelliQ
              </span>
            )}
          </div>
          {(state === "expanded" || isMobile) && (
            <SidebarTrigger className="h-8 w-8" />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent
        className={state === "collapsed" && !isMobile ? "items-center" : ""}
      >
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-4">
        {state === "collapsed" && !isMobile && (
          <SidebarTrigger className="h-8 w-8 items-center" />
        )}
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
