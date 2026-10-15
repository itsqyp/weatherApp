import { Droplets, Wind, Thermometer } from "lucide-react";

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

function WeatherCard({ weather }: WeatherCardProps) {
  return (
    <article className="group rounded-2xl border border-muted/70 bg-background/85 p-4 text-foreground shadow-lg shadow-foreground/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-background sm:p-5">
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
    </article>
  );
}

export default WeatherCard;
