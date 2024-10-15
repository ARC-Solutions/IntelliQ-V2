"use client";

import { motion, useReducedMotion } from "framer-motion";
import type React from "react";

function FadeInStagger({ ...props }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "0px 0px 0px 0px" }}
      transition={{ staggerChildren: 0.15 }}
      {...props}
    />
  );
}
export const Wordmark: React.FC<{ className?: string }> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 64 },
    visible: { opacity: 1, y: 0 },
  };
  const transition = {
    duration: 0.05,
    ease: "easeOut",
    type: "spring",
    stiffness: 200,
    damping: 50,
  };

  return (
    <FadeInStagger className={className}>
      <svg
        width="1650"
        height="308"
        viewBox="0 0 1650 308"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          variants={variants}
          transition={transition}
          d="M 0 363.022 L 0 8.022 L 43 8.022 L 43 363.022 L 0 363.022 Z"
          fill="url(#paint4_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 129 363.022 L 129 98.022 L 167.5 98.022 L 168.5 145.522 A 95.962 95.962 0 0 1 171.594 138.333 C 178.365 124.239 187.946 113.495 199.508 105.921 A 91.158 91.158 0 0 1 250 92.022 C 310.5 92.022 339.5 136.522 339.5 192.522 L 339.5 363.022 L 297.5 363.022 L 297.5 204.522 C 297.5 166.815 287.729 142.432 264.997 133.196 A 63.391 63.391 0 0 0 241 129.022 A 88.419 88.419 0 0 0 229.919 129.702 C 194.872 134.129 171 160.065 171 204.522 L 171 363.022 L 129 363.022 Z"
          fill="url(#paint3_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 516.5 363.022 A 155.834 155.834 0 0 1 511.995 362.958 C 467.091 361.659 446 340.526 446 295.022 L 446 135.022 L 407 135.022 L 407 98.022 L 446 98.022 L 446 36.022 L 488 36.022 L 488 98.022 L 558.5 98.022 L 558.5 135.022 L 488 135.022 L 488 294.022 A 77.333 77.333 0 0 0 488.029 296.16 C 488.647 318.5 499.167 326.022 520.5 326.022 L 558.5 326.022 L 558.5 363.022 L 516.5 363.022 Z"
          fill="url(#paint0_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 833 288.022 A 110.372 110.372 0 0 1 775.878 357.011 A 121.186 121.186 0 0 1 722 369.022 C 666.922 369.022 627.214 339.63 610.005 290.747 A 181.297 181.297 0 0 1 600.5 230.522 A 185.074 185.074 0 0 1 608.721 174.018 C 617.54 146.512 633.18 124.862 654.312 110.733 A 116.343 116.343 0 0 1 720 92.022 C 789 92.022 837 142.022 837 231.022 L 837 243.522 L 644.5 243.522 A 168.199 168.199 0 0 0 645.286 253.23 C 649.079 287.406 663.023 310.025 685.053 321.085 A 81.579 81.579 0 0 0 722 329.022 A 86.653 86.653 0 0 0 742.388 326.72 A 61.726 61.726 0 0 0 788 284.522 L 833 288.022 Z M 791 206.522 C 788.586 175.743 777.43 154.98 760.391 143.354 A 70.464 70.464 0 0 0 720 132.022 A 97.151 97.151 0 0 0 717.71 132.049 C 687.784 132.754 665.303 147.369 653.094 175.084 A 119.972 119.972 0 0 0 644.5 206.522 L 791 206.522 Z"
          fill="url(#paint2_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 952.5 363.022 C 928.009 363.022 909.759 353.66 903.175 332.469 A 65.457 65.457 0 0 1 900.5 313.022 L 900.5 8.022 L 942.5 8.022 L 942.5 309.522 A 24.309 24.309 0 0 0 943.203 315.633 C 945.006 322.559 950.271 326.022 959 326.022 L 982 326.022 L 982 363.022 L 952.5 363.022 Z"
          fill="url(#paint1_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 1094 363.022 C 1069.509 363.022 1051.259 353.66 1044.675 332.469 A 65.457 65.457 0 0 1 1042 313.022 L 1042 8.022 L 1084 8.022 L 1084 309.522 A 24.309 24.309 0 0 0 1084.703 315.633 C 1086.506 322.559 1091.771 326.022 1100.5 326.022 L 1123.5 326.022 L 1123.5 363.022 L 1094 363.022 Z"
          fill="url(#paint1_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 1183.5 363.022 L 1183.5 98.022 L 1225.5 98.022 L 1225.5 363.022 L 1183.5 363.022 Z M 1182.5 56.522 L 1182.5 7.522 L 1226.5 7.522 L 1226.5 56.522 L 1182.5 56.522 Z"
          fill="url(#paint1_linear_830_5782)"
        />
        <motion.path
          variants={variants}
          transition={transition}
          d="M 1541.5 397.522 L 1512 359.522 A 98.671 98.671 0 0 1 1508.974 360.785 C 1502.667 363.299 1495.492 365.441 1487.77 367.107 A 178.895 178.895 0 0 1 1450.5 371.022 C 1384.758 371.022 1337.086 336.958 1311.502 285.161 A 224.005 224.005 0 0 1 1290 186.022 A 247.641 247.641 0 0 1 1297.508 124.322 C 1309.047 79.528 1333.664 42.764 1369.801 21.129 A 154.849 154.849 0 0 1 1450.5 0.022 A 186.561 186.561 0 0 1 1467.447 0.78 C 1525.966 6.117 1567.777 39.232 1590.8 87.321 A 228.847 228.847 0 0 1 1611.5 186.022 C 1611.5 251.522 1587.5 309.022 1543.5 342.022 L 1587.5 397.522 L 1541.5 397.522 Z M 1517.5 309.022 A 115.024 115.024 0 0 0 1539.994 284.985 C 1557.598 259.803 1566.5 226.419 1566.5 186.022 C 1566.5 107.522 1528.5 42.022 1450.5 42.022 C 1399.922 42.022 1366.373 69.563 1349.035 110.331 A 194.505 194.505 0 0 0 1335 186.022 C 1335 264.022 1373.5 329.022 1450.5 329.022 C 1459.563 329.022 1467.453 328.436 1474.172 327.02 A 49.231 49.231 0 0 0 1485 323.522 L 1433.5 259.022 L 1479.5 259.022 L 1517.5 309.022 Z"
          fill="url(#paint1_linear_830_5782)"
        />
        <defs>
          <linearGradient
            id="paint0_linear_830_5782"
            x1="-243.049"
            y1="-228.123"
            x2="-150.186"
            y2="402.501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="0.693236" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_830_5782"
            x1="-243.049"
            y1="-228.123"
            x2="-150.186"
            y2="402.501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="0.693236" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id="paint2_linear_830_5782"
            x1="-243.049"
            y1="-228.123"
            x2="-150.186"
            y2="402.501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="0.693236" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id="paint3_linear_830_5782"
            x1="-243.049"
            y1="-228.123"
            x2="-150.186"
            y2="402.501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="0.693236" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient
            id="paint4_linear_830_5782"
            x1="-243.049"
            y1="-228.123"
            x2="-150.186"
            y2="402.501"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" stopOpacity="0.4" />
            <stop offset="0.693236" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>
      </svg>
    </FadeInStagger>
  );
};
