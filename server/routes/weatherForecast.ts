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

    const apiKey = process.env.WEATHER_API;

    if (!apiKey) {
      return reply.code(500).send({
        message: "The weather API key is not configured.",
      });
    }

    try {
      // Resolve the city to coordinates using WeatherAPI.com.
      const locationParams = new URLSearchParams({
        key: apiKey,
        q: `${city}, ${country}`,
      });

      const locationResponse = await fetch(
        `https://api.weatherapi.com/v1/search.json?${locationParams}`,
      );

      // if (!locationResponse.ok) {
      //   request.log.error(
      //     { status: locationResponse.status },
      //     "WeatherAPI location lookup failed",
      //   );

      //   return reply.code(502).send({
      //     message: "Unable to resolve this location.",
      //   });
      // }

      if (!locationResponse.ok) {
        const errorBody = await locationResponse.text();

        request.log.error(
          {
            status: locationResponse.status,
            body: errorBody,
          },
          "WeatherAPI location lookup failed",
        );

        return reply.code(502).send({
          message: "Unable to resolve this location.",
        });
      }
      const locations =
        (await locationResponse.json()) as LocationSearchResponse;

      const location =
        locations.find(
          (item) =>
            item.name.toLowerCase() === city.toLowerCase() &&
            item.country.toLowerCase() === country.toLowerCase(),
        ) ?? locations[0];

      if (!location) {
        return reply.code(404).send({
          message: "The requested location could not be found.",
        });
      }

      // Request seven days of daily forecast data from Open-Meteo.
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

      // if (!forecastResponse.ok) {
      //   request.log.error(
      //     { status: forecastResponse.status },
      //     "Open-Meteo forecast request failed",
      //   );

      //   return reply.code(502).send({
      //     message: "Unable to retrieve the seven-day forecast.",
      //   });
      // }

      if (!forecastResponse.ok) {
        const errorBody = await forecastResponse.text();

        request.log.error(
          {
            status: forecastResponse.status,
            body: errorBody,
          },
          "Open-Meteo forecast request failed",
        );

        return reply.code(502).send({
          message: "Unable to retrieve the seven-day forecast.",
        });
      }

      const forecast =
        (await forecastResponse.json()) as OpenMeteoDailyResponse;

      const daily = forecast.daily;

      if (!daily || !daily.time?.length) {
        return reply.code(502).send({
          message: "Forecast data was not available for this location.",
        });
      }

      const days = daily.time.map((date, index) => {
        const weatherCode = daily.weather_code[index];
        const rainProbability =
          daily.precipitation_probability_max[index] ?? null;

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

      const highRainDays = days.filter((day) => day.isHighRain);
      const stormDays = days.filter((day) => day.isStorm);

      return {
        city: location.name,
        country: location.country,
        days,
        outlook: {
          highRainDays: highRainDays.map((day) => day.date),
          stormDays: stormDays.map((day) => day.date),
          highestRainProbability: days.reduce<number | null>(
            (highest, day) =>
              day.rainProbability === null
                ? highest
                : Math.max(highest ?? 0, day.rainProbability),
            null,
          ),
        },
      };
    } catch (error) {
      request.log.error(
        { err: error },
        "Failed to retrieve seven-day forecast",
      );

      return reply.status(502).send({
        message: "Unable to retrieve the seven-day forecast.",
      });
    }
  });
};

export default weatherForecastRoutes;
