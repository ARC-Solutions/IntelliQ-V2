import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { cn } from '@/lib/utils';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className='flex h-screen w-screen'>
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <div className='flex-1 overflow-auto'>
          <SidebarTrigger />
          <main className='relative flex h-full w-full items-start justify-center'>
            {children}
            {/* <AnimatedGridPattern
              numSquares={30}
              maxOpacity={0.3}
              duration={3}
              repeatDelay={1}
              className={cn(
                '[mask-image:radial-gradient(750px_circle_at_center,white,transparent)]',
                'inset-x-0 inset-y-[0%] h-[80%] skew-y-12 -z-10',
              )}
            /> */}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
