"use client";

import type { LucideIcon } from "lucide-react";
import { Lock } from "lucide-react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useQuiz } from "@/contexts/quiz-context";
import { useQuizCreation } from "@/contexts/quiz-creation-context";

import { useRouter } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    locked?: boolean;
  }[];
}) {
  const { resetValues } = useQuizCreation();
  const { dispatch } = useQuiz();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link
              onClick={(e) => {
                e.preventDefault();
                resetValues();
                dispatch({ type: "RESET_ALL" });

                setTimeout(() => {
                  item.locked ? null : router.push(item.url);
                }, 0);
              }}
              href={item.url}
              className={`${item.locked ? "pointer-events-none" : ""}`}
            >
              <SidebarMenuButton tooltip={item.title}>
                <item.icon size={28} />
                <span>{item.title}</span>
              </SidebarMenuButton>

              {item.locked && (
                <div
                  className={`absolute inset-0 rounded-md ${
                    isCollapsed
                      ? "bg-background/40 dark:bg-background/50"
                      : "backdrop-blur-[1px] bg-background/30 dark:bg-background/40"
                  } flex items-center justify-center`}
                >
                  {isCollapsed ? (
                    <div className="absolute bottom-1 right-1 flex items-center justify-center w-3.5 h-3.5 bg-background rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
              )}
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
