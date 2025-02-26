"use client";

import Spline from "@splinetool/react-spline/next";
import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import UAParser from "ua-parser-js";

export function Keyboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const device = new UAParser(ua).getDevice();
    setIsMobile(device.type === "mobile");
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      <Suspense
        fallback={
          <Image
            src="/hero/keyboard-fallback.png"
            alt="Keyboard fallback"
            className="w-full h-auto"
            width={600}
            height={600}
            onLoad={() => setIsLoaded(true)}
          />
        }
      >
        {isMobile ? (
          <img
            src="/hero/keyboard.gif"
            alt="Animated keyboard"
            className="w-full h-auto"
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <Spline
            scene="/hero/intelliq_keyboard.splinecode"
            style={{
              width: "1725px",
              height: "872px",
              background: "transparent",
            }}
            onLoad={() => setIsLoaded(true)}
          />
        )}
      </Suspense>
    </motion.div>
  );
}
