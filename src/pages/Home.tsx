import { motion, useReducedMotion } from "motion/react";

import Navbar from "../components/Navbar";
import WeatherAtmosphere from "../components/WeatherAtmosphere";
import homeData from "../data/home.json";

function Home() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-white">
      <WeatherAtmosphere
        rainCount={homeData.atmosphere.rainCount}
        petalCount={homeData.atmosphere.petalCount}
      />

      <div className="relative z-10">
        <Navbar />

        <section className="flex min-h-[calc(100vh-4rem)] items-center px-6 py-20 sm:px-10 lg:px-20">
          <motion.div
            className="max-w-3xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <p className="mb-5 text-xs tracking-[0.3em] text-white/75 sm:text-sm">
              {homeData.hero.eyebrow}
            </p>

            <h1 className="max-w-3xl text-5xl leading-tight font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your Weather
              <br />
              <span className="text-primary">Journey Starts Here</span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              {homeData.hero.description}
            </p>

            <button
              type="button"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-foreground transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {homeData.hero.buttonText}
              <span aria-hidden="true">→</span>
            </button>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

export default Home;
