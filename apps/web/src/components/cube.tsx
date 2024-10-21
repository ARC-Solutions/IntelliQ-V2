import Spline from "@splinetool/react-spline/next";
import React, { Suspense } from "react";
import { headers } from "next/headers";
import UAParser from "ua-parser-js";
import Image from "next/image";
export async function Cube() {
  const { get } = headers();
  const ua = get("user-agent");
  const device = new UAParser(ua || "").getDevice();
  const isMobile = device.type === "mobile";

  return (
    <div className="animate-webgl-scale-in-fade">
      <Suspense
        fallback={
          <Image
            src="/hero/cube-fallback.png"
            alt="Cube fallback"
            className="w-full h-auto"
            width={600}
            height={600}
          />
        }
      >
        {isMobile ? (
          <img
            src="/hero/cubic.gif"
            alt="Animated cube"
            className="w-full h-auto"
          />
        ) : (
          <Spline
            scene="/hero/cube.splinecode"
            style={{
              width: "auto",
              height: "auto",
              background: "transparent",
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
