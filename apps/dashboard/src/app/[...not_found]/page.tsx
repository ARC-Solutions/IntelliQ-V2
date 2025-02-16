"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { ChevronRight, Brain } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
  const [number, setNumber] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNumber(404);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[100dvh] w-full relative opacity-0 [animation-delay:.85s] animate-fade-in-down">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 dark:from-primary/30 dark:via-primary/20 dark:to-secondary/20" />
      <div className="isolate relative w-full py-20 pb-10 lg:py-40 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div aria-hidden className="absolute inset-0 mix-blend-soft-light">
          <div className="dark:opacity-30">
            <IntelliQBackground />
          </div>
        </div>

        <div className="mx-auto px-6 md:px-8 max-w-[1200px] relative">
          <div className="relative w-full">
            <div className="relative flex flex-col gap-4 lg:gap-8 text-primary-foreground/50 dark:text-primary/50">
              <GridBorder left right overflow />

              <div className="relative flex flex-col w-full text-primary-foreground">
                <span className="relative !leading-[.76] text-8xl lg:text-[200px] font-bold -tracking-[.06em] -ml-[.7%]">
                  <div
                    aria-hidden
                    className="absolute inset-0 pointer-events-none select-none opacity-10 dark:opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]"
                  >
                    <NumberFlow
                      value={number}
                      transformTiming={{
                        duration: 1500,
                        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      format={{ minimumIntegerDigits: 3 }}
                    />
                  </div>
                  <div className="relative [-webkit-text-fill-color:transparent] [-webkit-text-stroke:hsl(var(--primary-foreground)/0.5)_1px] dark:[-webkit-text-stroke:theme(colors.customPurple)_1px] dark:[mask-image:linear-gradient(to_bottom,theme(colors.customPurple)_60%,transparent)]">
                    <NumberFlow
                      value={number}
                      transformTiming={{
                        duration: 1500,
                        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      format={{ minimumIntegerDigits: 3 }}
                    />
                  </div>
                </span>

                <GridBorder top bottom overflow />
              </div>

              <div className="relative flex flex-col w-full text-primary-foreground">
                <GridBorder top bottom />

                <span className="!leading-[.73] text-6xl lg:text-[7.125rem] -tracking-[.06em] -ml-1 shadow-2xl dark:text-white">
                  Intelligence not found.
                </span>
              </div>

              <div className="relative flex flex-col w-full">
                <GridBorder top bottom />

                <Link href="/" className="w-max">
                  <Button
                    variant="default"
                    size="lg"
                    className="h-10 lg:h-14 lg:text-lg transition-colors"
                  >
                    Return to IntelliQ
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="relative flex flex-col w-full mt-4 text-lg lg:mt-8 lg:text-4xl">
                <GridBorder top />
                <GridBorder bottom overflow />

                <span className="text-primary-foreground dark:text-white ">
                  Empowering intelligence, one quiz at a time.
                </span>
              </div>
            </div>
          </div>
        </div>

        <StaticBrains />
      </div>
    </div>
  );
}

function GridBorder({
  overflow = false,
  ...props
}: {
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  overflow?: boolean;
}) {
  const className =
    "pointer-events-none absolute inset-0 [&_line]:stroke-primary-foreground/25 dark:[&_line]:stroke-white/25 [&_line]:[stroke-width:2px] [&_line]:[stroke-dasharray:3,5]";

  return (
    <>
      {(props.left || props.right) && (
        <div
          aria-hidden
          className={cn(
            className,
            overflow &&
              "-top-[20%] -bottom-[20%] [mask-image:linear-gradient(to_bottom,transparent_3%,white_10%,white_90%,transparent_97%)]"
          )}
        >
          <svg height="100%" width="100%" preserveAspectRatio="none">
            {props.left && <line x1="0" y1="0" x2="0" y2="100%" />}
            {props.right && <line x1="100%" y1="0" x2="100%" y2="100%" />}
          </svg>
        </div>
      )}
      {(props.bottom || props.top) && (
        <div
          aria-hidden
          className={cn(
            className,
            overflow &&
              "-left-[20%] -right-[20%] [mask-image:linear-gradient(to_right,transparent_3%,white_10%,white_90%,transparent_97%)]"
          )}
        >
          <svg height="100%" width="100%" preserveAspectRatio="none">
            {props.top && <line x1="0" y1="0" x2="100%" y2="0" />}
            {props.bottom && <line x1="0" y1="100%" x2="100%" y2="100%" />}
          </svg>
        </div>
      )}
    </>
  );
}

function IntelliQBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-20"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id="intelliq-pattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="20"
            cy="20"
            r="1"
            fill="currentColor"
            className="text-primary-foreground dark:text-white"
          />
          <path
            d="M0 20 H40 M20 0 V40"
            stroke="currentColor"
            className="text-primary-foreground dark:text-white"
            strokeWidth="0.5"
            strokeDasharray="2,6"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#intelliq-pattern)" />
    </svg>
  );
}

function StaticBrains() {
  // Predefined positions for a more balanced layout
  const positions = [
    { top: "15%", left: "10%" },
    { top: "75%", left: "85%" },
    { top: "35%", left: "90%" },
    { top: "85%", left: "15%" },
    { top: "25%", left: "75%" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((pos, i) => (
        <Brain
          key={i}
          className="absolute text-primary-foreground opacity-0 animate-static-brain dark:text-primary/70"
          size={48 + i * 16}
          style={{
            top: pos.top,
            left: pos.left,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}
