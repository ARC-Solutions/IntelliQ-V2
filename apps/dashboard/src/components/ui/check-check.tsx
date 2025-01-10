"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import React from "react";

const pathVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: (custom: number) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    scale: [0.5, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
      delay: 0.1 * custom,
    },
  }),
};

export const CheckCheckIcon = ({ isAnimating }: { isAnimating: boolean }) => {
  const controls = useAnimation();

  React.useEffect(() => {
    if (isAnimating) {
      controls.start("animate");
    } else {
      controls.start("initial");
    }
  }, [isAnimating, controls]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        variants={pathVariants}
        initial="normal"
        animate={controls}
        d="M2 12 7 17L18 6"
        custom={0}
      />
      <motion.path
        variants={pathVariants}
        initial="normal"
        animate={controls}
        d="M13 16L14.5 17.5L22 10"
        custom={1}
      />
    </svg>
  );
};
