'use client';

import { type LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useQuiz } from '@/contexts/quiz-context';
import { useQuizCreation } from '@/contexts/quiz-creation-context';
import { useQuizLogic } from '@/contexts/quiz-logic-context';
import { useRouter } from 'next/navigation';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const { resetValues } = useQuizCreation();
  const { dispatch } = useQuiz();
  const router = useRouter();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link
              onClick={(e) => {
                e.preventDefault();
                resetValues();
                dispatch({ type: 'RESET_SUMMARY_QUIZ' });

                setTimeout(() => {
                  router.push(item.url);
                }, 0);
              }}
              href={item.url}
            >
              <SidebarMenuButton tooltip={item.title}>
                <item.icon size={28} />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
