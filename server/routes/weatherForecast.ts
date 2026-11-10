import type { FastifyPluginAsync } from "fastify";

interface LocationSearchResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
  tz_id?: string;
}

type LocationSearchResponse = LocationSearchResult[];

interface MetPeriod {
  summary?: {
    symbol_code?: string;
  };
  details?: {
    precipitation_amount?: number;
    probability_of_precipitation?: number;
    probability_of_thunder?: number;
    air_temperature_max?: number;
    air_temperature_min?: number;
  };
}

interface MetTimeseriesItem {
  time: string;
  data: {
    instant?: {
      details?: {
        air_temperature?: number;
        wind_speed?: number;
      };
    };
    next_1_hours?: MetPeriod;
    next_6_hours?: MetPeriod;
    next_12_hours?: MetPeriod;
  };
}

interface MetForecastResponse {
  properties?: {
    meta?: {
      updated_at?: string;
    };
    timeseries?: MetTimeseriesItem[];
  };
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
    highestPrecipitationMm: number;
  };
}

interface CachedForecast {
  data: ForecastResult;
  expiresAt: number;
}

interface SelectedPeriod {
  period: MetPeriod;
  hours: number;
}

interface DailyAccumulator {
  date: string;
  minTempC: number;
  maxTempC: number;
  maxWindKph: number;
  rainProbability: number | null;
  precipitationMm: number;
  condition: string;
  symbolCode: string;
  weatherCode: number;
  isStorm: boolean;
}

const WEATHER_API_KEY = process.env.WEATHER_API;

const MET_WEATHER_USER_AGENT =
  process.env.MET_WEATHER_USER_AGENT ??
  "weatherApp/1.0 (https://github.com/itsqyp/weatherApp)";

const DEFAULT_CACHE_TTL = 6 * 60 * 60 * 1000;
const MIN_CACHE_TTL = 3 * 60 * 60 * 1000;

const HIGH_RAIN_THRESHOLD_MM = 10;
const STORM_PROBABILITY_THRESHOLD = 50;

const forecastCache = new Map<string, CachedForecast>();
const forecastInFlight = new Map<string, Promise<ForecastResult>>();

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampProbability(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getLocalDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getCondition(symbolCode: string): string {
  const symbol = symbolCode
    .toLowerCase()
    .replace(/_(day|night|polartwilight)$/, "");

  if (symbol.includes("thunder")) return "Thunderstorm";
  if (symbol.includes("heavyrain")) return "Heavy rain";
  if (symbol.includes("lightrain")) return "Light rain";
  if (symbol.includes("rain")) return "Rain";
  if (symbol.includes("sleet")) return "Sleet";
  if (symbol.includes("heavysnow")) return "Heavy snow";
  if (symbol.includes("snow")) return "Snow";
  if (symbol.includes("fog")) return "Fog";
  if (symbol.includes("partlycloudy")) return "Partly cloudy";
  if (symbol.includes("cloudy")) return "Cloudy";
  if (symbol.includes("fair")) return "Mainly clear";
  if (symbol.includes("clearsky")) return "Clear sky";

  return "Conditions unavailable";
}

function getWeatherCode(symbolCode: string): number {
  const symbol = symbolCode.toLowerCase();

  if (symbol.includes("thunder")) return 95;
  if (symbol.includes("heavysnow")) return 75;
  if (symbol.includes("snow")) return 71;
  if (symbol.includes("sleet")) return 66;
  if (symbol.includes("heavyrain")) return 65;
  if (symbol.includes("rain")) return 61;
  if (symbol.includes("fog")) return 45;
  if (symbol.includes("partlycloudy")) return 2;
  if (symbol.includes("cloudy")) return 3;
  if (symbol.includes("fair")) return 1;
  if (symbol.includes("clearsky")) return 0;

  return -1;
}

function getConditionSeverity(symbolCode: string): number {
  const symbol = symbolCode.toLowerCase();

  if (symbol.includes("thunder")) return 10;
  if (symbol.includes("heavyrain")) return 9;
  if (symbol.includes("heavysnow")) return 9;
  if (symbol.includes("sleet")) return 8;
  if (symbol.includes("rain")) return 8;
  if (symbol.includes("snow")) return 7;
  if (symbol.includes("fog")) return 5;
  if (symbol.includes("partlycloudy")) return 2;
  if (symbol.includes("cloudy")) return 3;

  return 1;
}

function getCacheTtl(response: Response): number {
  const expiresHeader = response.headers.get("expires");

  if (expiresHeader) {
    const expiresAt = new Date(expiresHeader).getTime();

    if (Number.isFinite(expiresAt)) {
      return Math.max(MIN_CACHE_TTL, expiresAt - Date.now());
    }
  }

  return DEFAULT_CACHE_TTL;
}

function getPeriod(item: MetTimeseriesItem): SelectedPeriod | undefined {
  if (item.data.next_1_hours) {
    return {
      period: item.data.next_1_hours,
      hours: 1,
    };
  }

  if (item.data.next_6_hours) {
    return {
      period: item.data.next_6_hours,
      hours: 6,
    };
  }

  if (item.data.next_12_hours) {
    return {
      period: item.data.next_12_hours,
      hours: 12,
    };
  }

  return undefined;
}

/**
 * Distributes a period's precipitation across the local calendar
 * dates touched by that period.
 *
 * MET Norway reports precipitation for intervals beginning at
 * each timeseries timestamp, not for an entire calendar day.
 */
function addPrecipitationToLocalDays(
  daily: Map<string, DailyAccumulator>,
  start: Date,
  hours: number,
  amount: number,
  timezone: string,
): void {
  if (!Number.isFinite(amount) || amount <= 0 || hours <= 0) {
    return;
  }

  const amountPerHour = amount / hours;

  for (let hour = 0; hour < hours; hour += 1) {
    const midpoint = new Date(start.getTime() + (hour + 0.5) * 60 * 60 * 1000);

    const date = getLocalDate(midpoint, timezone);
    const existing = daily.get(date);

    if (existing) {
      existing.precipitationMm += amountPerHour;
    } else {
      daily.set(date, {
        date,
        minTempC: Number.POSITIVE_INFINITY,
        maxTempC: Number.NEGATIVE_INFINITY,
        maxWindKph: 0,
        rainProbability: null,
        precipitationMm: amountPerHour,
        condition: "Conditions unavailable",
        symbolCode: "",
        weatherCode: -1,
        isStorm: false,
      });
    }
  }
}

function buildDailyForecast(
  timeseries: MetTimeseriesItem[],
  timezone: string,
): ForecastDay[] {
  const daily = new Map<string, DailyAccumulator>();

  for (const item of timeseries) {
    const timestamp = new Date(item.time);

    if (Number.isNaN(timestamp.getTime())) {
      continue;
    }

    const date = getLocalDate(timestamp, timezone);
    const instant = item.data.instant?.details;
    const selected = getPeriod(item);

    const temperature = instant?.air_temperature;
    const windSpeed = instant?.wind_speed;

    const period = selected?.period;
    const details = period?.details;

    const symbolCode = period?.summary?.symbol_code ?? "";

    const condition = getCondition(symbolCode);
    const weatherCode = getWeatherCode(symbolCode);

    const precipitation = isValidNumber(details?.precipitation_amount)
      ? Math.max(0, details.precipitation_amount)
      : 0;

    const rainProbability = isValidNumber(details?.probability_of_precipitation)
      ? clampProbability(details.probability_of_precipitation)
      : null;

    const thunderProbability = isValidNumber(details?.probability_of_thunder)
      ? clampProbability(details.probability_of_thunder)
      : null;

    const isStorm =
      symbolCode.toLowerCase().includes("thunder") ||
      (thunderProbability !== null &&
        thunderProbability >= STORM_PROBABILITY_THRESHOLD);

    let existing = daily.get(date);

    if (!existing) {
      existing = {
        date,
        minTempC: Number.POSITIVE_INFINITY,
        maxTempC: Number.NEGATIVE_INFINITY,
        maxWindKph: 0,
        rainProbability: null,
        precipitationMm: 0,
        condition: "Conditions unavailable",
        symbolCode: "",
        weatherCode: -1,
        isStorm: false,
      };

      daily.set(date, existing);
    }

    // Use actual instant temperatures when available.
    if (isValidNumber(temperature)) {
      existing.minTempC = Math.min(existing.minTempC, temperature);

      existing.maxTempC = Math.max(existing.maxTempC, temperature);
    }

    // Use period temperature extremes when provided.
    if (isValidNumber(details?.air_temperature_min)) {
      existing.minTempC = Math.min(
        existing.minTempC,
        details.air_temperature_min,
      );
    }

    if (isValidNumber(details?.air_temperature_max)) {
      existing.maxTempC = Math.max(
        existing.maxTempC,
        details.air_temperature_max,
      );
    }

    if (isValidNumber(windSpeed)) {
      existing.maxWindKph = Math.max(existing.maxWindKph, windSpeed * 3.6);
    }

    if (rainProbability !== null) {
      existing.rainProbability = Math.max(
        existing.rainProbability ?? 0,
        rainProbability,
      );
    }

    if (
      symbolCode &&
      getConditionSeverity(symbolCode) >
        getConditionSeverity(existing.symbolCode)
    ) {
      existing.condition = condition;
      existing.symbolCode = symbolCode;
      existing.weatherCode = weatherCode;
    }

    if (isStorm) {
      existing.isStorm = true;
    }

    // Period precipitation is an interval amount.
    // Split it across local dates if it crosses midnight.
    if (selected && precipitation > 0) {
      addPrecipitationToLocalDays(
        daily,
        timestamp,
        selected.hours,
        precipitation,
        timezone,
      );
    }
  }

  const today = getLocalDate(new Date(), timezone);

  return [...daily.values()]
    .filter((day) => day.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7)
    .map((day) => {
      const precipitationMm = Math.round(day.precipitationMm * 10) / 10;

      return {
        date: day.date,
        condition: day.condition,
        weatherCode: day.weatherCode,

        maxTempC: Number.isFinite(day.maxTempC)
          ? Math.round(day.maxTempC * 10) / 10
          : 0,

        minTempC: Number.isFinite(day.minTempC)
          ? Math.round(day.minTempC * 10) / 10
          : 0,

        rainProbability: day.rainProbability,

        precipitationMm,

        maxWindKph: Math.round(day.maxWindKph * 10) / 10,

        isStorm: day.isStorm,

        isHighRain: precipitationMm >= HIGH_RAIN_THRESHOLD_MM,
      };
    });
}

/**
 * WeatherAPI's search endpoint does not reliably provide a timezone.
 * Use its timezone endpoint with the resolved coordinates.
 */
async function getLocationTimezone(
  location: LocationSearchResult,
  apiKey: string,
): Promise<string> {
  if (location.tz_id) {
    return location.tz_id;
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `${location.lat},${location.lon}`,
  });

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/timezone.json?${params}`,
    );

    if (!response.ok) {
      return "UTC";
    }

    const data = (await response.json()) as {
      location?: {
        tz_id?: string;
      };
    };

    const timezone = data.location?.tz_id;

    if (
      timezone &&
      Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
      })
    ) {
      return timezone;
    }
  } catch {
    // Keep the forecast usable if timezone lookup fails.
  }

  return "UTC";
}

async function fetchForecast(
  city: string,
  country: string,
  apiKey: string,
): Promise<{
  result: ForecastResult;
  cacheTtl: number;
}> {
  // 1. Resolve the requested city.
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

  if (!location) {
    const error = new Error("The requested location could not be found.");

    error.name = "LocationNotFoundError";
    throw error;
  }

  // 2. Resolve the correct local timezone.
  const timezone = await getLocationTimezone(location, apiKey);

  // 3. Request the MET Norway global forecast.
  const forecastParams = new URLSearchParams({
    lat: location.lat.toFixed(4),
    lon: location.lon.toFixed(4),
  });

  const forecastResponse = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?${forecastParams}`,
    {
      headers: {
        "User-Agent": MET_WEATHER_USER_AGENT,
        Accept: "application/json",
      },
    },
  );

  if (!forecastResponse.ok) {
    const errorBody = await forecastResponse.text();

    throw new Error(
      `MET Norway forecast request failed with status ${forecastResponse.status}: ${errorBody}`,
    );
  }

  const cacheTtl = getCacheTtl(forecastResponse);

  const forecast = (await forecastResponse.json()) as MetForecastResponse;

  const timeseries = forecast.properties?.timeseries;

  if (!timeseries?.length) {
    throw new Error("MET Norway forecast data was not available.");
  }

  // 4. Build local daily forecast data.
  const days = buildDailyForecast(timeseries, timezone);

  if (!days.length) {
    throw new Error("No daily forecast data was available.");
  }

  // 5. Build the summary from the actual daily values.
  const highestRainProbability = days.reduce<number | null>((highest, day) => {
    if (day.rainProbability === null) {
      return highest;
    }

    return Math.max(highest ?? 0, day.rainProbability);
  }, null);

  const highestPrecipitationMm = Math.max(
    0,
    ...days.map((day) => day.precipitationMm),
  );

  const result: ForecastResult = {
    city: location.name,
    country: location.country,
    days,

    outlook: {
      highRainDays: days.filter((day) => day.isHighRain).map((day) => day.date),

      stormDays: days.filter((day) => day.isStorm).map((day) => day.date),

      highestRainProbability,

      highestPrecipitationMm: Math.round(highestPrecipitationMm * 10) / 10,
    },
  };

  return {
    result,
    cacheTtl,
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

    // 1. Return cached forecast.
    const cached = forecastCache.get(cacheKey);

    if (cached) {
      if (Date.now() < cached.expiresAt) {
        request.log.info({ city, country }, "Serving forecast from cache");

        return cached.data;
      }

      forecastCache.delete(cacheKey);
    }

    // 2. Reuse an in-flight request.
    const existingRequest = forecastInFlight.get(cacheKey);

    if (existingRequest) {
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

    // 3. Start a new forecast request.
    const pendingRequest = (async () => {
      const { result, cacheTtl } = await fetchForecast(
        city,
        country,
        WEATHER_API_KEY,
      );

      forecastCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + cacheTtl,
      });

      return result;
    })();

    forecastInFlight.set(cacheKey, pendingRequest);

    try {
      const result = await pendingRequest;

      request.log.info(
        { city, country },
        "Fetched and cached MET Norway seven-day forecast",
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
      if (forecastInFlight.get(cacheKey) === pendingRequest) {
        forecastInFlight.delete(cacheKey);
      }
    }
  });
};

export default weatherForecastRoutes;
