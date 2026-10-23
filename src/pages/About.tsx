import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  ChevronDown,
  CloudSun,
  History,
  MapPin,
  Server,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const articles = [
  {
    id: "architecture",
    title: "How WeatherApp works",
    subtitle: "From your search to the weather card",
    icon: CloudSun,
    content: (
      <>
        <p>
          WeatherApp uses a React and TypeScript frontend with a Fastify
          backend. When you search for a location, the frontend sends a request
          to the backend, which retrieves the relevant weather information and
          returns structured data.
        </p>
        <p>
          The frontend displays the response in weather cards. TanStack Query
          helps manage requests, cache results, and refresh data without
          requiring every request to be handled manually.
        </p>
        <p>
          Keeping external API requests on the backend also means the WeatherAPI
          key can remain in the server environment instead of being embedded in
          frontend code.
        </p>
      </>
    ),
  },
  {
    id: "current-weather",
    title: "Current weather and city discovery",
    subtitle: "WeatherAPI.com and CountriesNow",
    icon: MapPin,
    content: (
      <>
        <p>
          WeatherApp uses CountriesNow to discover cities. Its country data is
          fetched by the backend and cached in memory, allowing city searches to
          match and rank locations without requesting the full city list every
          time.
        </p>
        <p>
          When current weather is requested, the backend calls WeatherAPI.com's
          current weather endpoint. It converts the response into a consistent
          data structure containing the city, country, local time, condition,
          temperature, feels-like temperature, humidity, wind speed, and
          condition icon.
        </p>
        <p>
          The random weather endpoint selects candidate cities from the city
          pool and returns valid, unique weather results for the homepage.
        </p>
      </>
    ),
  },
  {
    id: "forecast",
    title: "Seven-day weather forecast",
    subtitle: "Open-Meteo forecast API",
    icon: CalendarDays,
    content: (
      <>
        <p>
          The forecast endpoint first uses WeatherAPI.com to resolve the
          requested city and country into geographic coordinates. It then sends
          those coordinates to Open-Meteo's forecast API.
        </p>
        <p>
          The request asks for seven days of daily weather data, including
          weather codes, minimum and maximum temperatures, maximum precipitation
          probability, precipitation totals, and maximum wind speed.
          Temperatures are returned in Celsius, wind speed in km/h, and
          precipitation in millimetres.
        </p>
        <p>
          WeatherApp translates weather codes into readable conditions. A day is
          flagged for high rain when the precipitation probability reaches 60%
          or more. Weather codes 95, 96, and 99 identify thunderstorms,
          including those involving hail.
        </p>
        <p>
          The response also includes an outlook listing high-rain days, storm
          days, and the highest available precipitation probability.
        </p>
      </>
    ),
  },
  {
    id: "history",
    title: "Historical weather",
    subtitle: "Open-Meteo archive API",
    icon: History,
    content: (
      <>
        <p>
          Historical weather follows a similar location-resolution process.
          WeatherAPI.com supplies the selected location's coordinates and local
          date. WeatherApp then requests the previous seven complete local
          calendar days from Open-Meteo's archive API.
        </p>
        <p>
          For each day, the backend retrieves minimum, mean, and maximum
          temperatures, mean relative humidity, mean wind speed, and total
          precipitation. Missing measurements are represented as null rather
          than being treated as real values.
        </p>
        <p>
          The response includes the resolved city and country, the timezone
          returned by Open-Meteo, the daily results, and the data source. This
          provides a consistent structure for displaying recent weather history.
        </p>
      </>
    ),
  },
  {
    id: "backend",
    title: "Why use a backend?",
    subtitle: "Requests, validation, and error handling",
    icon: Server,
    content: (
      <>
        <p>
          The Fastify server acts as the bridge between the frontend and
          external weather services. Instead of having the browser call every
          provider directly, the server handles requests and returns data shaped
          for WeatherApp's components.
        </p>
        <p>
          The endpoints validate required parameters, such as the city and
          country for forecast and history requests. They also return
          appropriate HTTP error responses when inputs are missing, a location
          cannot be found, a provider fails, or the weather API key is not
          configured.
        </p>
        <p>
          The API key is read from the server's WEATHER_API environment
          variable. Keep the actual key in your server-side environment and
          never expose it in frontend code or commit it to your repository.
        </p>
      </>
    ),
  },
];

export default function About() {
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/65">
            Behind the forecast
          </p>

          <h1 className="font-anton text-4xl uppercase tracking-wide sm:text-5xl">
            About WeatherApp
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-foreground/75 sm:text-base">
            Discover how WeatherApp finds locations, retrieves current
            conditions, builds seven-day forecasts, and explores recent weather
            history through its APIs.
          </p>
        </motion.header>

        <div className="space-y-4">
          {articles.map((article, index) => {
            const isOpen = openArticle === article.id;
            const Icon = article.icon;
            const panelId = `about-article-${article.id}`;

            return (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="overflow-hidden rounded-2xl border border-muted/80 bg-background shadow-sm"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenArticle(isOpen ? null : article.id)}
                  className="flex w-full items-center gap-4 px-4 py-5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-foreground sm:px-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/40">
                    <Icon size={21} aria-hidden="true" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-anton text-lg sm:text-xl">
                      {article.title}
                    </span>
                    <span className="mt-1 block text-sm text-foreground/65">
                      {article.subtitle}
                    </span>
                  </span>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={21} aria-hidden="true" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      key="article-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.35, ease: "easeInOut" },
                        opacity: { duration: 0.22 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-muted/70 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="space-y-4 rounded-xl bg-muted/55 p-4 text-sm leading-7 sm:p-6 sm:text-base">
                          {article.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-8 text-center text-xs leading-6 text-foreground/60 sm:text-sm"
        >
          Weather information is provided by external services and may change as
          new data becomes available.
        </motion.p>
      </section>

      <Footer />
    </main>
  );
}
