"use client";

import {
  BookOpen,
  Bookmark,
  Dices,
  GalleryVerticalEnd,
  History,
  House,
  Paperclip,
  Settings2,
  UsersRound,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
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

interface FeatureFlags {
  singlePlayerEnabled: boolean;
  multiplayerEnabled: boolean;
  documentsEnabled: boolean;
  bookmarksEnabled: boolean;
  randomQuizEnabled: boolean;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  featureFlags: FeatureFlags;
}

export function AppSidebar({ featureFlags, ...props }: AppSidebarProps) {
  const { currentUser } = useAuth();
  const { state, isMobile } = useSidebar();

  const data = {
    user: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
      avatar: currentUser?.img || "",
      id: currentUser?.id || "",
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
        icon: BookOpen,
        locked: !featureFlags.singlePlayerEnabled,
      },
      {
        title: "Multiplayer",
        url: "/multiplayer",
        icon: UsersRound,
        locked: !featureFlags.multiplayerEnabled,
      },
      {
        title: "Documents",
        url: "/documents",
        icon: Paperclip,
        locked: !featureFlags.documentsEnabled,
      },
      {
        title: "Random",
        url: "/random-quiz",
        icon: Dices,
        locked: !featureFlags.randomQuizEnabled,
      },
      {
        title: "History",
        url: "/history",
        icon: History,
        locked: !featureFlags.singlePlayerEnabled,
      },
      {
        title: "Bookmarks",
        url: "/bookmarks",
        icon: Bookmark,
        locked: !featureFlags.bookmarksEnabled,
      },
      {
        title: "Settings",
        url: "/settings",
        icon: Settings2,
      },
    ],
  };

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
              <NavUser user={data.user} isNavbar={true} />
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
          <NavUser user={data.user} isNavbar={false} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
