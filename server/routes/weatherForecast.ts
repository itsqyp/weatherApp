import type { FastifyPluginAsync } from "fastify";

interface LocationSearchResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

type LocationSearchResponse = LocationSearchResult[];

interface OpenMeteoDailyResponse {
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
  error?: boolean;
  reason?: string;
}

interface ForecastDay {
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

interface ForecastResult {
  city: string;
  country: string;
  days: ForecastDay[];
  outlook: {
    highRainDays: string[];
    stormDays: string[];
    highestRainProbability: number | null;
  };
}

interface CachedForecast {
  data: ForecastResult;
  cachedAt: number;
}

const WEATHER_API_KEY = process.env.WEATHER_API;

const FORECAST_CACHE_TTL = 60 * 60 * 1000; // 1 hour

const forecastCache = new Map<string, CachedForecast>();

// Share an ongoing request between callers requesting the same location.
const forecastInFlight = new Map<string, Promise<ForecastResult>>();

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Light snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Light rain showers",
    81: "Moderate rain showers",
    82: "Heavy rain showers",
    85: "Light snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };

  return conditions[code] ?? "Conditions unavailable";
}

function isStormCode(code: number): boolean {
  return code === 95 || code === 96 || code === 99;
}

async function fetchForecast(
  city: string,
  country: string,
  apiKey: string,
): Promise<ForecastResult> {
  // Resolve the requested city using WeatherAPI.com.
  const locationParams = new URLSearchParams({
    key: apiKey,
    q: `${city}, ${country}`,
  });

  const locationResponse = await fetch(
    `https://api.weatherapi.com/v1/search.json?${locationParams}`,
  );

  if (!locationResponse.ok) {
    throw new Error(
      `WeatherAPI location lookup failed with status ${locationResponse.status}`,
    );
  }

  const locations = (await locationResponse.json()) as LocationSearchResponse;

  const location = locations.find(
    (item) =>
      normalize(item.name) === normalize(city) &&
      normalize(item.country) === normalize(country),
  );

  // Never silently use a different location.
  if (!location) {
    const error = new Error("The requested location could not be found.");
    error.name = "LocationNotFoundError";
    throw error;
  }

  // Request seven daily forecasts from Open-Meteo.
  const forecastParams = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: "7",
    timezone: "auto",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
  });

  const forecastResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?${forecastParams}`,
  );

  if (!forecastResponse.ok) {
    const errorBody = await forecastResponse.text();

    throw new Error(
      `Open-Meteo forecast request failed with status ${forecastResponse.status}: ${errorBody}`,
    );
  }

  const forecast = (await forecastResponse.json()) as OpenMeteoDailyResponse;

  if (forecast.error) {
    throw new Error(forecast.reason ?? "Open-Meteo returned a forecast error.");
  }

  const daily = forecast.daily;

  if (!daily || !daily.time?.length) {
    throw new Error("Forecast data was not available for this location.");
  }

  const days: ForecastDay[] = daily.time.map((date, index) => {
    const weatherCode = daily.weather_code[index];
    const rainProbability = daily.precipitation_probability_max[index] ?? null;

    return {
      date,
      condition: getCondition(weatherCode),
      weatherCode,
      maxTempC: daily.temperature_2m_max[index],
      minTempC: daily.temperature_2m_min[index],
      rainProbability,
      precipitationMm: daily.precipitation_sum[index],
      maxWindKph: daily.wind_speed_10m_max[index],
      isStorm: isStormCode(weatherCode),
      isHighRain: rainProbability !== null && rainProbability >= 60,
    };
  });

  return {
    city: location.name,
    country: location.country,
    days,
    outlook: {
      highRainDays: days.filter((day) => day.isHighRain).map((day) => day.date),
      stormDays: days.filter((day) => day.isStorm).map((day) => day.date),
      highestRainProbability: days.reduce<number | null>(
        (highest, day) =>
          day.rainProbability === null
            ? highest
            : Math.max(highest ?? 0, day.rainProbability),
        null,
      ),
    },
  };
}

const weatherForecastRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: {
      city?: string;
      country?: string;
    };
  }>("/api/weather/forecast", async (request, reply) => {
    const city = request.query.city?.trim();
    const country = request.query.country?.trim();

    if (!city || !country) {
      return reply.code(400).send({
        message: "Both city and country are required.",
      });
    }

    if (!WEATHER_API_KEY) {
      return reply.code(500).send({
        message: "The weather API key is not configured.",
      });
    }

    const cacheKey = `${normalize(city)}|${normalize(country)}`;

    // 1. Return a cached result if it is still fresh.
    const cached = forecastCache.get(cacheKey);

    if (cached) {
      if (Date.now() - cached.cachedAt < FORECAST_CACHE_TTL) {
        request.log.info({ city, country }, "Serving forecast from cache");

        return cached.data;
      }

      forecastCache.delete(cacheKey);
    }

    // 2. If this location is already being fetched, reuse that request.
    const existingRequest = forecastInFlight.get(cacheKey);

    if (existingRequest) {
      request.log.info({ city, country }, "Reusing in-flight forecast request");

      try {
        return await existingRequest;
      } catch (error) {
        request.log.warn(
          { city, country, err: error },
          "Shared forecast request failed",
        );

        return reply
          .code(
            error instanceof Error && error.name === "LocationNotFoundError"
              ? 404
              : 502,
          )
          .send({
            message:
              error instanceof Error && error.name === "LocationNotFoundError"
                ? error.message
                : "Unable to retrieve the seven-day forecast.",
          });
      }
    }

    // 3. Start one request and let all concurrent callers share it.
    const pendingRequest = fetchForecast(city, country, WEATHER_API_KEY);

    forecastInFlight.set(cacheKey, pendingRequest);

    try {
      const result = await pendingRequest;

      // Cache successful responses only.
      forecastCache.set(cacheKey, {
        data: result,
        cachedAt: Date.now(),
      });

      request.log.info(
        { city, country },
        "Fetched and cached seven-day forecast",
      );

      return result;
    } catch (error) {
      request.log.error(
        { city, country, err: error },
        "Failed to retrieve seven-day forecast",
      );

      if (error instanceof Error && error.name === "LocationNotFoundError") {
        return reply.code(404).send({
          message: error.message,
        });
      }

      return reply.code(502).send({
        message: "Unable to retrieve the seven-day forecast.",
      });
    } finally {
      // Only remove the request if this handler still owns the entry.
      if (forecastInFlight.get(cacheKey) === pendingRequest) {
        forecastInFlight.delete(cacheKey);
      }
    }
  });
};

export default weatherForecastRoutes;
