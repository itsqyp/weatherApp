export interface DailyWeatherForecast {
  date: string;
  condition: string;
  weatherCode: number;
  maxTempC: number;
  minTempC: number;
  rainProbability: number | null;
  precipitationMm: number;
  maxWindKph: number;
  isStorm: boolean;
  isHighRain: boolean;
}

export interface WeatherForecast {
  city: string;
  country: string;
  days: DailyWeatherForecast[];
  outlook: {
    highRainDays: string[];
    stormDays: string[];
    highestRainProbability: number | null;
  };
}

const API_BASE_URL = "http://localhost:3000";

export async function fetchWeatherForecast(
  city: string,
  country: string,
): Promise<WeatherForecast> {
  const params = new URLSearchParams({ city, country });

  const response = await fetch(
    `${API_BASE_URL}/api/weather/forecast?${params}`,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ?? `Failed to fetch forecast (${response.status})`,
    );
  }

  return (await response.json()) as WeatherForecast;
}

export function formatForecastDay(date: string): string {
  // Use midday to avoid date changes caused by timezone offsets.
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
