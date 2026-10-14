import { motion, useReducedMotion } from "motion/react";
import "./WeatherAtmosphere.css";

interface WeatherAtmosphereProps {
  rainCount?: number;
  petalCount?: number;
}

function WeatherAtmosphere({
  rainCount = 48,
  petalCount = 14,
}: WeatherAtmosphereProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="weather-atmosphere" aria-hidden="true">
      <div className="weather-sky" />
      <div className="weather-mountains" />
      <div className="weather-horizon" />

      {!shouldReduceMotion && (
        <>
          <div className="weather-rain">
            {Array.from({ length: rainCount }, (_, index) => (
              <span
                key={`rain-${index}`}
                className="rain-drop"
                style={{
                  left: `${(index * 37) % 100}%`,
                  animationDelay: `${-((index * 17) % 30) / 10}s`,
                  animationDuration: `${0.7 + (index % 5) * 0.15}s`,
                }}
              />
            ))}
          </div>

          <div className="weather-petals">
            {Array.from({ length: petalCount }, (_, index) => (
              <motion.span
                key={`petal-${index}`}
                className="petal"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.9, 0.65, 0],
                  x: [0, 35, -15, 55],
                  y: ["-10vh", "35vh", "70vh", "115vh"],
                  rotate: [0, 150, 320, 520],
                }}
                transition={{
                  duration: 10 + (index % 6) * 2,
                  delay: index * 0.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  left: `${(index * 29) % 100}%`,
                  top: `${-10 - (index % 5) * 8}%`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default WeatherAtmosphere;
