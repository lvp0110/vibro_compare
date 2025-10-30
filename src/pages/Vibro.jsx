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
  const [brands, setBrands] = useState([]);

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

  // Thickness per selected model
  const [thicknessAOptions, setThicknessAOptions] = useState([]);
  const [thicknessBOptions, setThicknessBOptions] = useState([]);
  const [thicknessA, setThicknessA] = useState("");
  const [thicknessB, setThicknessB] = useState("");
  const [infoA, setInfoA] = useState("");
  const [infoB, setInfoB] = useState("");

  const ICON_URL = "http://localhost:3005/api/v1/constr/pdf_icon.png";

  // Load brands
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/brands`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json();
        setBrands(response.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, []);

  // Reset branch A when brandA changes
  useEffect(() => {
    setValueA("");
    setThicknessA("");
    setThicknessAOptions([]);
    setInfoA("");
    setListA([]);
    setChartData(null);
  }, [brandA]);

  // Reset branch B when brandB changes
  useEffect(() => {
    setValueB("");
    setThicknessB("");
    setThicknessBOptions([]);
    setInfoB("");
    setListB([]);
    setChartData(null);
  }, [brandB]);

  // Load models for brandA
  useEffect(() => {
    if (!brandA) {
      setListA([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/models/${brandA}`,
          { headers: { Accept: "application/json" }, signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json();
        setListA(response.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, [brandA]);

  // Load models for brandB
  useEffect(() => {
    if (!brandB) {
      setListB([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/vibro/models/${brandB}`,
          { headers: { Accept: "application/json" }, signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json();
        setListB(response.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, [brandB]);

  // Load reference items list (Sylomer)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(""); //localhost:3005  constrtodo.ru:3005
        const res = await fetch(
          "https://constrtodo.ru:3005/api/v2/material/list/vibro",
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

  // Load thickness options for valueA
  useEffect(() => {
    setThicknessA("");
    setThicknessAOptions([]);
    if (!valueA) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(getThicknessUrl(valueA), {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setThicknessAOptions(json.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, [valueA]);

  // Load thickness options for valueB
  useEffect(() => {
    setThicknessB("");
    setThicknessBOptions([]);
    if (!valueB) return;

    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(getThicknessUrl(valueB), {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setThicknessBOptions(json.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, [valueB]);

  // Load infoA when valueA + thicknessA selected
  useEffect(() => {
    setInfoA("");
    if (!valueA || !thicknessA) return;

    const controller = new AbortController();
    (async () => {
      try {
        const thickness = thicknessAOptions.find(
          (item) => item.code === thicknessA
        )?.thickness;
        if (!thickness) return;
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/vibro/material/model/${valueA}/thickness/${thickness}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setInfoA(json.data || "");
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();

    return () => controller.abort();
  }, [valueA, thicknessA, thicknessAOptions]);

  // Load infoB when valueB + thicknessB selected
  useEffect(() => {
    setInfoB("");
    if (!valueB || !thicknessB) return;

    const controller = new AbortController();
    (async () => {
      try {
        const thickness = thicknessBOptions.find(
          (item) => item.code === thicknessB
        )?.thickness;
        if (!thickness) return;
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/vibro/material/model/${valueB}/thickness/${thickness}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setInfoB(json.data || "");
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();

    return () => controller.abort();
  }, [valueB, thicknessB, thicknessBOptions]);

  // Load chart when all params selected; clear chart on any change or incomplete params
  useEffect(() => {
    if (!(valueA && valueB && thicknessA && thicknessB)) {
      setChartData(null);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        // явно скрыть предыдущий график, пока грузится новый
        setChartData(null);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/vibro/graph`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify([
            { model_code: valueA, size_code: thicknessA },
            { model_code: valueB, size_code: thicknessB },
          ]),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setChartData(json.data || null);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();

    return () => controller.abort();
  }, [valueA, valueB, thicknessA, thicknessB]);

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

  const brandAName = brands.find((b) => b.Code === brandA)?.Name || "";
  const brandBName = brands.find((b) => b.Code === brandB)?.Name || "";

  const materialAName = listA.find((m) => m.Code === valueA)?.Name || "";
  const materialBName = listB.find((m) => m.Code === valueB)?.Name || "";

  const labelAFull = [brandAName, materialAName].filter(Boolean).join(" ");
  const labelBFull = [brandBName, materialBName].filter(Boolean).join(" ");

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

          {/* Бренд + (Материал и Толщина под ним) + Инфо для A и B */}
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
                    disabled={!brandA || listA.length === 0}
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
                    disabled={!valueA || thicknessAOptions.length === 0}
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

              {/* Информация по A прямо под селектами A */}
              <div className="vibro-info">
                <Markdown>{infoA}</Markdown>
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
                    disabled={!brandB || listB.length === 0}
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
                    disabled={!valueB || thicknessBOptions.length === 0}
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

              {/* Информация по B прямо под селектами B */}
              <div className="vibro-info">
                <Markdown>{infoB}</Markdown>
              </div>
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
              {/* <img
                role="button"
                src={ICON_URL}
                alt="Иконка"
                width={40}
                height={40}
              /> */}

              <div className="vibro-footer">
                <p>Примечание:</p>
                <ul>
                  <li>данные рассчитаны при форм-факторе q = 3,</li>
                  <li>
                    все показатели соответствуют предельной нагрузке отдельно
                    взятого материала
                  </li>
                  <li
                    style={{
                      listStyle: "none",
                      fontStyle: "italic",
                      fontWeight: "200",
                    }}
                  >
                    * все данные взяты из открытых источников
                  </li>
                </ul>
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
