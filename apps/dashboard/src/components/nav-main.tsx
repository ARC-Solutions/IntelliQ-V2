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

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
}) {
  const { dispatch } = useQuiz();
  const { resetValues } = useQuizCreation();
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <Link
              onClick={() => {
                dispatch({ type: 'RESET_SUMMARY_QUIZ' });
                resetValues();
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
