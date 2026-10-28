import {
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getActiveUser } from "../features/auth/storage";
import { useSavedWeatherStore } from "../stores/savedWeatherStore";
import { useEffect, useRef, useState } from "react";
import {
  fetchWeatherForecast,
  formatForecastDay,
} from "../features/weather/weatherForecast";

export interface WeatherCardData {
  city: string;
  country: string;
  condition: string;
  temperatureC: number;
  temperatureF: number;
  feelsLikeC: number;
  feelsLikeF: number;
  humidity: number;
  windKph: number;
  iconUrl: string;
  localtime: string;
  lastUpdated: string;
}

interface WeatherCardProps {
  weather: WeatherCardData;
}
const EMPTY_LOCATIONS: { city: string; country: string }[] = [];
function WeatherCard({ weather }: WeatherCardProps) {
  const navigate = useNavigate();
  const activeUser = getActiveUser();

  const locations = useSavedWeatherStore((state) =>
    activeUser
      ? (state.locationsByUsername[activeUser.username.toLowerCase()] ??
        EMPTY_LOCATIONS)
      : EMPTY_LOCATIONS,
  );

  const saveLocation = useSavedWeatherStore((state) => state.saveLocation);
  const removeLocation = useSavedWeatherStore((state) => state.removeLocation);

  const isSaved = locations.some(
    (location) =>
      location.city.toLowerCase() === weather.city.toLowerCase() &&
      location.country.toLowerCase() === weather.country.toLowerCase(),
  );
  function toggleSavedLocation(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!activeUser) return;

    const location = {
      city: weather.city,
      country: weather.country,
    };

    if (isSaved) {
      removeLocation(activeUser.username, location);
    } else {
      saveLocation(activeUser.username, location);
    }
  }
  const cardRef = useRef<HTMLElement | null>(null);
  const [shouldLoadForecast, setShouldLoadForecast] = useState(false);

  useEffect(() => {
    const element = cardRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadForecast(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);
  const forecastQuery = useQuery({
    queryKey: ["weather-forecast", weather.city, weather.country],
    queryFn: () => fetchWeatherForecast(weather.city, weather.country),
    enabled: shouldLoadForecast,
    staleTime: 60 * 60 * 1000,
    gcTime: 6 * 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const highRainDays =
    forecastQuery.data?.days.filter((day) => day.isHighRain) ?? [];

  function openWeatherDetails() {
    navigate(
      `/weather-details?city=${encodeURIComponent(weather.city)}&country=${encodeURIComponent(weather.country)}`,
    );
  }

  return (
    <article
      ref={cardRef}
      role="link"
      tabIndex={0}
      aria-label={`View detailed weather for ${weather.city}, ${weather.country}`}
      onClick={openWeatherDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openWeatherDetails();
        }
      }}
      className="group cursor-pointer rounded-2xl border border-muted/70 bg-background/85 p-4 text-foreground shadow-lg shadow-foreground/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-background hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:p-5"
    >
      {/* City and weather condition */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-foreground/60">{weather.country}</p>

          <h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">
            {weather.city}
          </h2>

          <p className="mt-1 text-xs text-foreground/70 sm:text-sm">
            {weather.condition}
          </p>
        </div>

        <img
          src={weather.iconUrl}
          alt={weather.condition}
          width={48}
          height={48}
          loading="lazy"
          className="shrink-0 object-contain transition-transform duration-300 group-hover:scale-110"
        />
        <div className="flex shrink-0 items-start gap-1">
          {/* <img
            src={weather.iconUrl}
            alt={weather.condition}
            width={48}
            height={48}
            loading="lazy"
            className="object-contain transition-transform duration-300 group-hover:scale-110"
          /> */}

          <button
            type="button"
            onClick={toggleSavedLocation}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={
              isSaved
                ? `Remove ${weather.city} from saved locations`
                : `Save ${weather.city} to your locations`
            }
            aria-pressed={isSaved}
            title={isSaved ? "Remove saved location" : "Save location"}
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {isSaved ? (
              <BookmarkCheck size={19} aria-hidden="true" />
            ) : (
              <Bookmark size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Temperature */}
      <div className="mt-5 flex items-center gap-2">
        <span className="text-4xl font-light tracking-tight sm:text-5xl">
          {Math.round(weather.temperatureC)}°
        </span>

        <div className="text-xs leading-5 text-foreground/70">
          <p>Celsius</p>
          <p>{Math.round(weather.temperatureF)}°F</p>
        </div>
      </div>

      {/* Feels-like temperature */}
      <p className="mt-2 text-xs text-foreground/60">
        Feels like {Math.round(weather.feelsLikeC)}°C /{" "}
        {Math.round(weather.feelsLikeF)}°F
      </p>

      {/* Weather details */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-muted pt-4">
        <div className="flex items-center gap-2">
          <Droplets
            size={17}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />

          <div>
            <p className="text-[10px] text-foreground/55 sm:text-xs">
              Humidity
            </p>
            <p className="text-xs font-medium sm:text-sm">
              {weather.humidity}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind
            size={17}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />

          <div>
            <p className="text-[10px] text-foreground/55 sm:text-xs">Wind</p>
            <p className="text-xs font-medium sm:text-sm">
              {weather.windKph} km/h
            </p>
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <Thermometer
            size={17}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />

          <div>
            <p className="text-[10px] text-foreground/55 sm:text-xs">
              Last updated
            </p>
            <p className="text-xs font-medium sm:text-sm">
              {weather.lastUpdated}
            </p>
          </div>
        </div>
      </div>
      {/* Upcoming high-rain days */}
      <div className="mt-4 rounded-xl border border-muted bg-secondary/30 p-3">
        <div className="flex items-center gap-2">
          <CloudRain
            size={17}
            className="shrink-0 text-foreground"
            aria-hidden="true"
          />
          <p className="text-xs font-semibold">Upcoming rain</p>
        </div>

        {forecastQuery.isPending ? (
          <p className="mt-2 text-xs text-foreground/60">
            Checking the next 7 days...
          </p>
        ) : forecastQuery.isError ? (
          <p className="mt-2 text-xs text-foreground/60">
            Rain outlook unavailable
          </p>
        ) : highRainDays.length > 0 ? (
          <div className="mt-2 space-y-2">
            {highRainDays.slice(0, 2).map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="font-medium">
                  {formatForecastDay(day.date)}
                </span>

                <span className="rounded-full bg-primary/50 px-2 py-1 font-semibold">
                  {day.rainProbability}% chance
                </span>
              </div>
            ))}

            {highRainDays.length > 2 && (
              <p className="text-xs text-foreground/60">
                +{highRainDays.length - 2} more high-rain{" "}
                {highRainDays.length - 2 === 1 ? "day" : "days"}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-foreground/70">
            No days with a 60% or higher rain chance in the forecast.
          </p>
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-foreground/60 transition-colors group-hover:text-foreground">
        View weather details →
      </p>
    </article>
  );
}

export default WeatherCard;
