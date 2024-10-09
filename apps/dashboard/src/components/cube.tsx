import Spline from "@splinetool/react-spline/next";

export async function Cube() {
  return (
    <div className="animate-webgl-scale-in-fade">
      <Spline
        scene="https://prod.spline.design/H4VB9VxDKY26loFd/scene.splinecode"
        style={{
          width: "auto",
          height: "auto",
          background: "transparent",
        }}
      />
    </div>
  );
}
