import Spline from "@splinetool/react-spline/next";
import React, { Suspense } from "react";

export async function Cube() {
  return (
    <div className="animate-webgl-scale-in-fade">
      <Suspense fallback={<div>Loading...</div>}>
        <Spline
          scene="https://prod.spline.design/t6DDxL1E-PqzZ3EZ/scene.splinecode"
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
