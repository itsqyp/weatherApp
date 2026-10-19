import type { FastifyPluginAsync } from "fastify";

interface WeatherHistoryQuery {
  city?: string;
  country?: string;
}

interface WeatherApiLocationResponse {
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
    localtime: string;
  };
}

interface OpenMeteoDailyResponse {
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_min: Array<number | null>;
    temperature_2m_mean: Array<number | null>;
    temperature_2m_max: Array<number | null>;
    relative_humidity_2m_mean: Array<number | null>;
    wind_speed_10m_mean: Array<number | null>;
    precipitation_sum: Array<number | null>;
  };
}

interface WeatherHistoryDay {
  date: string;
  temperatureMinC: number | null;
  temperatureMeanC: number | null;
  temperatureMaxC: number | null;
  humidityMean: number | null;
  windSpeedMeanKph: number | null;
  precipitationMm: number | null;
}

const WEATHER_API_KEY = process.env.WEATHER_API;

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));

  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, "0"),
    String(shifted.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

const weatherHistoryRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: WeatherHistoryQuery }>(
    "/api/weather/history",
    async (request, reply) => {
      const city = request.query.city?.trim();
      const country = request.query.country?.trim();

      if (!city || !country) {
        return reply.status(400).send({
          message: "Please provide both city and country.",
        });
      }

      if (!WEATHER_API_KEY) {
        return reply.status(500).send({
          message: "Weather service is not configured.",
        });
      }

      try {
        // Resolve the selected city to coordinates and local date.
        const locationParams = new URLSearchParams({
          key: WEATHER_API_KEY,
          q: `${city}, ${country}`,
        });

        const locationResponse = await fetch(
          `https://api.weatherapi.com/v1/current.json?${locationParams}`,
        );

        if (!locationResponse.ok) {
          throw new Error("Unable to find the selected location.");
        }

        const locationData =
          (await locationResponse.json()) as WeatherApiLocationResponse;

        const location = locationData.location;
        const localDate = location.localtime.slice(0, 10);

        // Request the previous seven complete local calendar days.
        const startDate = shiftDate(localDate, -7);
        const endDate = shiftDate(localDate, -1);

        const historyParams = new URLSearchParams({
          latitude: String(location.lat),
          longitude: String(location.lon),
          start_date: startDate,
          end_date: endDate,
          daily: [
            "temperature_2m_min",
            "temperature_2m_mean",
            "temperature_2m_max",
            "relative_humidity_2m_mean",
            "wind_speed_10m_mean",
            "precipitation_sum",
          ].join(","),
          temperature_unit: "celsius",
          wind_speed_unit: "kmh",
          precipitation_unit: "mm",
          timezone: "auto",
        });

        const historyResponse = await fetch(
          `https://archive-api.open-meteo.com/v1/archive?${historyParams}`,
        );

        if (!historyResponse.ok) {
          throw new Error("Historical weather data is unavailable.");
        }

        const history =
          (await historyResponse.json()) as OpenMeteoDailyResponse;

        const daily = history.daily;

        const days: WeatherHistoryDay[] = daily.time.map((date, index) => ({
          date,
          temperatureMinC: daily.temperature_2m_min[index] ?? null,
          temperatureMeanC: daily.temperature_2m_mean[index] ?? null,
          temperatureMaxC: daily.temperature_2m_max[index] ?? null,
          humidityMean: daily.relative_humidity_2m_mean[index] ?? null,
          windSpeedMeanKph: daily.wind_speed_10m_mean[index] ?? null,
          precipitationMm: daily.precipitation_sum[index] ?? null,
        }));

        return {
          city: location.name,
          country: location.country,
          timezone: history.timezone,
          days,
          source: "Open-Meteo",
        };
      } catch (error) {
        request.log.error(
          { err: error, city, country },
          "Historical weather request failed.",
        );

        return reply.status(502).send({
          message: "Unable to retrieve historical weather right now.",
        });
      }
    },
  );
};

export default weatherHistoryRoutes;
