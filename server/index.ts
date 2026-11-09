import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";

import weatherHistoryRoutes from "./routes/weatherHistory";
import weatherForecastRoutes from "./routes/weatherForecast";
import cities from "../src/data/cities.json";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: [
    "http://localhost:5173",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ],
});

const WEATHER_API_KEY = process.env.WEATHER_API;

// ---------------------------------------------
// Types
// ---------------------------------------------

interface WeatherQuery {
  city?: string;
}

interface CitySearchQuery {
  q?: string;
}

interface CityCandidate {
  city: string;
  country: string;
}

interface CountriesNowCountry {
  country: string;
  cities: string[];
}

interface CountriesNowResponse {
  error: boolean;
  msg: string;
  data: CountriesNowCountry[];
}

interface WeatherApiResponse {
  location: {
    name: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    feelslike_c: number;
    feelslike_f: number;
    humidity: number;
    wind_kph: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    last_updated: string;
  };
}

interface WeatherCardData {
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

interface CachedWeather {
  data: WeatherCardData;
  cachedAt: number;
}

interface CachedRandomWeather {
  data: WeatherCardData[];
  cachedAt: number;
}

// ---------------------------------------------
// City data
// ---------------------------------------------

// cities.json is used only for random Home weather cards.
const cityList: string[] = cities;

// Normalize strings for searching and cache keys.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// Fisher-Yates shuffle.
function shuffleCities(items: string[]): string[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ---------------------------------------------
// Dynamic global city database
// ---------------------------------------------

// The city database is downloaded once and kept in memory.
let cityPoolPromise: Promise<CityCandidate[]> | null = null;

async function getCityPool(): Promise<CityCandidate[]> {
  if (!cityPoolPromise) {
    cityPoolPromise = (async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries",
      );

      if (!response.ok) {
        throw new Error("Unable to retrieve the global city database.");
      }

      const result = (await response.json()) as CountriesNowResponse;

      if (result.error || !Array.isArray(result.data)) {
        throw new Error("Invalid global city database response.");
      }

      return result.data.flatMap((countryData) =>
        countryData.cities.map((city) => ({
          city,
          country: countryData.country,
        })),
      );
    })().catch((error) => {
      // Allow another request to retry if downloading fails.
      cityPoolPromise = null;
      throw error;
    });
  }

  return cityPoolPromise;
}

// Rank city and country search matches.
function rankCity(candidate: CityCandidate, query: string): number {
  const city = normalize(candidate.city);
  const country = normalize(candidate.country);

  // Exact city match.
  if (city === query) return 100;

  // City starts with query.
  if (city.startsWith(query)) return 80;

  // A word inside the city name starts with query.
  if (city.split(" ").some((word) => word.startsWith(query))) {
    return 65;
  }

  // Query appears anywhere in city name.
  if (city.includes(query)) return 50;

  // Country matches.
  if (country === query) return 40;
  if (country.startsWith(query)) return 30;
  if (country.includes(query)) return 20;

  return 0;
}

// ---------------------------------------------
// Cache configuration
// ---------------------------------------------

const WEATHER_CACHE_TTL = 5 * 60 * 1000;
const RANDOM_WEATHER_CACHE_TTL = 10 * 60 * 1000;

const weatherCache = new Map<string, CachedWeather>();

// Prevent duplicate requests for the same city.
const weatherInFlight = new Map<string, Promise<WeatherCardData>>();

let randomWeatherCache: CachedRandomWeather | null = null;

let randomWeatherInFlight: Promise<WeatherCardData[]> | null = null;

// ---------------------------------------------
// Weather service
// ---------------------------------------------

async function fetchWeatherDataUncached(
  city: string,
): Promise<WeatherCardData> {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather service is not configured.");
  }

  const params = new URLSearchParams({
    key: WEATHER_API_KEY,
    q: city,
    aqi: "no",
  });

  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(`Weather unavailable for ${city}.`);
  }

  const data = (await response.json()) as WeatherApiResponse;

  return {
    city: data.location.name,
    country: data.location.country,
    condition: data.current.condition.text,
    temperatureC: data.current.temp_c,
    temperatureF: data.current.temp_f,
    feelsLikeC: data.current.feelslike_c,
    feelsLikeF: data.current.feelslike_f,
    humidity: data.current.humidity,
    windKph: data.current.wind_kph,
    iconUrl: `https:${data.current.condition.icon}`,
    localtime: data.location.localtime,
    lastUpdated: data.current.last_updated,
  };
}

function getWeatherCacheKey(city: string): string {
  return normalize(city);
}

async function fetchWeatherData(city: string): Promise<WeatherCardData> {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather service is not configured.");
  }

  const cacheKey = getWeatherCacheKey(city);

  // Return cached weather if it has not expired.
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < WEATHER_CACHE_TTL) {
    return cached.data;
  }

  // Remove expired cache entries.
  if (cached) {
    weatherCache.delete(cacheKey);
  }

  // Reuse an existing request for this city.
  const pending = weatherInFlight.get(cacheKey);

  if (pending) {
    return pending;
  }

  const request = fetchWeatherDataUncached(city)
    .then((data) => {
      weatherCache.set(cacheKey, {
        data,
        cachedAt: Date.now(),
      });

      return data;
    })
    .finally(() => {
      weatherInFlight.delete(cacheKey);
    });

  weatherInFlight.set(cacheKey, request);

  return request;
}

// ---------------------------------------------
// Health route
// GET /api/health
// ---------------------------------------------

app.get("/api/health", async () => ({
  status: "ok",
  message: "Weather App API is running",
}));

// ---------------------------------------------
// Authentication route
// POST /api/auth/register
// ---------------------------------------------

app.post("/api/auth/register", async (request, reply) => {
  const body = request.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return reply.status(400).send({
      message: "Invalid request body.",
    });
  }

  const { username, password, confirmPassword } = body as {
    username?: string;
    password?: string;
    confirmPassword?: string;
  };

  if (!username || !password || !confirmPassword) {
    return reply.status(400).send({
      message: "All fields are required.",
    });
  }

  if (password !== confirmPassword) {
    return reply.status(400).send({
      message: "Passwords do not match.",
    });
  }

  return reply.status(201).send({
    message: "Account data received successfully.",
    user: {
      username,
    },
  });
});

// ---------------------------------------------
// Dynamic city search
// GET /api/cities/search?q=London
// ---------------------------------------------

app.get<{ Querystring: CitySearchQuery }>(
  "/api/cities/search",
  async (request, reply) => {
    const query = normalize(request.query.q ?? "");

    if (query.length < 2) {
      return reply.status(400).send({
        message: "Please enter at least two characters.",
      });
    }

    try {
      const cityPool = await getCityPool();

      const results = cityPool
        .map((candidate) => ({
          ...candidate,
          score: rankCity(candidate, query),
        }))
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => {
          // Higher relevance first.
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          // Alphabetical city order for equal scores.
          const cityComparison = a.city.localeCompare(b.city);

          if (cityComparison !== 0) {
            return cityComparison;
          }

          return a.country.localeCompare(b.country);
        })
        .slice(0, 9)
        .map(({ city, country }) => ({
          city,
          country,
        }));

      return results;
    } catch (error) {
      request.log.error({ err: error }, "City search failed.");

      return reply.status(502).send({
        message: "Unable to search the city database right now.",
      });
    }
  },
);

// ---------------------------------------------
// Weather route for a specific city
// GET /api/weather?city=London
// GET /api/weather?city=London,%20United%20Kingdom
// ---------------------------------------------

app.get<{ Querystring: WeatherQuery }>(
  "/api/weather",
  async (request, reply) => {
    const city = request.query.city?.trim();

    if (!city) {
      return reply.status(400).send({
        message: "Please provide a city name.",
      });
    }

    if (!WEATHER_API_KEY) {
      return reply.status(500).send({
        message: "Weather service is not configured.",
      });
    }

    try {
      const weather = await fetchWeatherData(city);

      return weather;
    } catch (error) {
      request.log.error({ err: error, city }, "Weather request failed.");

      return reply.status(502).send({
        message: `Unable to retrieve weather for ${city}.`,
      });
    }
  },
);

// ---------------------------------------------
// Random weather route
// GET /api/weather/random
//
// Returns four unique random cities.
// Results are cached for 10 minutes.
// ---------------------------------------------

app.get("/api/weather/random", async (request, reply) => {
  if (!WEATHER_API_KEY) {
    return reply.status(500).send({
      message: "Weather service is not configured.",
    });
  }

  // Return cached random weather when available.
  if (
    randomWeatherCache &&
    Date.now() - randomWeatherCache.cachedAt < RANDOM_WEATHER_CACHE_TTL
  ) {
    request.log.info("Serving random weather from cache");

    return randomWeatherCache.data;
  }

  // Clear expired random weather cache.
  randomWeatherCache = null;

  // Reuse an existing random-weather operation.
  if (randomWeatherInFlight) {
    try {
      return await randomWeatherInFlight;
    } catch (error) {
      request.log.error(
        { err: error },
        "Existing random weather request failed.",
      );

      return reply.status(502).send({
        message: "Unable to retrieve random city weather.",
      });
    }
  }

  const operation = (async (): Promise<WeatherCardData[]> => {
    const shuffledCities = shuffleCities(cityList);

    const results: WeatherCardData[] = [];
    const usedCities = new Set<string>();

    // Try a maximum of 12 cities.
    const candidates = shuffledCities.slice(0, 12);

    // Process cities in batches of four.
    for (let i = 0; i < candidates.length && results.length < 4; i += 4) {
      const batch = candidates.slice(i, i + 4);

      const batchResults = await Promise.all(
        batch.map(async (city) => {
          try {
            return await fetchWeatherData(city);
          } catch (error) {
            request.log.debug(
              { city, err: error },
              "Skipping unavailable random city.",
            );

            return null;
          }
        }),
      );

      for (const weather of batchResults) {
        if (!weather) {
          continue;
        }

        const uniqueKey = `${normalize(weather.city)}|${normalize(
          weather.country,
        )}`;

        if (usedCities.has(uniqueKey)) {
          continue;
        }

        usedCities.add(uniqueKey);
        results.push(weather);

        if (results.length === 4) {
          break;
        }
      }
    }

    if (results.length !== 4) {
      throw new Error(
        `Only ${results.length} valid cities were found. Four are required.`,
      );
    }

    // Cache successful random results.
    randomWeatherCache = {
      data: results,
      cachedAt: Date.now(),
    };

    request.log.info(
      {
        cityCount: results.length,
        cities: results.map((item) => item.city),
      },
      "Cached random weather results.",
    );

    return results;
  })();

  randomWeatherInFlight = operation;

  try {
    return await operation;
  } catch (error) {
    request.log.error({ err: error }, "Random weather request failed.");

    return reply.status(502).send({
      message: "Unable to retrieve four random cities. Please try again.",
    });
  } finally {
    if (randomWeatherInFlight === operation) {
      randomWeatherInFlight = null;
    }
  }
});

// ---------------------------------------------
// Register additional weather routes
// ---------------------------------------------

await app.register(weatherHistoryRoutes);
await app.register(weatherForecastRoutes);

// ---------------------------------------------
// Start server
// ---------------------------------------------

try {
  await app.ready();

  app.log.info("\nRegistered routes:\n" + app.printRoutes());

  const port = Number(process.env.PORT) || 3000;

  await app.listen({
    port,
    host: "0.0.0.0",
  });
} catch (error) {
  app.log.error(error);

  process.exit(1);
}
