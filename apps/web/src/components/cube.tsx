import Spline from "@splinetool/react-spline/next";
import React, { Suspense } from "react";
import { headers } from "next/headers";
import UAParser from "ua-parser-js";

export async function Cube() {
  const { get } = headers();
  const ua = get("user-agent");
  const device = new UAParser(ua || "").getDevice();
  const isMobile = device.type === "mobile";

  return (
    <div className="animate-webgl-scale-in-fade">
      <Suspense fallback={<div>Loading...</div>}>
        {isMobile ? (
          <img
            src="/hero/cubic.gif"
            alt="Animated cube"
            className="w-full h-auto"
          />
        ) : (
          <Spline
            scene="https://prod.spline.design/H4VB9VxDKY26loFd/scene.splinecode"
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
