import { useEffect, useMemo, useState } from "react";

function findFirstArrayDeep(input) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    for (const key of Object.keys(input)) {
      const found = findFirstArrayDeep(input[key]);
      if (found) return found;
    }
  }
  return null;
}

// Приводим params к массиву { id, Name }
function normalizeParams(raw) {
  if (!raw) return [];

  // Строка → один параметр
  if (typeof raw === "string") {
    const val = raw.trim();
    return val ? [{ id: "param-0", Name: val }] : [];
  }

  // Массив: строки или объекты
  if (Array.isArray(raw)) {
    return raw.map((p, i) => {
      if (typeof p === "string") return { id: `param-${i}`, Name: p.trim() };
      if (p && typeof p === "object") {
        const name =
          p?.Name ?? p?.name ?? p?.Title ?? p?.title ?? p?.label ?? p?.Label ?? `Параметр ${i + 1}`;
        const id = p?.Id ?? p?.id ?? p?.ID ?? `${name}-${i}`;
        return { id, Name: String(name).trim() };
      }
      return { id: `param-${i}`, Name: String(p) };
    });
  }

  // Объект: ключ-значение → читаемые параметры
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([k, v], i) => ({
      id: `${k}-${i}`,
      Name: `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
    }));
  }

  return [];
}

// Берём только brand, model и params/Params. Остальные поля игнорируем
function normalizeList(list) {
  return list.map((it, idx) => {
    const name = it?.Name ?? it?.name ?? it?.Title ?? it?.title ?? `Элемент ${idx + 1}`;
    const id = it?.Id ?? it?.id ?? it?.ID ?? it?._id ?? `${name}-${idx}`;

    const brand = it?.brand ?? "Без бренда";
    const model = it?.model ?? "Без модели";

    // Только params/Params
    const rawParams = it?.params ?? it?.Params ?? null;
    const params = normalizeParams(rawParams);

    return {
      id,
      brand,
      model,
      params, // [] если params нет
    };
  });
}

function buildTree(items) {
  // Map<brand, Map<model, Param[]>>
  const brandMap = new Map();

  // Нормализация для ключей/сравнений (регистронезависимо, без диакритики)
  const toKey = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // убрать диакритику
      .replace(/\s+/g, " ")
      .replace(/[^a-z0-9\u0400-\u04FF ]/gi, "") // оставить латиницу/кириллицу/цифры и пробел
      .replace(/ /g, "-");

  for (const it of items) {
    const b = it.brand || "Без бренда";
    const m = it.model || "Без модели";

    if (!brandMap.has(b)) brandMap.set(b, new Map());
    const modelsMap = brandMap.get(b);

    if (!modelsMap.has(m)) modelsMap.set(m, []);
    const paramsArr = modelsMap.get(m);

    // Добавляем только params, избегая дублей по Name (регистронезависимо)
    const seen = new Set(paramsArr.map((p) => toKey(p.Name)));
    for (const p of it.params || []) {
      const name = String(p?.Name ?? "").trim();
      if (!name) continue;

      const nameKey = toKey(name);
      if (seen.has(nameKey)) continue;

      // Формируем уникальный и стабильный id внутри модели
      const stableId = `${toKey(b)}__${toKey(m)}__${nameKey}`;
      paramsArr.push({ id: stableId, Name: name });
      seen.add(nameKey);
    }
  }

  // Преобразуем в массив с сортировкой
  const tree = Array.from(brandMap.entries())
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([brand, modelsMap]) => ({
      name: brand,
      models: Array.from(modelsMap.entries())
        .sort(([a], [b]) => a.localeCompare(b, "ru"))
        .map(([modelName, paramsOnly]) => [modelName, paramsOnly]),
    }));

  return tree;
}

export default function Home() {
  const API_URL = "http://localhost:3005/vibro/list";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Раскрытие: бренды и модели
  const [openBrands, setOpenBrands] = useState(new Set());
  const [openModels, setOpenModels] = useState(new Set()); // ключ: `${brand}||${model}`

  // Выбор: бренд, модель или параметр
  const [selected, setSelected] = useState({
    level: "none", // 'brand' | 'model' | 'param' | 'none'
    brand: "",
    model: "",
    param: "",
  });

  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(API_URL, {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();

        let list = Array.isArray(json) ? json : null;
        if (!list) list = json?.data && Array.isArray(json.data) ? json.data : null;
        if (!list) list = json?.items && Array.isArray(json.items) ? json.items : null;
        if (!list) list = json?.result && Array.isArray(json.result) ? json.result : null;
        if (!list) list = json?.rows && Array.isArray(json.rows) ? json.rows : null;
        if (!list) list = findFirstArrayDeep(json);

        if (!list || !Array.isArray(list)) {
          console.debug("API response (unexpected shape):", json);
          throw new Error("Неверный формат ответа: не найден массив с данными");
        }

        const normalized = normalizeList(list);
        if (normalized.length === 0) throw new Error("Сервер вернул пустой список");

        setItems(normalized);

        const tempTree = buildTree(normalized);
        const firstBrand = tempTree[0]?.name;

        // Инициализация: по умолчанию раскрываем только бренд (по желанию можно закрыть всё)
        if (firstBrand) setOpenBrands(new Set([firstBrand]));
        setOpenModels(new Set()); // никакие модели не раскрыты => params не видны

        setSelected(
          firstBrand
            ? { level: "brand", brand: firstBrand, model: "", param: "" }
            : { level: "none", brand: "", model: "", param: "" }
        );
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, []);

  const tree = useMemo(() => buildTree(items), [items]);

  const selectedTitle = useMemo(() => {
    if (selected.level === "param")
      return `${selected.brand}   ${selected.model}   ${selected.param}`;
    if (selected.level === "model")
      return `${selected.brand}   ${selected.model}`;
    if (selected.level === "brand")
      return selected.brand || "Описание";
    return tree[0]?.name || "Описание";
  }, [selected, tree]);

  const toggleBrand = (brand) => {
    setOpenBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  };

  const toggleModel = (brand, model) => {
    const key = `${brand}||${model}`;
    setOpenModels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isBrandSelected = (brand) => selected.level === "brand" && selected.brand === brand;
  const isModelSelected = (brand, model) =>
    selected.level === "model" && selected.brand === brand && selected.model === model;
  const isParamSelected = (brand, model, param) =>
    selected.level === "param" &&
    selected.brand === brand &&
    selected.model === model &&
    selected.param === param;

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 16,
        boxSizing: "border-box",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: 16,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ЛЕВЫЙ */}
      <aside
        style={{
          height: "calc(100vh - 32px)",
          borderRight: "1px solid #eee",
          paddingRight: 12,
          overflowY: "auto",
        }}
        aria-label="Список конструкций"
      >
        <h2 style={{ marginTop: 0 }}>Конструкции</h2>

        {loading && <div>Загрузка…</div>}
        {error && <div style={{ color: "crimson" }}>Ошибка: {error}</div>}
        {!loading && !error && tree.length === 0 && <div>Данные отсутствуют</div>}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tree.map((brandNode) => (
            <li key={`brand-${brandNode.name}`} style={{ marginBottom: 8 }}>
              <button
                onClick={() => {
                  toggleBrand(brandNode.name);
                  setSelected({ level: "brand", brand: brandNode.name, model: "", param: "" });
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: isBrandSelected(brandNode.name) ? "2px solid #555" : "1px solid #ddd",
                  cursor: "pointer",
                  fontSize: 16,
                }}
                title={brandNode.name}
                aria-pressed={isBrandSelected(brandNode.name)}
              >
                {brandNode.name}
              </button>

              {openBrands.has(brandNode.name) && (
                <ul style={{ listStyle: "none", paddingLeft: 12, marginTop: 8 }}>
                  {brandNode.models.map(([modelName, params]) => {
                    const key = `${brandNode.name}||${modelName}`;
                    const opened = openModels.has(key);

                    return (
                      <li key={`model-${key}`} style={{ marginBottom: 8 }}>
                        <button
                          onClick={() => {
                            toggleModel(brandNode.name, modelName);
                            setSelected({
                              level: "model",
                              brand: brandNode.name,
                              model: modelName,
                              param: "",
                            });
                          }}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px 10px",
                            borderRadius: 8,
                            border: isModelSelected(brandNode.name, modelName)
                              ? "2px solid #666"
                              : "1px solid #ddd",
                            cursor: "pointer",
                            fontSize: 14,
                          }}
                          title={modelName}
                          aria-pressed={isModelSelected(brandNode.name, modelName)}
                        >
                          {modelName}
                        </button>

                        {opened && params.length > 0 && (
                          <ul style={{ listStyle: "none", paddingLeft: 12, marginTop: 6 }}>
                            {params.map((param) => (
                              <li key={`param-${param.id}`} style={{ marginBottom: 4 }}>
                                <button
                                  onClick={() =>
                                    setSelected({
                                      level: "param",
                                      brand: brandNode.name,
                                      model: modelName,
                                      param: param.Name,
                                    })
                                  }
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    border: isParamSelected(brandNode.name, modelName, param.Name)
                                      ? "2px solid #777"
                                      : "1px solid #eee",
                                    cursor: "pointer",
                                    fontSize: 13,
                                  }}
                                  title={param.Name}
                                  aria-pressed={isParamSelected(brandNode.name, modelName, param.Name)}
                                >
                                  {param.Name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {opened && params.length === 0 && (
                          <div style={{ fontSize: 12, color: "#999", paddingLeft: 12 }}>
                            Нет параметров
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* ПРАВЫЙ */}
      <section
        style={{
          position: "sticky",
          top: 16,
          alignSelf: "start",
          height: "calc(100vh - 32px)",
          overflow: "hidden",
          paddingLeft: 4,
          display: "flex",
          flexDirection: "column",
        }}
        aria-label="Описание конструкции"
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            paddingBottom: 8,
          }}
        >
          <h2 style={{ margin: 0 }}>{selectedTitle}</h2>
        </div>

        {/* Прокручиваемая область справа */}
        {/* <div style={{ flex: 1, overflowY: "auto", paddingRight: 8 }} /> */}
      </section>
    </main>
  );
}
