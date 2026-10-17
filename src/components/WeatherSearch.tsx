import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Search, X } from "lucide-react";

import WeatherCard, { type WeatherCardData } from "./WeatherCard";
import homeData from "../data/home.json";
const API_URL = "http://localhost:3000";

interface CityCandidate {
  city: string;
  country: string;
}

const featuredCities: CityCandidate[] = [
  { city: "Dhaka", country: "Bangladesh" },
  { city: "London", country: "United Kingdom" },
  { city: "New York", country: "United States" },
  { city: "Tokyo", country: "Japan" },
  { city: "Paris", country: "France" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "Singapore", country: "Singapore" },
  { city: "Sydney", country: "Australia" },
  { city: "Toronto", country: "Canada" },
];

async function fetchCityWeather(
  candidate: CityCandidate,
): Promise<WeatherCardData> {
  const params = new URLSearchParams({
    city: `${candidate.city}, ${candidate.country}`,
  });

  const response = await fetch(`${API_URL}/api/weather?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Weather unavailable for ${candidate.city}.`);
  }

  return (await response.json()) as WeatherCardData;
}

async function fetchCitiesWeather(
  cities: CityCandidate[],
): Promise<WeatherCardData[]> {
  const results = await Promise.all(
    cities.map(async (city) => {
      try {
        return await fetchCityWeather(city);
      } catch {
        return null;
      }
    }),
  );

  const weather = results.filter(
    (item): item is WeatherCardData => item !== null,
  );

  if (weather.length === 0 && cities.length > 0) {
    throw new Error("Weather could not be loaded. Please try again.");
  }

  return weather;
}

async function fetchMatchingCities(query: string): Promise<WeatherCardData[]> {
  const params = new URLSearchParams({ q: query });

  const response = await fetch(
    `${API_URL}/api/cities/search?${params.toString()}`,
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      error?.message ?? "Unable to search cities. Please try again.",
    );
  }

  const cities = (await response.json()) as CityCandidate[];

  return fetchCitiesWeather(cities);
}

function WeatherSearch() {
  const [input, setInput] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const prefersReducedMotion = useReducedMotion();

  const isSearching = submittedSearch.length > 0;

  const weatherQuery = useQuery({
    queryKey: [
      "weather",
      isSearching ? "city-search" : "featured",
      submittedSearch.toLowerCase(),
    ],
    queryFn: () =>
      isSearching
        ? fetchMatchingCities(submittedSearch)
        : fetchCitiesWeather(featuredCities),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = input.trim();

    if (!query) {
      setSubmittedSearch("");
      return;
    }

    if (query.length < 2) {
      return;
    }

    setSubmittedSearch(query);
  }

  function clearSearch() {
    setInput("");
    setSubmittedSearch("");
  }

  const shouldReduceMotion = prefersReducedMotion;

  return (
    <section
      aria-labelledby="weather-search-title"
      className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 sm:px-10 lg:px-12"
    >
      <div className="mb-8">
        <p className="mb-3 text-xs tracking-[0.3em] text-black sm:text-sm">
          {homeData.searchSection.title}
        </p>

        <h2
          id="weather-search-title"
          className="font-anton text-3xl tracking-wide sm:text-4xl lg:text-5xl"
        >
          {homeData.searchSection.subtitle}
          <span className="text-primary">.</span>
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-black sm:text-base">
          {homeData.searchSection.description}
        </p>
      </div>

      {/* Search happens only on form submission */}
      <form onSubmit={handleSubmit} className="mb-8 w-full">
        <label htmlFor="weather-city-search" className="sr-only">
          {homeData.searchSection.placeholder}
        </label>

        <div className="relative w-full">
          <input
            id="weather-city-search"
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Enter a city or country and press Enter..."
            autoComplete="off"
            className="w-full rounded-2xl border border-muted/80 bg-background/90 py-4 pl-5 pr-28 text-sm text-foreground shadow-lg shadow-foreground/5 backdrop-blur-xl outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/40 sm:py-5 sm:pl-6 sm:text-base"
          />

          {input && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search and show featured cities"
              className="absolute right-[4.5rem] top-1/2 -translate-y-1/2 rounded-full p-2 text-foreground/60 transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <X size={18} aria-hidden="true" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Search cities"
            disabled={input.trim().length < 2}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-primary p-3 text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <Search size={20} aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-xs text-black">
          {homeData.searchSection.buttonText}
        </p>
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-anton text-xl tracking-wide sm:text-2xl text-black">
          {isSearching ? `Results for "${submittedSearch}"` : "Featured cities"}
        </h3>

        <p className="text-xs text-foreground/70 sm:text-sm">
          {isSearching
            ? "Up to 9 matching locations"
            : "Nine destinations to explore"}
        </p>
      </div>

      {weatherQuery.isPending ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading weather"
        >
          {Array.from({
            length: isSearching ? 6 : featuredCities.length,
          }).map((_, index) => (
            <div
              key={index}
              className="min-h-64 animate-pulse rounded-2xl border border-muted/70 bg-background/70 p-5"
            >
              <div className="h-3 w-1/3 rounded bg-secondary/60" />
              <div className="mt-4 h-6 w-2/3 rounded bg-secondary/60" />
              <div className="mt-3 h-3 w-1/2 rounded bg-secondary/40" />
              <div className="mt-7 h-12 w-1/2 rounded bg-secondary/50" />
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="h-12 rounded-xl bg-secondary/40" />
                <div className="h-12 rounded-xl bg-secondary/40" />
              </div>
            </div>
          ))}
        </div>
      ) : weatherQuery.isError ? (
        <div
          role="alert"
          className="rounded-2xl border border-muted bg-background/90 p-6"
        >
          <h4 className="font-anton text-xl tracking-wide">
            Weather unavailable
          </h4>

          <p className="mt-3 text-sm leading-6 text-foreground/75">
            {weatherQuery.error instanceof Error
              ? weatherQuery.error.message
              : "Unable to load weather right now."}
          </p>

          <button
            type="button"
            onClick={() => void weatherQuery.refetch()}
            className="mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            Try again
          </button>
        </div>
      ) : weatherQuery.data?.length === 0 ? (
        <div
          role="status"
          className="rounded-2xl border border-muted bg-background/80 p-8 text-center"
        >
          <h4 className="font-anton text-xl tracking-wide">No cities found</h4>

          <p className="mt-2 text-sm text-foreground/70">
            Try another city or country name.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {weatherQuery.data?.map((weather, index) => (
            <motion.div
              key={`${weather.city}-${weather.country}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                delay: shouldReduceMotion ? 0 : index * 0.05,
              }}
            >
              <WeatherCard weather={weather} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export default WeatherSearch;
