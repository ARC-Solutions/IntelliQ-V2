import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import {
  allowSinglePlayerQuiz,
  allowMultiplayerQuiz,
  allowDocuments,
  allowBookmarks,
  allowRandomQuiz,
} from "@/flags";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [
    singlePlayerEnabled,
    multiplayerEnabled,
    documentsEnabled,
    bookmarksEnabled,
    randomQuizEnabled
  ] = await Promise.all([
    allowSinglePlayerQuiz(),
    allowMultiplayerQuiz(),
    allowDocuments(),
    allowBookmarks(),
    allowRandomQuiz()
  ]);

  const featureFlags = {
    singlePlayerEnabled,
    multiplayerEnabled,
    documentsEnabled,
    bookmarksEnabled,
    randomQuizEnabled,
  };

  return (
    <SidebarProvider>
      <div className="flex w-screen h-screen">
        {/* Sidebar */}
        <AppSidebar featureFlags={featureFlags} />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="relative flex items-start justify-center w-full h-full pt-14 md:pt-0">
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
