import { useQueries } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import Navbar from "../components/Navbar";
import WeatherAtmosphere from "../components/WeatherAtmosphere";
import WeatherCard, { type WeatherCardData } from "../components/WeatherCard";

import availableCities from "../data/cities.json";
import homeData from "../data/home.json";

async function fetchWeather(city: string): Promise<WeatherCardData> {
  const response = await fetch(
    `http://localhost:3000/api/weather?city=${encodeURIComponent(city)}`,
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message ?? `Failed to fetch ${city} weather.`);
  }

  return response.json() as Promise<WeatherCardData>;
}

function pickRandomCities(cities: string[], count: number): string[] {
  const shuffled = [...cities];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function Home() {
  const shouldReduceMotion = useReducedMotion();

  // Select four unique cities when Home mounts.
  const [selectedCities] = useState<string[]>(() =>
    pickRandomCities(availableCities, 4),
  );

  const weatherQueries = useQueries({
    queries: selectedCities.map((city) => ({
      queryKey: ["weather", city],
      queryFn: () => fetchWeather(city),
      staleTime: 5 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
      retry: 1,
    })),
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <WeatherAtmosphere
        rainCount={homeData.atmosphere.rainCount}
        petalCount={homeData.atmosphere.petalCount}
      />

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-10 lg:px-12">
          {/* Hero section */}
          <motion.div
            className="max-w-3xl"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <p className="mb-5 text-xs tracking-[0.3em] text-black sm:text-sm">
              {homeData.hero.eyebrow}
            </p>

            <h1 className="max-w-3xl font-anton text-5xl leading-tight tracking-wide sm:text-6xl lg:text-7xl">
              {homeData.hero.name}
              <br />
              <span className="text-primary">Journey Starts Here</span>
              <span className="text-secondary">.</span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-black/80 sm:text-base">
              {homeData.hero.description}
            </p>

            <button
              type="button"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-foreground shadow-sm shadow-foreground/10 transition-all duration-200 hover:scale-105 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {homeData.hero.buttonText}
              <span aria-hidden="true">→</span>
            </button>
          </motion.div>

          {/* Weather cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weatherQueries.map((query, index) => {
              const city = selectedCities[index];

              return (
                <motion.div
                  key={city}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                >
                  {query.isPending ? (
                    <div className="min-h-64 animate-pulse rounded-2xl border border-muted bg-muted/50 p-5">
                      <p className="text-sm text-foreground/70">
                        Loading {city} weather...
                      </p>

                      <div className="mt-6 h-5 w-2/3 rounded bg-secondary/60" />
                      <div className="mt-4 h-12 w-1/2 rounded bg-secondary/40" />

                      <div className="mt-8 grid grid-cols-2 gap-3">
                        <div className="h-14 rounded-xl bg-secondary/40" />
                        <div className="h-14 rounded-xl bg-secondary/40" />
                      </div>
                    </div>
                  ) : query.isError ? (
                    <div className="min-h-64 rounded-2xl border border-muted bg-background p-5 shadow-sm shadow-foreground/5">
                      <h2 className="font-anton text-xl tracking-wide">
                        {city}
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-foreground/70">
                        {query.error instanceof Error
                          ? query.error.message
                          : "Unable to load weather."}
                      </p>

                      <button
                        type="button"
                        onClick={() => void query.refetch()}
                        className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                      >
                        Try again
                      </button>
                    </div>
                  ) : query.data ? (
                    <WeatherCard weather={query.data} />
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default Home;
