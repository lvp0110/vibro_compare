import { useEffect, useState, useMemo } from "react";
import VibroChart, { FREQUENCIES } from "../components/charts/VibroChart";
import VibroChartNew from "../components/charts/VibroChartNew";

export default function Vibro() {
  const [items, setItems] = useState([]);
  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [list, setList] = useState([]);
  const [chartData, setChartData] = useState(null);

  const seriesA = [0.12, 0.18, 0.33, 0.41, 0.55, 0.62, 0.74, 0.89, 1.03, 1.03];
  const seriesB = [0.1, 0.15, 0.28, 0.39, 0.5, 0.58, 0.7, 0.84, 0.98, 0.98];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:3005/vibro/list", {
          headers: { Accept: "application/json" },
        });

        const response = await res.json();

        setList(response.data);
      } catch {}
    }

    load();
  }, []);

  useEffect(() => {
    if (valueA && valueB) {
      (async () => {
        try {
          const res = await fetch(
            `http://localhost:3005/vibro/${valueA}/vs/${valueB}`,
            { method: "POST" }
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();

          setChartData(json.data);
        } catch (e) {}
      })();
    }
  }, [valueA, valueB]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/v2/material/list/vibro", {
          signal: controller.signal,
        });
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
    async function load() {
      try {
        const res = await fetch("http://localhost:3005/vibro/list", {
          headers: { Accept: "application/json" },
        });
  
        const response = await res.json();
  
        const data = Array.isArray(response?.data) ? response.data : [];
        const sylomerOnly = data.filter((it) => {
          const name = (it?.name ?? it?.Name ?? "").toString();
          return name.toLowerCase().includes("sylomer");
        });
  
        setList(sylomerOnly);
      } catch {}
    }
  
    load();
  }, []);
  
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
  const formatVal = (v) => {
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
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

  const isComparable = !!itemA && !!itemB;
  const isEqual = isComparable && diffs.length === 0;
  const labelA = useMemo(() => itemA?.Name || "Материал A", [itemA]);
  const labelB = useMemo(() => itemB?.Name || "Материал B", [itemB]);

  // Подписи X (опционально): например, уровни нагрузки 1..8
  const xLabels = useMemo(() => Array.from({ length: 8 }, (_, i) => i + 1), []);

  return (
    <div style={{ width: 920, padding: 16 }}>
      {loading && <p>Загрузка.....</p>}
      {error && <p style={{ color: "crimson" }}>Ошибка: {error}</p>}

      {!loading && !error && (
        <>
          <h2 style={{ textAlign: "center" }}>
            Сравнение виброизоляционных материалов
          </h2>
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <strong>
              {labelA} vs {labelB}:
            </strong>{" "}
            <span style={{ color: isEqual ? "green" : "orange" }}>
              {isEqual ? "совпадают" : "разные"}
            </span>
          </div>

          {/* New */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <label>
              <select
                value={valueA}
                onChange={(e) => setValueA(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "100%",
                }}
              >
                <option value="">Выберите материал...</option>
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select
                value={valueB}
                onChange={(e) => setValueB(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "100%",
                }}
              >
                <option value="">Выберите материал...</option>
                {list.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Old */}
          {/* <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <label>
              <select
                value={valueA}
                onChange={(e) => setValueA(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "100%",
                }}
              >
                <option value="">Выберите материал...</option>
                {items.map((item) => (
                  <option
                    key={item?.Id ?? item?.id ?? item?.Name}
                    value={item?.Name}
                  >
                    {item?.Name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select
                value={valueB}
                onChange={(e) => setValueB(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "100%",
                }}
              >
                <option value="">Выберите материал...</option>
                {items.map((item) => (
                  <option
                    key={(item?.Id ?? item?.id ?? item?.Name) + "-b"}
                    value={item?.Name}
                  >
                    {item?.Name}
                  </option>
                ))}
              </select>
            </label>
          </div> */}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <label>
              <select
                value={valueA}
                onChange={(e) => setValueA(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "50%",
                }}
              >
                <option value="">Толщина материала...</option>
                {items.map((item) => (
                  <option
                    key={item?.Id ?? item?.id ?? item?.Name}
                    value={item?.Name}
                  >
                    {item?.Name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <select
                value={valueB}
                onChange={(e) => setValueB(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 8,
                  padding: 8,
                  width: "50%",
                }}
              >
                <option value="">Толщина материала...</option>
                {items.map((item) => (
                  <option
                    key={(item?.Id ?? item?.id ?? item?.Name) + "-b"}
                    value={item?.Name}
                  >
                    {item?.Name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {chartData && <VibroChartNew chartData={chartData.measurements} />}

          {isComparable && (
            <div style={{ marginTop: 16 }}>
              {!isEqual && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    Отличия ({diffs.length}):
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {diffs.map(({ key, a, b }) => (
                        <li key={key} style={{ marginBottom: 4 }}>
                          <span style={{ color: "#555" }}>{labelA}</span> ={" "}
                          <code>{formatVal(a)}</code> <br />
                          {/* <span style={{ color: "#555" }}>{labelB}</span> ={" "}
                          <code>{formatVal(b)}</code> */}
                        </li>
                      ))}
                    </ul>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {diffs.map(({ key, a, b }) => (
                        <li key={key} style={{ marginBottom: 4 }}>
                          {/* <span style={{ color: "#555" }}>{labelA}</span> ={" "}
                          <code>{formatVal(a)}</code> <br /> */}
                          <span style={{ color: "#555" }}>{labelB}</span> ={" "}
                          <code>{formatVal(b)}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div style={{ padding: "16px 0px" }}>
                <VibroChart
                  seriesA={seriesA}
                  seriesB={seriesB}
                  labelA={labelA}
                  labelB={labelB}
                  height={340}
                  colors={{ a: "#1e88e5", b: "#d81b60" }}
                  yUnit="g"
                />
                <small>Частоты (Гц): {FREQUENCIES.join(", ")}</small>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
