"use client"
import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function VisualEnhance() {

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (canvasRef.current) {
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
        baseColor: [200 / 255, 182 / 255, 255 / 255],
        markerColor: [193 / 255, 175 / 255, 246 / 255],
        glowColor: [200 / 255, 182 / 255, 255 / 255],
        markers: [
          // North America
          { location: [37.7749, -122.4194], size: 0.05 }, // San Francisco
          { location: [37.3861, -122.0839], size: 0.08 }, // Mountain View
          { location: [37.8715, -122.2730], size: 0.04 }, // Berkeley
          { location: [37.4316, -78.6569], size: 0.07 }, // Virginia
          { location: [34.0007, -81.0348], size: 0.03 }, // Columbia
          { location: [49.2488, -122.9805], size: 0.06 }, // Burnaby

          // Europe
          { location: [56.8389, 60.6057], size: 0.09 },  // Yekaterinburg
          { location: [52.3676, 4.9041], size: 0.04 },   // Diemen
          { location: [50.6292, 3.0573], size: 0.07 },   // Lille
          { location: [40.4168, -3.7038], size: 0.05 },  // Madrid
          { location: [46.9851, 9.4417], size: 0.08 },   // Zizers
          { location: [47.2692, 11.4041], size: 0.03 },  // Innsbruck
          { location: [51.3492, -0.4595], size: 0.06 },  // Byfleet
          { location: [51.4956, 6.8528], size: 0.10 },   // Oberhausen

          // Asia & Pacific
          { location: [25.7617, -100.1904], size: 0.05 }, // Monterrey
          { location: [-29.7175, -52.4258], size: 0.08 }, // Santa Cruz do Sul
          { location: [3.0733, 101.5185], size: 0.04 },   // Shah Alam
          { location: [-37.8136, 144.9631], size: 0.07 }, // Melbourne
          { location: [-36.8509, 174.7645], size: 0.03 }, // Auckland
          { location: [1.3521, 103.8198], size: 0.09 },   // Singapore
          { location: [37.5665, 126.9780], size: 0.06 },  // Seoul
          { location: [30.2742, 120.1551], size: 0.04 },  // Hangzhou
          { location: [17.3850, 78.4867], size: 0.08 },   // Hyderabad
          { location: [33.6844, 73.0479], size: 0.05 },   // Islamabad
          { location: [23.8103, 90.4125], size: 0.07 },   // Dhaka

          // Africa
          { location: [-25.6747, 28.2295], size: 0.06 },  // Cullinan
        ],
        onRender: (state) => {
          // Called on every animation frame.
          // `state` will be an empty object, return updated params.
          state.phi = phi;
          phi += 0.005;
        },
      });

      return () => {
        globe.destroy();
      };
    }
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
