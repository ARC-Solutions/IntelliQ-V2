"use client"
import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function VisualEnhance() {

  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 650 * 2,
      height: 650 * 2,
      phi: 0,
      theta: 0.2,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.784, 0.714, 1],
      markerColor: [0.784, 0.714, 1],
      glowColor: [0.784, 0.714, 1],
      markers: [
        // longitude latitude
        { location: [50.1109, 8.6821], size: 0.1 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className='justify-items-center '>
      <h2 className='text-4xl md:text-5xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 to-neutral-500 dark:from-neutral-100 dark:to-neutral-400 mb-4
      '>
        Global Infrastructure
      </h2>
      <canvas
        ref={canvasRef}
        style={{ width: 650, height: 650, maxWidth: '100%', aspectRatio: 1 }}
      />
    </div>
  );
}
