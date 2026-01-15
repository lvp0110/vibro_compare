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
import { useMemo, useEffect, useState } from "react";

export default function VibroChartNew({
  chartData,
  height = 400,
  colors = {
    a: "#1976d2", //"#e91e63"
    b: "#e91e63", //"#1976d2"
    areaPositive: "rgba(0, 215, 0, 0.9)", //rgba(0, 215, 0, 0.9) над осью
    areaNegative: "rgba(255, 0, 0, 0.7)", //rgba(255, 0, 0, 0.7) под осью
  },
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
        freq,
        xLog: Math.log10(freq),
        a: aValue,
        b: bValue,
        негатив: aValue > 0 ? aValue : 0,
        aNegative: aValue < 0 ? aValue : 0,
        bPositive: bValue > 0 ? bValue : 0,
        позитив: bValue < 0 ? bValue : 0,
      };
    });
  }, [chartData]);

  // Определяем настройки для оси X в зависимости от размера экрана
  const xAxisConfig = useMemo(() => {
    if (isMobile) {
      return {
        margin: { top: 10, right: 10, bottom: 120, left: -10 },
        tick: {
          fontSize: 10,
          angle: -45,
          textAnchor: "end",
          dy: 15,
          dx: -2,
        },
        interval: 0, // Показываем все подписи
        height: 120,
        minTickGap: 0,
      };
    }
    return {
      margin: { top: 10, right: 20, bottom: 70, left: 0 },
      tick: {
        fontSize: 14,
        dy: 8,
      },
      interval: 0, // Показываем все подписи
      height: 70,
      minTickGap: 0,
    };
  }, [isMobile]);

  // Определяем высоту графика в зависимости от размера экрана
  const chartHeight = isMobile ? 500 : Math.max(height, 450);

  return (
    <div
      className="vibro-chart-wrapper"
      style={{ width: "100%", marginLeft: "-10px", height: chartHeight }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={xAxisConfig.margin}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="xLog"
            type="number"
            domain={[
              Math.log10(chartData.diagram_params.x_axis_points[0]),
              Math.log10(chartData.diagram_params.x_axis_points.at(-1)),
            ]}
            ticks={chartData.diagram_params.x_axis_display.map((f) =>
              Math.log10(f)
            )} // ← готовые ISO-точки
            interval={0} // Всегда показываем все подписи
            minTickGap={xAxisConfig.minTickGap} // Минимальный интервал между подписями = 0
            allowDuplicatedCategory={true} // Разрешаем дубликаты
            tickCount={chartData.diagram_params.x_axis_display.length} // Явно указываем количество подписей
            tickFormatter={(value) =>
              `${Number(Math.pow(10, value).toFixed(1))}`
            }
            tick={xAxisConfig.tick}
            height={xAxisConfig.height}
            allowDataOverflow={false} // Не разрешаем переполнение данных
          />

          <YAxis
            ticks={chartData.diagram_params.y_axis_points}
            domain={[
              chartData.diagram_params.min,
              chartData.diagram_params.max,
            ]}
            tick={{ fontSize: 12 }}
          />

          <Legend
            wrapperStyle={{
              padding: 0,
              margin: 0,
            }}
          />

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
            dataKey="негатив"
            stroke="none"
            fill={colors.areaPositive}
            stackId="stackA"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            legendType="none"
            name=""
          />

          {/* Заливка серии B */}
          <Area
            type="monotone"
            dataKey="позитив"
            stroke="none"
            fill={colors.areaNegative}
            stackId="stackB"
            baseValue={0}
            connectNulls
            isAnimationActive={false}
            legendType="none"
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
