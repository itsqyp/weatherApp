import type { WeatherCardData } from "../../components/WeatherCard";

const API_BASE_URL = "http://localhost:3000";

export async function fetchCurrentWeather(
  city: string,
  country: string,
): Promise<WeatherCardData> {
  const params = new URLSearchParams({
    city: `${city}, ${country}`,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/weather?${params.toString()}`,
  );

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      error?.message ?? `Failed to fetch weather (${response.status}).`,
    );
  }

  return (await response.json()) as WeatherCardData;
}
