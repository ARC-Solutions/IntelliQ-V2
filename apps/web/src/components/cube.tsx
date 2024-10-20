import Spline from "@splinetool/react-spline/next";
import React, { Suspense } from "react";

export async function Cube() {
  return (
    <div className="animate-webgl-scale-in-fade">
      <Suspense fallback={<div>Loading...</div>}>
        <Spline
          scene="https://prod.spline.design/6en5-sGU9Wp4QI5m/scene.splinecode"
          style={{
            width: "auto",
            height: "auto",
            background: "transparent",
          }}
        />
      </Suspense>
    </div>
  );
}
