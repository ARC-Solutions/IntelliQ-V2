"use client";

import Spline from "@splinetool/react-spline/next";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export async function Cube() {
  const searchParams = useSearchParams();
  const viewport = searchParams.get("viewport");

  return (
    <div className="animate-webgl-scale-in-fade">
      {viewport === "mobile" ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto max-w-[300px]"
        >
          <source src="/cubic.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <Suspense fallback={<div>Loading...</div>}>
          <Spline
            scene="https://prod.spline.design/H4VB9VxDKY26loFd/scene.splinecode"
            style={{
              width: "auto",
              height: "auto",
              background: "transparent",
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
