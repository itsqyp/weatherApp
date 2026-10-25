import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";

import Navbar from "../components/Navbar";
import WeatherAtmosphere from "../components/WeatherAtmosphere";
import WeatherCard, { type WeatherCardData } from "../components/WeatherCard";

import homeData from "../data/home.json";

import WeatherSearch from "../components/WeatherSearch";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../lib/api";
import { useRef } from "react";
async function fetchRandomWeather(): Promise<WeatherCardData[]> {
  const response = await fetch(`${API_BASE_URL}/api/weather/random`);

  if (!response.ok) {
    const error = (await response.json()) as {
      message?: string;
    };

    throw new Error(error.message ?? "Failed to fetch random city weather.");
  }

  return response.json() as Promise<WeatherCardData[]>;
}

function Home() {
  const weatherSearchRef = useRef<HTMLElement>(null);
  function scrollToWeatherSearch() {
    weatherSearchRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  const prefersReducedMotion = useReducedMotion();

  const shouldReduceMotion = import.meta.env.PROD && prefersReducedMotion;

  const weatherQuery = useQuery({
    queryKey: ["weather", "random"],
    queryFn: fetchRandomWeather,
    staleTime: 10 * 60 * 1000, // Keep data fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep inactive cache for 30 minutes
    retry: false, // Avoid repeating failed requests
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // No automatic polling; fetch again when the query becomes stale
    // and is accessed, or when the user clicks Try again.
  });

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <WeatherAtmosphere
        rainCount={homeData.atmosphere.rainCount}
        petalCount={homeData.atmosphere.petalCount}
      />

      <div className="relative z-10 flex flex-1 flex-col">
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
              onClick={scrollToWeatherSearch}
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-foreground shadow-sm shadow-foreground/10 transition-all duration-200 hover:scale-105 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {homeData.hero.buttonText}
              <span aria-hidden="true">→</span>
            </button>
          </motion.div>

          {/* Random weather cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {weatherQuery.isPending ? (
              Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                  className="min-h-64 animate-pulse rounded-2xl border border-muted bg-muted/50 p-5"
                >
                  <p className="text-sm text-foreground/70">
                    Discovering a random city...
                  </p>

                  <div className="mt-6 h-5 w-2/3 rounded bg-secondary/60" />
                  <div className="mt-4 h-12 w-1/2 rounded bg-secondary/40" />

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <div className="h-14 rounded-xl bg-secondary/40" />
                    <div className="h-14 rounded-xl bg-secondary/40" />
                  </div>
                </motion.div>
              ))
            ) : weatherQuery.isError ? (
              <div className="rounded-2xl border border-muted bg-background p-5 shadow-sm shadow-foreground/5 sm:col-span-2">
                <h2 className="font-anton text-xl tracking-wide">
                  Weather unavailable
                </h2>

                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  {weatherQuery.error instanceof Error
                    ? weatherQuery.error.message
                    : "Unable to load random city weather."}
                </p>

                <button
                  type="button"
                  onClick={() => void weatherQuery.refetch()}
                  className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  Try again
                </button>
              </div>
            ) : (
              weatherQuery.data?.map((weather, index) => (
                <motion.div
                  key={`${weather.city}-${weather.country}`}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: shouldReduceMotion ? 0 : index * 0.1,
                  }}
                >
                  <WeatherCard weather={weather} />
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section ref={weatherSearchRef} className="scroll-mt-6">
          <WeatherSearch />
        </section>
        <Footer />
      </div>
    </main>
  );
}

export default Home;
