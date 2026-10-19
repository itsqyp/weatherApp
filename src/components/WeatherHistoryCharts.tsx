import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import { fetchWeatherHistory } from "../features/weather/weatherHistory";

const COLORS = {
  background: "#f7e1d7",
  foreground: "#4a5759",
  primary: "#edafb8",
  secondary: "#b0c4b1",
  muted: "#dedbd2",
};

interface WeatherHistoryChartsProps {
  city: string;
  country: string;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-foreground/10 bg-white/45 p-4 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold sm:text-xl">{title}</h3>
      <p className="mt-1 text-sm text-foreground/65">{description}</p>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

function ChartLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-56 animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-2xl bg-secondary/20" />
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default function WeatherHistoryCharts({
  city,
  country,
}: WeatherHistoryChartsProps) {
  const historyQuery = useQuery({
    queryKey: ["weather-history", city, country],
    queryFn: () => fetchWeatherHistory(city, country),
    enabled: Boolean(city.trim() && country.trim()),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  if (historyQuery.isLoading) {
    return (
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold">Past 7 days</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Loading historical weather data for {city}...
          </p>
        </div>
        <ChartLoadingSkeleton />
      </section>
    );
  }

  if (historyQuery.isError) {
    return (
      <section className="rounded-3xl border border-foreground/10 bg-secondary/20 p-6">
        <h2 className="text-xl font-bold">Historical weather</h2>
        <p className="mt-2 text-sm text-foreground/75">
          {historyQuery.error instanceof Error
            ? historyQuery.error.message
            : "Unable to load historical weather data."}
        </p>
        <button
          type="button"
          onClick={() => void historyQuery.refetch()}
          disabled={historyQuery.isFetching}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold transition-colors hover:bg-primary/80 disabled:opacity-60"
        >
          {historyQuery.isFetching ? "Retrying..." : "Try again"}
        </button>
      </section>
    );
  }

  const history = historyQuery.data;

  if (!history || history.days.length === 0) {
    return (
      <section className="rounded-3xl border border-foreground/10 bg-secondary/20 p-6">
        <h2 className="text-xl font-bold">Historical weather</h2>
        <p className="mt-2 text-sm text-foreground/70">
          No historical weather data is available for this location.
        </p>
      </section>
    );
  }

  const days = history.days;
  const dates = days.map((day) => formatDate(day.date));

  const commonOption: EChartsOption = {
    backgroundColor: "transparent",
    textStyle: {
      color: COLORS.foreground,
      fontFamily: "inherit",
    },
    grid: {
      left: 12,
      right: 18,
      top: 36,
      bottom: 12,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: COLORS.background,
      borderColor: COLORS.muted,
      textStyle: { color: COLORS.foreground },
    },
    legend: {
      top: 0,
      textStyle: { color: COLORS.foreground },
    },
  };

  const temperatureOption: EChartsOption = {
    ...commonOption,
    xAxis: {
      type: "category",
      data: dates,
      boundaryGap: false,
      axisLabel: { color: COLORS.foreground },
      axisLine: { lineStyle: { color: COLORS.muted } },
    },
    yAxis: {
      type: "value",
      name: "°C",
      scale: true,
      axisLabel: { color: COLORS.foreground },
      splitLine: { lineStyle: { color: COLORS.muted } },
    },
    series: [
      {
        name: "Maximum",
        type: "line",
        data: days.map((day) => day.temperatureMaxC),
        smooth: true,
        connectNulls: false,
        symbolSize: 7,
        lineStyle: { width: 3, color: COLORS.primary },
        itemStyle: { color: COLORS.primary },
      },
      {
        name: "Average",
        type: "line",
        data: days.map((day) => day.temperatureMeanC),
        smooth: true,
        connectNulls: false,
        symbolSize: 6,
        lineStyle: { width: 3, color: COLORS.foreground },
        itemStyle: { color: COLORS.foreground },
      },
      {
        name: "Minimum",
        type: "line",
        data: days.map((day) => day.temperatureMinC),
        smooth: true,
        connectNulls: false,
        symbolSize: 6,
        lineStyle: { width: 3, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary },
      },
    ],
  };

  const humidityWindOption: EChartsOption = {
    ...commonOption,
    grid: {
      left: 12,
      right: 20,
      top: 48,
      bottom: 12,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: COLORS.foreground },
      axisLine: { lineStyle: { color: COLORS.muted } },
    },
    yAxis: [
      {
        type: "value",
        name: "Humidity (%)",
        min: 0,
        max: 100,
        axisLabel: { color: COLORS.foreground },
        splitLine: { lineStyle: { color: COLORS.muted } },
      },
      {
        type: "value",
        name: "Wind (km/h)",
        min: 0,
        axisLabel: { color: COLORS.foreground },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "Humidity",
        type: "line",
        yAxisIndex: 0,
        data: days.map((day) => day.humidityMean),
        smooth: true,
        connectNulls: false,
        symbolSize: 7,
        lineStyle: { width: 3, color: COLORS.secondary },
        itemStyle: { color: COLORS.secondary },
      },
      {
        name: "Wind speed",
        type: "line",
        yAxisIndex: 1,
        data: days.map((day) => day.windSpeedMeanKph),
        smooth: true,
        connectNulls: false,
        symbolSize: 7,
        lineStyle: { width: 3, color: COLORS.primary },
        itemStyle: { color: COLORS.primary },
      },
    ],
  };

  const precipitationOption: EChartsOption = {
    ...commonOption,
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: COLORS.foreground },
      axisLine: { lineStyle: { color: COLORS.muted } },
    },
    yAxis: {
      type: "value",
      name: "Rain (mm)",
      min: 0,
      axisLabel: { color: COLORS.foreground },
      splitLine: { lineStyle: { color: COLORS.muted } },
    },
    series: [
      {
        name: "Precipitation",
        type: "bar",
        data: days.map((day) => day.precipitationMm),
        barMaxWidth: 38,
        itemStyle: {
          color: COLORS.secondary,
          borderRadius: [8, 8, 0, 0],
        },
      },
    ],
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Past 7 days</h2>
          <p className="mt-1 text-sm text-foreground/70">
            Historical weather estimates for {history.city}, {history.country}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void historyQuery.refetch()}
          disabled={historyQuery.isFetching}
          className="self-start rounded-full border border-foreground/15 bg-primary/30 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/50 disabled:opacity-60 sm:self-auto"
        >
          {historyQuery.isFetching ? "Updating..." : "Refresh history"}
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5">
        <ChartPanel
          title="Temperature"
          description="Daily minimum, average, and maximum temperature in Celsius."
        >
          <ReactECharts
            option={temperatureOption}
            notMerge
            lazyUpdate
            style={{ width: "100%", height: 320 }}
          />
        </ChartPanel>

        <ChartPanel
          title="Humidity and wind"
          description="Daily average humidity and average wind speed."
        >
          <ReactECharts
            option={humidityWindOption}
            notMerge
            lazyUpdate
            style={{ width: "100%", height: 320 }}
          />
        </ChartPanel>

        <ChartPanel
          title="Precipitation"
          description="Total precipitation per day in millimeters."
        >
          <ReactECharts
            option={precipitationOption}
            notMerge
            lazyUpdate
            style={{ width: "100%", height: 300 }}
          />
        </ChartPanel>
      </div>

      <p className="text-xs text-foreground/60">
        Historical data provided by{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2 hover:text-foreground"
        >
          Open-Meteo
        </a>
        . Values are reanalysis estimates and may differ from local weather
        station observations.
      </p>
    </section>
  );
}
