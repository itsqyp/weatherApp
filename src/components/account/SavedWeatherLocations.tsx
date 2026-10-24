import { useQueries } from "@tanstack/react-query";
import { Bookmark, Trash2 } from "lucide-react";

import WeatherCard from "../WeatherCard";
import { fetchCurrentWeather } from "../../features/weather/currentWeather";
import { useSavedWeatherStore } from "../../stores/savedWeatherStore";

interface Props {
  username: string;
}

function SavedWeatherLocations({ username }: Props) {
  const locations = useSavedWeatherStore(
    (state) =>
      state.locationsByUsername[username.toLowerCase()] ?? EMPTY_LOCATIONS,
  );

  const removeLocation = useSavedWeatherStore((state) => state.removeLocation);

  const weatherQueries = useQueries({
    queries: locations.map((location) => ({
      queryKey: ["weather", "saved", location.city, location.country],
      queryFn: () => fetchCurrentWeather(location.city, location.country),
      staleTime: 5 * 60 * 1000,
      retry: 1,
    })),
  });

  return (
    <section className="rounded-2xl border border-muted bg-background/90 p-5 shadow-sm shadow-foreground/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/40">
          <Bookmark size={20} />
        </span>

        <div>
          <h2 className="font-anton text-xl tracking-wide">Saved weather</h2>
          <p className="mt-1 text-sm text-foreground/65">
            {locations.length} saved{" "}
            {locations.length === 1 ? "location" : "locations"}
          </p>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-muted p-8 text-center">
          <Bookmark
            size={28}
            className="mx-auto text-foreground/50"
            aria-hidden="true"
          />
          <p className="mt-3 font-medium">No saved locations yet</p>
          <p className="mt-2 text-sm text-foreground/65">
            Visit Home and select the bookmark icon on a weather card to save a
            city.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location, index) => {
            const query = weatherQueries[index];

            return (
              <div
                key={`${location.city}-${location.country}`}
                className="min-w-0"
              >
                {query.isPending ? (
                  <div className="min-h-64 animate-pulse rounded-2xl border border-muted bg-muted/40 p-5">
                    <p className="text-sm text-foreground/70">
                      Loading {location.city}...
                    </p>
                    <div className="mt-6 h-5 w-2/3 rounded bg-secondary/60" />
                    <div className="mt-4 h-12 w-1/2 rounded bg-secondary/40" />
                  </div>
                ) : query.isError ? (
                  <div className="flex min-h-64 flex-col rounded-2xl border border-muted bg-background p-5">
                    <h3 className="font-semibold">{location.city}</h3>
                    <p className="mt-1 text-xs text-foreground/60">
                      {location.country}
                    </p>
                    <p className="mt-4 text-sm text-foreground/70">
                      {query.error instanceof Error
                        ? query.error.message
                        : "Unable to load this location's weather."}
                    </p>

                    <button
                      type="button"
                      onClick={() => removeLocation(username, location)}
                      className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-primary/50 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary"
                    >
                      <Trash2 size={15} />
                      Remove saved location
                    </button>
                  </div>
                ) : query.data ? (
                  <WeatherCard weather={query.data} />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

const EMPTY_LOCATIONS: { city: string; country: string }[] = [];

export default SavedWeatherLocations;
