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
      // Retry city discovery on the next request if it fails.
      cityPoolPromise = null;
      throw error;
    });
  }

  return cityPoolPromise;
}

function shuffleCities(cities: CityCandidate[]): CityCandidate[] {
  const shuffled = [...cities];

  // Fisher-Yates shuffle
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

app.get("/api/health", async () => {
  return {
    status: "ok",
    message: "Weather App API is running",
  };
});

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

    // Randomize candidates and try up to 40 locations.
    const candidates = shuffleCities(cityPool).slice(0, 40);

    const results: WeatherCardData[] = [];
    const usedCities = new Set<string>();

    // Fetch four cities concurrently in each batch.
    for (let i = 0; i < candidates.length && results.length < 4; i += 4) {
      const batch = candidates.slice(i, i + 4);

      const batchResults = await Promise.all(
        batch.map(async ({ city, country }) => {
          try {
            return await fetchWeatherData(city, country);
          } catch {
            // Skip cities that cannot return weather data.
            return null;
          }
        }),
      );

      for (const weather of batchResults) {
        if (!weather) continue;

        const key = `${weather.city.toLowerCase()},${weather.country.toLowerCase()}`;

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
  await app.listen({
    port: 3000,
    host: "localhost",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
