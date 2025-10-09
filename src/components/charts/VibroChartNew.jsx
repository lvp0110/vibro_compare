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

export default function VibroChartNew({
  chartData,
  height = 400,
  colors = { a: "#1976d2", b: "#e91e63" },
}) {
  // Делаем категориальные подписи по X (равномерное распределение по экрану)
  const data = useMemo(() => {
    return chartData.diagram_params.x_axis_points.map((freq, i) => ({
      xLabel: String(freq), // категориальная метка
      a: chartData.items[0].y_axis[i],
      b: chartData.items[1].y_axis[i],
    }));
  }, [chartData]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* Категориальная ось X: равномерные интервалы между метками */}
          <XAxis
            dataKey="xLabel"
            type="category"
            interval={0} // показывать все метки
            tick={{ fontSize: 12 }}
            // при желании можно добавить форматирование, но метка уже содержит частоту
            // tickFormatter={(v) => `${v} Гц`}
          />

          {/* Фиксированный домен и тики по Y */}
          <YAxis
            // domain={[Y_TICKS[0], Y_TICKS[Y_TICKS.length - 1]]}
            ticks={chartData.diagram_params.y_axis_points}
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
            name={chartData.items[0].name}
            stroke={colors.a}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="b"
            name={chartData.items[1].name}
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
