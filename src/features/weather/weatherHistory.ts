const API_BASE_URL = "http://localhost:3000";

export interface WeatherHistoryDay {
  date: string;
  temperatureMinC: number | null;
  temperatureMeanC: number | null;
  temperatureMaxC: number | null;
  humidityMean: number | null;
  windSpeedMeanKph: number | null;
  precipitationMm: number | null;
}

export interface WeatherHistoryData {
  city: string;
  country: string;
  timezone: string;
  days: WeatherHistoryDay[];
  source: "Open-Meteo" | string;
}

export async function fetchWeatherHistory(
  city: string,
  country: string,
): Promise<WeatherHistoryData> {
  const params = new URLSearchParams({ city, country });

  const response = await fetch(
    `${API_BASE_URL}/api/weather/history?${params.toString()}`,
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.message ??
        `Failed to fetch historical weather (${response.status}).`,
    );
  }

  return (await response.json()) as WeatherHistoryData;
}
