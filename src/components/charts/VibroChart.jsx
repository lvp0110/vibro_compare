// src/components/charts/VibroChart.jsx
import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
  } from "recharts";
  import { useMemo } from "react";
  
  // Фиксированные частоты по оси X (Гц)
  export const FREQUENCIES = [100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 5000];
  
  // Фиксированные тики по оси Y
  export const Y_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.1];
  
  export default function VibroChart({
    seriesA = [],
    seriesB = [],
    labelA = "Серия A",
    labelB = "Серия B",
    height = 300,
    colors = { a: "#1976d2", b: "#e91e63" },
    yUnit = "g", // например: "g", "мм/с", и т.д.
  }) {
    // Делаем категориальные подписи по X (равномерное распределение по экрану)
    const data = useMemo(() => {
      return FREQUENCIES.map((freq, i) => ({
        xLabel: String(freq), // категориальная метка
        a: Number.isFinite(seriesA[i]) ? seriesA[i] : null,
        b: Number.isFinite(seriesB[i]) ? seriesB[i] : null,
      }));
    }, [seriesA, seriesB]);
  
    return (
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
  
            {/* Категориальная ось X: равномерные интервалы между метками */}
            <XAxis
              dataKey="xLabel"
              type="category"
              interval={0}             // показывать все метки
              tick={{ fontSize: 12 }}
              // при желании можно добавить форматирование, но метка уже содержит частоту
              // tickFormatter={(v) => `${v} Гц`}
            />
  
            {/* Фиксированный домен и тики по Y */}
            <YAxis
              domain={[Y_TICKS[0], Y_TICKS[Y_TICKS.length - 1]]}
              ticks={Y_TICKS}
              tick={{ fontSize: 12 }}
            />
  
            {/* <Tooltip
              labelFormatter={(label) => `Частота: ${label} Гц`}
              formatter={(value, name) => [
                Number.isFinite(value) ? value.toFixed(3) + (yUnit ? ` ${yUnit}` : "") : "—",
                name,
              ]}
            /> */}
            <Legend />
  
            <Line
              type="monotone"
              dataKey="a"
              name={labelA}
              stroke={colors.a}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="b"
              name={labelB}
              stroke={colors.b}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  