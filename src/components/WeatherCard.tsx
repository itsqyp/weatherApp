import {
  CloudSun,
  Sun,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

export interface WeatherCardData {
  id: number;
  country: string;
  city: string;
  condition: string;
  temperatureC: number;
  temperatureF: number;
  humidity: number;
  windKph: number;
  feelsLikeC: number;
  feelsLikeF: number;
  icon: string;
}

interface WeatherCardProps {
  weather: WeatherCardData;
}

const weatherIcons: Record<string, LucideIcon> = {
  "cloud-sun": CloudSun,
  sun: Sun,
  "cloud-rain": CloudRain,
  "cloud-lightning": CloudLightning,
};

function WeatherCard({ weather }: WeatherCardProps) {
  const WeatherIcon = weatherIcons[weather.icon] ?? CloudSun;

  return (
    <article className="group rounded-2xl border border-white/15 bg-white/[0.08] p-4 text-white shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.12] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-white/60">{weather.country}</p>
          <h2 className="mt-1 truncate text-lg font-semibold sm:text-xl">
            {weather.city}
          </h2>
          <p className="mt-1 text-xs text-white/70 sm:text-sm">
            {weather.condition}
          </p>
        </div>

        <WeatherIcon
          size={32}
          strokeWidth={1.5}
          className="shrink-0 text-primary transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="text-4xl font-light tracking-tight sm:text-5xl">
          {Math.round(weather.temperatureC)}°
        </span>
        <div className="text-xs leading-5 text-white/70">
          <p>Celsius</p>
          <p>{Math.round(weather.temperatureF)}°F</p>
        </div>
      </div>

      <p className="mt-2 text-xs text-white/60">
        Feels like {Math.round(weather.feelsLikeC)}°C /{" "}
        {Math.round(weather.feelsLikeF)}°F
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <Droplets size={17} className="shrink-0 text-primary" />
          <div>
            <p className="text-[10px] text-white/55 sm:text-xs">Humidity</p>
            <p className="text-xs font-medium sm:text-sm">
              {weather.humidity}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Wind size={17} className="shrink-0 text-primary" />
          <div>
            <p className="text-[10px] text-white/55 sm:text-xs">Wind</p>
            <p className="text-xs font-medium sm:text-sm">
              {weather.windKph} km/h
            </p>
          </div>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <Thermometer size={17} className="shrink-0 text-primary" />
          <div>
            <p className="text-[10px] text-white/55 sm:text-xs">
              Temperature range
            </p>
            <p className="text-xs font-medium sm:text-sm">
              {Math.round(weather.temperatureC)}°C /{" "}
              {Math.round(weather.temperatureF)}°F
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default WeatherCard;
