import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import ChangeTheme from "./change-theme";

const Keyboard = dynamic(
  () => import("./keyboard").then((mod) => mod.Keyboard),
  {
    ssr: false,
  }
);

export default function Hero() {
  return (
    <section className="mt-[60px] lg:mt-[180px] min-h-[530px] relative">
      <div className="flex flex-col">
        <Link href="/">
          <Button
            variant="outline"
            className="rounded-full border-border flex space-x-2 items-center"
          >
            <span className="text-sm">Introducing Multiplayer</span>
            <ArrowRight />
          </Button>
        </Link>

        <h1 className="text-[30px] md:text-[90px] font-medium mt-6 leading-none">
          Start your
          <br /> AI quiz today!
        </h1>

        <p className="mt-4 md:mt-6 max-w-[600px] text-[#878787]">
          IntelliQ is an AI-powered platform that transforms the way you learn
          by offering personalized quizzes and multiplayer modes to engage with
          your peers.
        </p>

        <div className="mt-8">
          <div className="flex items-center space-x-4">
            <Link href="mailto:contact@arc-solutions.xyz">
              <Button
                variant="outline"
                className="border border-primary h-12 px-6"
              >
                Talk to us
              </Button>
            </Link>

            <a href="https://app.intelliq.dev">
              <Button className="h-12 px-5">Get Started</Button>
            </a>
          </div>
        </div>

        <div
          className="absolute transform-gpu opacity-86 pointer-events-none 
          
          sm:-right-[350px] sm:scale-[0.45] sm:-top-[200px]
          md:-top-[-25px] md:-right-[630px] md:scale-[0.35] md:mt-0
          lg:-right-[575px] lg:scale-[0.45] lg:-top-[-20px]
          xl:-right-[600px] xl:scale-[0.6] xl:-top-[200px] xl:rotate-[4deg]"
        >
          <div className="clip-cube">
            <Keyboard />
          </div>
        </div>
      </div>
    </section>
  );
}
