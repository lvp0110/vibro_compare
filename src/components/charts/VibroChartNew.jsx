import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from "recharts";
import { useMemo, useEffect } from "react";

export default function VibroChartNew({
  chartData,
  height = 400,
  colors = {
    a: "#1976d2",
    b: "#e91e63",
    areaPositive: "rgba(255, 0, 0, 0.25)", // над осью
    areaNegative: "rgba(0, 255, 0, 0.25)", // под осью
  },
}) {
  // Для отладки — можно удалить потом
  useEffect(() => {
    console.log("📊 chartData =", chartData);
  }, [chartData]);

  const data = useMemo(() => {
    if (!chartData?.diagram_params?.x_axis_points || !chartData?.items?.length)
      return [];

    return chartData.diagram_params.x_axis_points.map((freq, i) => {
      const aValue = chartData.items[0].y_axis[i];
      const bValue = chartData.items[1].y_axis[i];
      return {
        xLabel: String(freq), // ⚠️ X остаётся строкой, чтобы совпадали подписи
        a: aValue,
        b: bValue,
        bPositive: bValue > 0 ? bValue : 0,
        bNegative: bValue < 0 ? bValue : 0,
      };
    });
  }, [chartData]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* ⚙️ Ось X — категориальная (строковая) */}
          <XAxis dataKey="xLabel" tick={{ fontSize: 12 }} />

          <YAxis
            ticks={chartData.diagram_params.y_axis_points}
            domain={[
              chartData.diagram_params.min,
              chartData.diagram_params.max,
            ]}
            tick={{ fontSize: 12 }}
          />

          <Legend />

          {/* Линия нуля */}
          <ReferenceLine y={0} stroke="black" strokeWidth={1.5} />

          {/* 🟢 Заливка под осью */}
          <Area
            type="monotone"
            dataKey="bNegative"
            stroke="none"
            fill={colors.areaNegative}
            stackId="stack"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
          />

          {/* 🔴 Заливка над осью */}
          <Area
            type="monotone"
            dataKey="bPositive"
            stroke="none"
            fill={colors.areaPositive}
            stackId="stack"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
          />

          {/* Линии */}
          <Line
            type="monotone"
            dataKey="a"
            name={chartData.items[0].name}
            stroke={colors.a}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="b"
            name={chartData.items[1].name}
            stroke={colors.b}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
