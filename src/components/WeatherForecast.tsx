import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CloudLightning,
  CloudRain,
  RefreshCw,
  Wind,
} from "lucide-react";

import {
  fetchWeatherForecast,
  formatForecastDay,
} from "../features/weather/weatherForecast";

interface WeatherForecastProps {
  city: string;
  country: string;
}

export default function WeatherForecast({
  city,
  country,
}: WeatherForecastProps) {
  const forecastQuery = useQuery({
    queryKey: ["weather-forecast", city, country],
    queryFn: () => fetchWeatherForecast(city, country),
    enabled: Boolean(city.trim() && country.trim()),

    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,

    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Loading state
  if (forecastQuery.isPending) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold sm:text-2xl">7-day forecast</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border border-muted bg-secondary/30"
            />
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (forecastQuery.isError) {
    return (
      <section className="rounded-2xl border border-muted bg-secondary/30 p-6">
        <h2 className="text-xl font-bold">7-day forecast</h2>

        <p className="mt-2 text-sm text-foreground/70">
          {forecastQuery.error instanceof Error
            ? forecastQuery.error.message
            : "Unable to load the forecast."}
        </p>

        <button
          type="button"
          onClick={() => void forecastQuery.refetch()}
          disabled={forecastQuery.isFetching}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary/80 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={forecastQuery.isFetching ? "animate-spin" : ""}
          />
          Try again
        </button>
      </section>
    );
  }

  const forecast = forecastQuery.data;

  if (!forecast || forecast.days.length === 0) {
    return null;
  }

  // Rainfall-based summary.
  // These thresholds use estimated precipitation, not probability.
  const rainyDays = forecast.days.filter((day) => day.precipitationMm >= 0.1);

  const highRainDays = forecast.days.filter((day) => day.precipitationMm >= 10);

  // Check both the backend storm flag and forecast condition text.
  const stormDays = forecast.days.filter(
    (day) => day.isStorm || day.condition.toLowerCase().includes("thunder"),
  );

  const highestRainfall = Math.max(
    0,
    ...forecast.days.map((day) => day.precipitationMm),
  );

  const isStormDay = (date: string) =>
    stormDays.some((day) => day.date === date);

  return (
    <section className="space-y-5">
      {/* Forecast heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">7-day forecast</h2>

          <p className="mt-1 text-sm text-foreground/70">
            Rainfall and weather outlook for {forecast.city}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void forecastQuery.refetch()}
          disabled={forecastQuery.isFetching}
          className="inline-flex items-center gap-2 rounded-full border border-muted bg-primary/30 px-3 py-2 text-sm font-medium hover:bg-primary/50 disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={forecastQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Rain and storm summary */}
      <div className="rounded-3xl border border-muted bg-secondary/40 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/50">
            {stormDays.length > 0 ? (
              <CloudLightning size={25} />
            ) : highRainDays.length > 0 ? (
              <CloudRain size={25} />
            ) : (
              <CalendarDays size={25} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold">
              {stormDays.length > 0
                ? "Thunderstorm conditions forecast"
                : highRainDays.length > 0
                  ? "Heavy rainfall expected"
                  : rainyDays.length > 0
                    ? "Rain expected in the coming days"
                    : "Mostly dry forecast"}
            </h3>

            <p className="mt-1 text-sm leading-6 text-foreground/75">
              {stormDays.length > 0
                ? `Thunderstorm conditions appear on ${stormDays
                    .map((day) => formatForecastDay(day.date))
                    .join(", ")}. Check local weather alerts before travelling.`
                : highRainDays.length > 0
                  ? `${highRainDays.length} of the next ${forecast.days.length} days have at least 10 mm of expected rainfall.`
                  : rainyDays.length > 0
                    ? `Rain is expected on ${rainyDays.length} of the next ${forecast.days.length} days.`
                    : "No measurable rainfall is currently forecast."}
            </p>
          </div>
        </div>

        {/* Forecast statistics */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-muted bg-background/70 p-4">
            <p className="text-sm text-foreground/70">
              Highest expected rainfall
            </p>

            <p className="mt-1 text-2xl font-bold">
              {highestRainfall.toFixed(1)} mm
            </p>
          </div>

          <div className="rounded-2xl border border-muted bg-background/70 p-4">
            <p className="text-sm text-foreground/70">Rainy days</p>

            <p className="mt-1 text-2xl font-bold">{rainyDays.length}</p>
          </div>

          <div className="rounded-2xl border border-muted bg-background/70 p-4">
            <p className="text-sm text-foreground/70">Thunderstorm days</p>

            <p className="mt-1 text-2xl font-bold">{stormDays.length}</p>
          </div>
        </div>

        {stormDays.length > 0 && (
          <p className="mt-4 flex items-start gap-2 text-sm text-foreground/80">
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            Forecast thunderstorm conditions are not a substitute for official
            severe-weather warnings.
          </p>
        )}
      </div>

      {/* Daily forecast cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {forecast.days.map((day) => (
          <article
            key={day.date}
            className={`rounded-2xl border p-4 shadow-sm ${
              isStormDay(day.date)
                ? "border-primary bg-primary/20"
                : day.precipitationMm >= 10
                  ? "border-muted bg-secondary/50"
                  : "border-muted bg-background/80"
            }`}
          >
            {/* Date and condition */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold">{formatForecastDay(day.date)}</h3>

                <p className="mt-1 text-xs leading-5 text-foreground/70">
                  {day.condition}
                </p>
              </div>

              {isStormDay(day.date) ? (
                <CloudLightning size={23} className="shrink-0" />
              ) : (
                <CloudRain size={23} className="shrink-0" />
              )}
            </div>

            {/* Temperature */}
            <div className="mt-4">
              <p className="text-3xl font-bold">
                {Math.round(day.maxTempC)}°
                <span className="ml-2 text-base font-medium text-foreground/60">
                  / {Math.round(day.minTempC)}°
                </span>
              </p>

              <p className="mt-1 text-xs text-foreground/60">High / low · °C</p>
            </div>

            {/* Weather details */}
            <div className="mt-4 space-y-3 border-t border-muted pt-3">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-foreground/70">
                  <CloudRain size={16} />
                  Rain chance
                </span>

                <span className="font-semibold">
                  {day.rainProbability === null
                    ? "N/A"
                    : `${day.rainProbability}%`}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-foreground/70">Expected rainfall</span>

                <span className="font-semibold">
                  {day.precipitationMm.toFixed(1)} mm
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-foreground/70">
                  <Wind size={16} />
                  Wind
                </span>

                <span className="font-semibold">{day.maxWindKph} km/h</span>
              </div>
            </div>

            {/* Risk indicators */}
            {isStormDay(day.date) && (
              <p className="mt-4 rounded-lg bg-primary/40 px-3 py-2 text-xs font-semibold">
                Thunderstorm conditions
              </p>
            )}

            {!isStormDay(day.date) && day.precipitationMm >= 10 && (
              <p className="mt-4 rounded-lg bg-primary/40 px-3 py-2 text-xs font-semibold">
                Heavy rainfall expected
              </p>
            )}

            {!isStormDay(day.date) &&
              day.precipitationMm >= 0.1 &&
              day.precipitationMm < 10 && (
                <p className="mt-4 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold">
                  Rain expected
                </p>
              )}
          </article>
        ))}
      </div>

      {/* Forecast information */}
      <p className="text-xs leading-5 text-foreground/60">
        Forecast data provided by MET Norway. Rainfall represents estimated
        daily precipitation accumulation. Rainy days are days with at least 0.1
        mm of expected precipitation. Heavy rainfall is flagged at 10 mm or
        more. Thunderstorm indicators are based on forecast conditions. Rain
        probability is shown separately when available. Forecasts can change.
      </p>
    </section>
  );
}
