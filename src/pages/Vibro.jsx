import { useEffect, useState, useMemo } from "react";
import VibroChartNew from "../components/charts/VibroChartNew";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Vibro.css";

// Helper: thickness endpoint for a model (adjust to match Swagger if needed)
const getThicknessUrl = (modelId) =>
  `${import.meta.env.VITE_API_URL}/vibro/models/${encodeURIComponent(
    modelId
  )}/sizes`; 

export default function Vibro() {
  const [brands, setBrands] = useState([])

  const [brandA, setBrandA] = useState("");
  const [brandB, setBrandB] = useState("");

  const [items, setItems] = useState([]);
  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [listA, setListA] = useState([]);
  const [listB, setListB] = useState([]);
  const [chartData, setChartData] = useState(null);

  // const seriesA = [0.12, 0.18, 0.33, 0.41, 0.55, 0.62, 0.74, 0.89, 1.03, 1.03];
  // const seriesB = [0.1, 0.15, 0.28, 0.39, 0.5, 0.58, 0.7, 0.84, 0.98, 0.98];

  // Thickness per selected model
  const [thicknessAOptions, setThicknessAOptions] = useState([]);
  const [thicknessBOptions, setThicknessBOptions] = useState([]);
  const [thicknessA, setThicknessA] = useState("");
  const [thicknessB, setThicknessB] = useState("");
  const [infoA, setInfoA] = useState("");
  const [infoB, setInfoB] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/brands`,
          {
            headers: { Accept: "application/json" },
          }
        );

        const response = await res.json();

        setBrands(response.data);
      } catch {}
    }

    load();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/models/${brandA}`,
          {
            headers: { Accept: "application/json" },
          }
        );

        const response = await res.json();

        setListA(response.data);
      } catch {}
    }

    if (brandA) {
      load();
    }
  }, [brandA]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/models/${brandB}`,
          {
            headers: { Accept: "application/json" },
          }
        );

        const response = await res.json();

        setListB(response.data);
      } catch {}
    }

    if (brandB) {
      load();
    }
  }, [brandB]);

  useEffect(() => {
    if (valueA && valueB && thicknessA && thicknessB) {
      (async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/vibro/graph`,
            {
              method: "POST",
              body: JSON.stringify([
                {
                  model_code: valueA,
                  size_code: thicknessA,
                },
                {
                  model_code: valueB,
                  size_code: thicknessB,
                },
              ]),
            }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();

          setChartData(json.data);
        } catch {}
      })();
    }
  }, [valueA, valueB, thicknessA, thicknessB]);

  useEffect(() => {
    if (valueA && thicknessA) {
      (async () => {
        try {
          const thickness = thicknessAOptions.find(
            (item) => item.code === thicknessA
          )?.thickness;

          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/vibro/material/model/${valueA}/thickness/${thickness}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();

          setInfoA(json.data);
        } catch (e) {}
      })();
    }
  }, [valueA, thicknessA, thicknessAOptions]);

  useEffect(() => {
    if (valueB && thicknessB) {
      (async () => {
        const thickness = thicknessBOptions.find(
          (item) => item.code === thicknessB
        )?.thickness;

        try {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/vibro/material/model/${valueB}/thickness/${thickness}`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();

          setInfoB(json.data);
        } catch (e) {}
      })();
    }
  }, [valueB, thicknessB, thicknessBOptions]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          "http://localhost:3005/api/v2/material/list/vibro", 
          {
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json?.items)
          ? json.items
          : [];

        const filtered = list.filter(
          (it) =>
            typeof it?.Name === "string" &&
            it.Name.toLowerCase().includes("sylomer")
        );

        setItems(filtered);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const itemA = useMemo(
    () => items.find((it) => it?.Name === valueA),
    [items, valueA]
  );
  const itemB = useMemo(
    () => items.find((it) => it?.Name === valueB),
    [items, valueB]
  );

  useEffect(() => {
    (async () => {
      setThicknessA("");
      setThicknessAOptions([]);
      if (!valueA) return;
      try {
        const res = await fetch(getThicknessUrl(valueA), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        setThicknessAOptions(json.data);
      } catch {}
    })();
  }, [valueA]);

  useEffect(() => {
    (async () => {
      setThicknessB("");
      setThicknessBOptions([]);
      if (!valueB) return;
      try {
        const res = await fetch(getThicknessUrl(valueB), {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        setThicknessBOptions(json.data);
      } catch {}
    })();
  }, [valueB]);

  const ignoredKeys = useMemo(() => new Set(["__typename"]), []);

  const isObject = (v) => v !== null && typeof v === "object";
  const areValuesEqual = (a, b) => {
    if (a === b) return true;
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (isObject(a) || isObject(b)) {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch {
        return false;
      }
    }
    return false;
  };
  // const formatVal = (v) => {
  //   if (v === undefined) return "undefined";
  //   if (v === null) return "null";
  //   if (typeof v === "string") return v;
  //   if (typeof v === "number" || typeof v === "boolean") return String(v);
  //   try {
  //     return JSON.stringify(v);
  //   } catch {
  //     return String(v);
  //   }
  // };

  const diffs = useMemo(() => {
    if (!itemA || !itemB) return [];
    const keys = Array.from(
      new Set([...Object.keys(itemA || {}), ...Object.keys(itemB || {})])
    ).filter((k) => !ignoredKeys.has(k));

    return keys.reduce((acc, key) => {
      const a = itemA[key];
      const b = itemB[key];
      if (!areValuesEqual(a, b)) acc.push({ key, a, b });
      return acc;
    }, []);
  }, [itemA, itemB, ignoredKeys]);

  // const isComparable = !!itemA && !!itemB;
  // const isEqual = isComparable && diffs.length === 0;

  // const labelA = itemA?.Name || valueA || "-";
  // const labelB = itemB?.Name || valueB || "-";

  const brandAName = brands.find((b) => b.Code === brandA)?.Name || "";
  const brandBName = brands.find((b) => b.Code === brandB)?.Name || "";

  const materialAName = listA.find((m) => m.Code === valueA)?.Name || "";
  const materialBName = listB.find((m) => m.Code === valueB)?.Name || "";

  const labelAFull = [brandAName, materialAName].filter(Boolean).join(" ");
  const labelBFull = [brandBName, materialBName].filter(Boolean).join(" ");

  // Подписи X (опционально): например, уровни нагрузки 1..8
  // const xLabels = useMemo(() => Array.from({ length: 8 }, (_, i) => i + 1), []);

  return (
    <div className="vibro-container">
      {loading && <p className="vibro-loading vibro-error">Загрузка.....</p>}
      {error && <p className="vibro-error">Ошибка: {error}</p>}

      {!loading && !error && (
        <>
          <h2 className="vibro-title">
            Сравнение виброизоляционных материалов
          </h2>
          <div className="vibro-comparison-label">
            <strong>
              {labelAFull || "-"} VS {labelBFull || "-"}
            </strong>
          </div>

          {/* Бренд + (Материал и Толщина под ним) для A и B */}
          <div className="vibro-brand-material-grid">
            {/* Колонка A */}
            <div>
              <label>
                <select
                  value={brandA}
                  onChange={(e) => setBrandA(e.target.value)}
                  className="vibro-select"
                >
                  <option value="">Выберите бренд...</option>
                  {brands?.map((item) => (
                    <option key={item.Code} value={item.Code}>
                      {item.Name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Материал и Толщина — рядом, под брендом A */}
              <div className="vibro-material-thickness-grid">
                <label>
                  <select
                    value={valueA}
                    onChange={(e) => setValueA(e.target.value)}
                    className="vibro-select"
                  >
                    <option value="">Выберите материал...</option>
                    {listA?.map((item) => (
                      <option key={item.Code} value={item.Code}>
                        {item.Name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <select
                    value={thicknessA}
                    onChange={(e) => setThicknessA(e.target.value)}
                    className="vibro-select"
                  >
                    <option value="">Толщина материала...</option>
                    {thicknessAOptions?.map((thickness) => (
                      <option key={thickness.code} value={thickness.code}>
                        {thickness.thickness}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Колонка B */}
            <div>
              <label>
                <select
                  value={brandB}
                  onChange={(e) => setBrandB(e.target.value)}
                  className="vibro-select"
                >
                  <option value="">Выберите бренд...</option>
                  {brands?.map((item) => (
                    <option key={item.Code} value={item.Code}>
                      {item.Name}
                    </option>
                  ))}
                </select>
              </label>

              {/* Материал и Толщина — рядом, под брендом B */}
              <div className="vibro-material-thickness-grid">
                <label>
                  <select
                    value={valueB}
                    onChange={(e) => setValueB(e.target.value)}
                    className="vibro-select"
                  >
                    <option value="">Выберите материал...</option>
                    {listB?.map((item) => (
                      <option key={item.Code} value={item.Code}>
                        {item.Name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <select
                    value={thicknessB}
                    onChange={(e) => setThicknessB(e.target.value)}
                    className="vibro-select"
                  >
                    <option value="">Толщина материала...</option>
                    {thicknessBOptions?.map((thickness) => (
                      <option key={thickness.code} value={thickness.code}>
                        {thickness.thickness}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="vibro-brand-material-grid">
            <div>
              <Markdown>{infoA}</Markdown>
            </div>
            <div>
              <Markdown>{infoB}</Markdown>
            </div>
          </div>

          {/* Единый блок: график + таблица */}
          {chartData && (
            <>
              <div className="vibro-chart-grid">
                <div>
                  <VibroChartNew chartData={chartData.measurements} />
                </div>
                <div className="vibro-chart-info">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {chartData.table_results}
                  </Markdown>
                </div>
              </div>
              {chartData?.conclusion && (
                <Markdown style={{ marginTop: 8 }}>
                  {chartData.conclusion}
                </Markdown>
              )}
              <div className="vibro-footer">
                <p> Все данные взяты из открытых источников </p>
                <small>
                  {new Date()
                    .toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                    .replace(" г.", " г.")
                    .replace(/^./, (c) => c.toUpperCase())}
                </small>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}