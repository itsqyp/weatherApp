import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
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

interface CountryCities {
  country: string;
  cities: string[];
}

interface CountriesNowResponse {
  error: boolean;
  data: CountryCities[];
}

interface CityCandidate {
  city: string;
  country: string;
}

// ---------------------------------------------
// City discovery and caching
// ---------------------------------------------

let cityPoolPromise: Promise<CityCandidate[]> | null = null;

async function getCityPool(): Promise<CityCandidate[]> {
  if (!cityPoolPromise) {
    cityPoolPromise = (async () => {
      const response = await fetch(
        "https://countriesnow.space/api/v0.1/countries",
      );

      if (!response.ok) {
        throw new Error("Unable to discover cities.");
      }

      const result = (await response.json()) as CountriesNowResponse;

      if (result.error || !Array.isArray(result.data)) {
        throw new Error("Invalid city data received.");
      }

      return result.data.flatMap(({ country, cities }) =>
        cities
          .filter((city) => typeof city === "string" && city.trim().length > 0)
          .map((city) => ({
            city: city.trim(),
            country: country.trim(),
          })),
      );
    })().catch((error: unknown) => {
      // Allow the next request to retry city discovery.
      cityPoolPromise = null;
      throw error;
    });
  }

  return cityPoolPromise;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// ---------------------------------------------
// City search route
// GET /api/cities/search?q=London
// Returns up to 9 ranked unique locations.
// ---------------------------------------------

app.get<{ Querystring: CitySearchQuery }>(
  "/api/cities/search",
  async (request, reply) => {
    const rawQuery = request.query.q?.trim();

    if (!rawQuery || rawQuery.length < 2) {
      return reply.status(400).send({
        message: "Enter at least two characters to search.",
      });
    }

    const query = normalize(rawQuery);

    try {
      const cityPool = await getCityPool();

      // Deduplicate identical city/country pairs only.
      // Same-named cities in different countries remain separate.
      const uniqueCities = Array.from(
        new Map(
          cityPool.map((item) => [
            `${normalize(item.city)}|${normalize(item.country)}`,
            item,
          ]),
        ).values(),
      );

      const ranked = uniqueCities
        .map((item) => {
          const city = normalize(item.city);
          const country = normalize(item.country);

          let score = 0;

          if (city === query) {
            // Exact city name.
            score = 100;
          } else if (city.startsWith(query)) {
            // City name begins with the query.
            score = 80;
          } else if (city.split(/\s+/).some((word) => word.startsWith(query))) {
            // A word in the city name begins with the query.
            score = 65;
          } else if (city.includes(query)) {
            // Query appears inside the city name.
            score = 50;
          } else if (country === query) {
            score = 40;
          } else if (country.startsWith(query)) {
            score = 30;
          } else if (country.includes(query)) {
            score = 20;
          }

          return {
            city: item.city,
            country: item.country,
            score,
          };
        })
        .filter((item) => item.score > 0)
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.city.localeCompare(b.city) ||
            a.country.localeCompare(b.country),
        );

      // The frontend receives at most 9 locations.
      return ranked.slice(0, 9).map(({ city, country }) => ({
        city,
        country,
      }));
    } catch (error) {
      request.log.error({ err: error }, "City search failed.");

      return reply.status(502).send({
        message: "Unable to search cities right now.",
      });
    }
  },
);

// ---------------------------------------------
// Shuffle helper for random weather
// ---------------------------------------------

function shuffleCities(cities: CityCandidate[]): CityCandidate[] {
  const shuffled = [...cities];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ---------------------------------------------
// Weather service
// ---------------------------------------------

async function fetchWeatherData(
  city: string,
  country?: string,
): Promise<WeatherCardData> {
  if (!WEATHER_API_KEY) {
    throw new Error("Weather service is not configured.");
  }

  const params = new URLSearchParams({
    key: WEATHER_API_KEY,
    q: country ? `${city}, ${country}` : city,
    aqi: "no",
  });

  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `Weather unavailable for ${city}${country ? `, ${country}` : ""}.`,
    );
  }

  const data = (await response.json()) as WeatherApiResponse;

  return {
    country: data.location.country,
    city: data.location.name,
    localtime: data.location.localtime,
    condition: data.current.condition.text,
    temperatureC: data.current.temp_c,
    temperatureF: data.current.temp_f,
    feelsLikeC: data.current.feelslike_c,
    feelsLikeF: data.current.feelslike_f,
    humidity: data.current.humidity,
    windKph: data.current.wind_kph,
    iconUrl: `https:${data.current.condition.icon}`,
    lastUpdated: data.current.last_updated,
  };
}

// ---------------------------------------------
// Health route
// ---------------------------------------------

app.get("/api/health", async () => ({
  status: "ok",
  message: "Weather App API is running",
}));

// ---------------------------------------------
// Authentication route
// ---------------------------------------------

app.post("/api/auth/register", async (request, reply) => {
  const body = request.body as {
    username?: string;
    password?: string;
    confirmPassword?: string;
  };

  const { username, password, confirmPassword } = body;

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
    user: { username },
  });
});

// ---------------------------------------------
// Weather route for a specific city
// GET /api/weather?city=London
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
      return await fetchWeatherData(city);
    } catch (error) {
      request.log.error({ err: error }, "Weather request failed.");

      return reply.status(502).send({
        message: "Unable to retrieve weather right now.",
      });
    }
  },
);

// ---------------------------------------------
// Random weather route: four unique cities
// GET /api/weather/random
// ---------------------------------------------

app.get("/api/weather/random", async (request, reply) => {
  if (!WEATHER_API_KEY) {
    return reply.status(500).send({
      message: "Weather service is not configured.",
    });
  }

  try {
    const cityPool = await getCityPool();

    if (cityPool.length < 4) {
      return reply.status(502).send({
        message: "Not enough cities are available.",
      });
    }

    const candidates = shuffleCities(cityPool).slice(0, 40);

    const results: WeatherCardData[] = [];
    const usedCities = new Set<string>();

    for (let i = 0; i < candidates.length && results.length < 4; i += 4) {
      const batch = candidates.slice(i, i + 4);

      const batchResults = await Promise.all(
        batch.map(async ({ city, country }) => {
          try {
            return await fetchWeatherData(city, country);
          } catch {
            return null;
          }
        }),
      );

      for (const weather of batchResults) {
        if (!weather) continue;

        const key = `${normalize(weather.city)}|${normalize(weather.country)}`;

        if (usedCities.has(key)) continue;

        usedCities.add(key);
        results.push(weather);

        if (results.length === 4) break;
      }
    }

    if (results.length !== 4) {
      request.log.warn(
        { found: results.length },
        "Could not find four valid random cities.",
      );

      return reply.status(502).send({
        message:
          "Could not find four cities with available weather. Please try again.",
      });
    }

    return results;
  } catch (error) {
    request.log.error({ err: error }, "Failed to load random city weather.");

    return reply.status(502).send({
      message: "Unable to discover random cities right now.",
    });
  }
});

// ---------------------------------------------
// Start server
// ---------------------------------------------

try {
  // Ensure all routes are registered and print them for debugging.
  await app.ready();
  app.log.info("\nRegistered routes:\n" + app.printRoutes());

  await app.listen({
    port: 3000,
    host: "localhost",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
