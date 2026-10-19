import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clock3,
  Droplets,
  MapPin,
  RefreshCw,
  Thermometer,
  Wind,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import type { ReactNode } from "react";
import Navbar from "../components/Navbar";
import type { WeatherCardData } from "../components/WeatherCard";
import WeatherHistoryCharts from "../components/WeatherHistoryCharts";
const API_BASE_URL = "http://localhost:3000";

async function fetchWeatherDetails(
  city: string,
  country: string,
): Promise<WeatherCardData> {
  const location = `${city}, ${country}`;

  const response = await fetch(
    `${API_BASE_URL}/api/weather?city=${encodeURIComponent(location)}`,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ||
        errorData?.error ||
        `Failed to fetch weather data (${response.status})`,
    );
  }

  return response.json() as Promise<WeatherCardData>;
}

function formatLocalTime(value: string): string {
  if (!value) return "Unavailable";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-foreground/10 bg-white/50 p-5 shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/40">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-foreground/70">{label}</p>
        <p className="mt-1 break-words text-lg font-semibold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function WeatherDetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-muted" />

      <div className="rounded-3xl border border-foreground/10 bg-secondary/20 p-8">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="mt-6 h-20 w-40 rounded-xl bg-muted" />
        <div className="mt-4 h-5 w-32 rounded bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-2xl border border-foreground/10 bg-white/40"
          />
        ))}
      </div>
    </div>
  );
}

export default function WeatherDetails() {
  const [searchParams] = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const city = searchParams.get("city")?.trim() ?? "";
  const country = searchParams.get("country")?.trim() ?? "";

  const hasLocation = Boolean(city && country);

  const weatherQuery = useQuery({
    queryKey: ["weather-details", city, country],
    queryFn: () => fetchWeatherDetails(city, country),
    enabled: hasLocation,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const weather = weatherQuery.data;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Link
            to="/home"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-primary/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          {!hasLocation ? (
            <section className="rounded-3xl border border-foreground/10 bg-secondary/30 p-8 text-center sm:p-12">
              <MapPin className="mx-auto mb-4" size={36} />

              <h1 className="text-2xl font-bold">No location selected</h1>

              <p className="mt-3 text-foreground/70">
                Choose a city from the weather cards to view its details.
              </p>

              <Link
                to="/home"
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-semibold transition-colors hover:bg-primary/80"
              >
                Explore Cities
              </Link>
            </section>
          ) : weatherQuery.isLoading ? (
            <WeatherDetailsSkeleton />
          ) : weatherQuery.isError ? (
            <section className="rounded-3xl border border-foreground/10 bg-secondary/30 p-8 text-center sm:p-12">
              <h1 className="text-2xl font-bold">Unable to load weather</h1>

              <p className="mt-3 text-foreground/70">
                {weatherQuery.error instanceof Error
                  ? weatherQuery.error.message
                  : "Something went wrong while fetching weather data."}
              </p>

              <button
                type="button"
                onClick={() => void weatherQuery.refetch()}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                <RefreshCw size={17} />
                Try Again
              </button>
            </section>
          ) : weather ? (
            <div className="space-y-8">
              <section className="overflow-hidden rounded-3xl border border-foreground/10 bg-secondary/30 p-6 shadow-sm sm:p-10">
                <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-foreground/70">
                      <MapPin size={18} />
                      <span>Current weather</span>
                    </div>

                    <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                      {weather.city}
                    </h1>

                    <p className="mt-1 text-foreground/70">{weather.country}</p>

                    <p className="mt-5 text-lg font-medium">
                      {weather.condition}
                    </p>

                    <p className="mt-2 text-sm text-foreground/70">
                      Feels like {weather.feelsLikeC}°C
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {weather.iconUrl && (
                      <img
                        src={weather.iconUrl}
                        alt={weather.condition}
                        className="h-24 w-24 object-contain sm:h-32 sm:w-32"
                      />
                    )}

                    <div>
                      <motion.p
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 8 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-6xl font-bold tracking-tight sm:text-7xl"
                      >
                        {weather.temperatureC}°
                      </motion.p>

                      <p className="mt-2 text-sm text-foreground/70">Celsius</p>

                      <p className="text-sm text-foreground/70">
                        {weather.temperatureF}°F
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-foreground/10 pt-5 text-sm text-foreground/70">
                  <p className="flex items-center gap-2">
                    <Clock3 size={16} />
                    Local time: {formatLocalTime(weather.localtime)}
                  </p>

                  <p>Updated: {formatLocalTime(weather.lastUpdated)}</p>
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-xl font-bold sm:text-2xl">
                  Weather details
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <MetricCard
                    icon={<Thermometer size={22} />}
                    label="Feels like"
                    value={`${weather.feelsLikeC}°C / ${weather.feelsLikeF}°F`}
                  />

                  <MetricCard
                    icon={<Droplets size={22} />}
                    label="Humidity"
                    value={`${weather.humidity}%`}
                  />

                  <MetricCard
                    icon={<Wind size={22} />}
                    label="Wind speed"
                    value={`${weather.windKph} km/h`}
                  />
                </div>
              </section>
              <WeatherHistoryCharts
                city={weather.city}
                country={weather.country}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => void weatherQuery.refetch()}
                  disabled={weatherQuery.isFetching}
                  className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-primary/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={weatherQuery.isFetching ? "animate-spin" : ""}
                  />
                  {weatherQuery.isFetching
                    ? "Refreshing..."
                    : "Refresh weather"}
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      </main>
    </div>
  );
}
