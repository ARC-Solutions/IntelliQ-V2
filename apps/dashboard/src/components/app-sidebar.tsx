'use client';

import * as React from 'react';
import { UsersRound, UserRound, House, GalleryVerticalEnd, Settings2, History } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/user-context';

const data = {
  user: {
    name: '',
    email: '',
    avatar: '',
    id: '',
  },
  teams: [
    {
      name: 'IntelliQ',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: House,
    },
    {
      title: 'Quiz Me',
      url: '/single-player/quiz',
      icon: UserRound,
    },
    {
      title: 'Multiplayer',
      url: '/multiplayer',
      icon: UsersRound,
    },
    {
      title: 'History',
      url: '/history',
      icon: History,
    },

    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentUser } = useAuth();
  if (currentUser) {
    data.user.avatar = currentUser.img;
    data.user.name = currentUser.name;
    data.user.email = currentUser.email;
  }

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
