import {
  ResponsiveContainer,
  AreaChart,
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
    a: "#1976d2",                         //#e91e63
    b: "#e91e63",                         //#1976d2
    areaPositive: "rgba(0, 255, 0, 0.3)", // над осью
    areaNegative: "rgba(255, 0, 0, 0.3)", // под осью
  },
}) {
  useEffect(() => {
    // console.log("📊 chartData =", chartData);
  }, [chartData]);

  const data = useMemo(() => {
    if (!chartData?.diagram_params?.x_axis_points || !chartData?.items?.length)
      return [];

    return chartData.diagram_params.x_axis_points.map((freq, i) => {
      const aValue = chartData.items[0]?.y_axis?.[i] ?? 0;
      const bValue = chartData.items[1]?.y_axis?.[i] ?? 0;

      return {
        xLabel: String(freq),
        a: aValue,
        b: bValue,
        aPositive: aValue > 0 ? aValue : 0,
        aNegative: aValue < 0 ? aValue : 0,
        bPositive: bValue > 0 ? bValue : 0,
        bNegative: bValue < 0 ? bValue : 0,
      };
    });
  }, [chartData]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

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

          <ReferenceLine y={0} stroke="black" strokeWidth={1.5} />

          {/* Заливка серии A */}
          <Area
            type="monotone"
            dataKey="aNegative"
            stroke="none"
            fill={colors.areaNegative}
            stackId="stackA"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            legendType="none"
            name=""
          />
          <Area
            type="monotone"
            dataKey="aPositive"
            stroke="none"
            fill={colors.areaPositive}
            stackId="stackA"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            name=""
          />

          {/* Заливка серии B */}
          <Area
            type="monotone"
            dataKey="bNegative"
            stroke="none"
            fill={colors.areaNegative}
            stackId="stackB"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            name=""
          />
          <Area
            type="monotone"
            dataKey="bPositive"
            stroke="none"
            fill={colors.areaPositive}
            stackId="stackB"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            legendType="none"
            name=""
          />

          {/* Линии поверх заливок */}
          <Line
            type="monotone"
            dataKey="a"
            name={chartData.items[0]?.name || "A"}
            stroke={colors.a}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="b"
            name={chartData.items[1]?.name || "B"}
            stroke={colors.b}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
