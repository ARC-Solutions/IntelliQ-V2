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
    <>
      {/* Mobile Header - Always visible on mobile */}
      {isMobile && (
        <div className="fixed top-0 z-[10] flex items-center w-full px-4 border-b h-14 bg-background">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="w-8 h-8" />
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 text-xl font-bold text-white bg-black rounded-md dark:bg-white dark:text-black">
                  IQ
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NavUser user={data.user} />
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Works on both mobile and desktop */}
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"} {...props}>
        <SidebarHeader className="flex flex-col gap-2 p-4">
          <div
            className={`flex items-center ${state === "collapsed" && !isMobile ? "justify-center" : "justify-between"}`}
          >
            <div
              className={`flex items-center ${state === "collapsed" && !isMobile ? "justify-center" : "gap-2"}`}
            >
              <div className="flex items-center justify-center w-10 h-10 text-xl font-bold text-white bg-black rounded-md dark:bg-white dark:text-black">
                IQ
              </div>
              {(state === "expanded" || isMobile) && (
                <span className="text-xl font-bold text-black dark:text-white">
                  IntelliQ
                </span>
              )}
            </div>
            {(state === "expanded" || isMobile) && (
              <SidebarTrigger className="w-8 h-8" />
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
            <SidebarTrigger className="items-center w-8 h-8" />
          )}
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}