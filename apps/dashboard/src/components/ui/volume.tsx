"use client";

import type React from "react";

import { AnimatePresence, motion } from "motion/react";
import { Fragment, useState } from "react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";

export interface VolumeIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface VolumeIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  isMuted?: boolean;
  onMutedChange?: (isMuted: boolean) => void;
  mutedColor?: string;
  unmutedColor?: string;
}

const VolumeIcon = forwardRef<VolumeIconHandle, VolumeIconProps>(
  (
    {
      onMouseEnter,
      onMouseLeave,
      className,
      size = 28,
      isMuted: externalMuted,
      onMutedChange,
      mutedColor = "currentColor",
      unmutedColor = "currentColor",
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [internalMuted, setInternalMuted] = useState(true);
    const isControlledRef = useRef(false);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = externalMuted !== undefined;
    const isMuted = isControlled ? externalMuted : internalMuted;

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => setIsHovered(true),
        stopAnimation: () => setIsHovered(false),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          setIsHovered(true);
        } else {
          onMouseEnter?.(e);
        }
      },
      [onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          setIsHovered(false);
        } else {
          onMouseLeave?.(e);
        }
      },
      [onMouseLeave],
    );

    const handleClick = useCallback(() => {
      if (!isControlled) {
        setInternalMuted((prev) => !prev);
      } else if (onMutedChange) {
        onMutedChange(!isMuted);
      }
    }, [isControlled, isMuted, onMutedChange]);

    return (
      <div
        className={cn(
          `cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center`,
          className,
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={isMuted ? mutedColor : unmutedColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
          <AnimatePresence mode="wait" initial={false}>
            {!isMuted ? (
              <Fragment>
                <motion.path
                  d="M16 9a5 5 0 0 1 0 6"
                  animate={{ opacity: 1, transition: { delay: 0.1 } }}
                  initial={{ opacity: 0 }}
                  key="wave1"
                />
                <motion.path
                  d="M19.364 18.364a9 9 0 0 0 0-12.728"
                  animate={{ opacity: 1, transition: { delay: 0.2 } }}
                  initial={{ opacity: 0 }}
                  key="wave2"
                />
              </Fragment>
            ) : (
              <Fragment>
                <motion.line
                  x1="22"
                  x2="16"
                  y1="9"
                  y2="15"
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0, 1],
                    transition: { delay: 0.1 },
                  }}
                  initial={{ pathLength: 1, opacity: 1 }}
                  key="x1"
                />
                <motion.line
                  x1="16"
                  x2="22"
                  y1="9"
                  y2="15"
                  animate={{
                    pathLength: [0, 1],
                    opacity: [0, 1],
                    transition: { delay: 0.2 },
                  }}
                  initial={{ pathLength: 1, opacity: 1 }}
                  key="x2"
                />
              </Fragment>
            )}
          </AnimatePresence>
        </svg>
      </div>
    );
  },
);

VolumeIcon.displayName = "VolumeIcon";

export { VolumeIcon };

