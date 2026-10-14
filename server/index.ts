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

app.get("/api/health", async () => {
  return {
    status: "ok",
    message: "Weather App API is running",
  };
});

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
      request.log.error("WEATHER_API is missing from the environment.");

      return reply.status(500).send({
        message: "Weather service is not configured.",
      });
    }

    try {
      const params = new URLSearchParams({
        key: WEATHER_API_KEY,
        q: city,
        aqi: "no",
      });

      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?${params.toString()}`,
      );

      if (!response.ok) {
        if (response.status === 400) {
          return reply.status(400).send({
            message: "City not found. Please check the city name.",
          });
        }

        request.log.error(
          { upstreamStatus: response.status },
          "Weather provider request failed.",
        );

        return reply.status(502).send({
          message: "Unable to retrieve weather right now.",
        });
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
    } catch (error) {
      request.log.error({ err: error }, "Failed to fetch weather data.");

      return reply.status(502).send({
        message: "Unable to connect to the weather service.",
      });
    }
  },
);

try {
  await app.listen({
    port: 3000,
    host: "localhost",
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
