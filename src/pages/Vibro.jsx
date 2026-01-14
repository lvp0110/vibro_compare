import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import VibroChartNew from "../components/charts/VibroChartNew";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./Vibro.css";
import { getApiUrl } from "../env";

// Helper: thickness endpoint for a model (adjust to match Swagger if needed)
const getThicknessUrl = (modelId) =>
  `${getApiUrl()}/vibro/models/${encodeURIComponent(modelId)}/sizes`;

export default function Vibro() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitializedFromURL = useRef(false);
  const hasInitializedFromURL = useRef(false);
  const prevStateRef = useRef({
    brandA: "",
    brandB: "",
    valueA: "",
    valueB: "",
    thicknessA: "",
    thicknessB: "",
  });

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
  const [isClicked, setIsClicked] = useState(false);

  const ICON_URL = `${getApiUrl()}/api/v1/constr/share_icon_grey.svg`;

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      // Build search params from current state
      const params = new URLSearchParams();
      if (brandA) params.set("brandA", brandA);
      if (brandB) params.set("brandB", brandB);
      if (valueA) params.set("valueA", valueA);
      if (valueB) params.set("valueB", valueB);
      if (thicknessA) params.set("thicknessA", thicknessA);
      if (thicknessB) params.set("thicknessB", thicknessB);

      // Build full URL with hash and params
      // Get base URL (everything before the hash)
      const baseUrl = window.location.href.split("#")[0];
      const paramsString = params.toString();
      const fullUrl = paramsString
        ? `${baseUrl}#/vibro?${paramsString}`
        : `${baseUrl}#/vibro`;

      // Copy to clipboard using modern API
      await navigator.clipboard.writeText(fullUrl);
      // Trigger scale animation
      setIsClicked(true);
      setTimeout(() => {
        setIsClicked(false);
      }, 500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      // Fallback for older browsers or when clipboard API is not available
      try {
        const params = new URLSearchParams();
        if (brandA) params.set("brandA", brandA);
        if (brandB) params.set("brandB", brandB);
        if (valueA) params.set("valueA", valueA);
        if (valueB) params.set("valueB", valueB);
        if (thicknessA) params.set("thicknessA", thicknessA);
        if (thicknessB) params.set("thicknessB", thicknessB);

        const baseUrl = window.location.href.split("#")[0];
        const paramsString = params.toString();
        const fullUrl = paramsString
          ? `${baseUrl}#/vibro?${paramsString}`
          : `${baseUrl}#/vibro`;

        const textArea = document.createElement("textarea");
        textArea.value = fullUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          // Trigger scale animation
          setIsClicked(true);
          setTimeout(() => {
            setIsClicked(false);
          }, 2000);
        } else {
          console.error("Fallback copy failed");
        }
      } catch (fallbackErr) {
        console.error("Fallback copy error:", fallbackErr);
      }
    }
  };

  // Load brands
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/vibro/brands`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const response = await res.json();
        setBrands(response.data || []);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
    return () => controller.abort();
  }, []);

  // Initialize from URL parameters on mount (only once)
  useEffect(() => {
    if (brands.length === 0 || hasInitializedFromURL.current) return;

    const urlBrandA = searchParams.get("brandA");
    const urlBrandB = searchParams.get("brandB");

    // Check if we have URL parameters
    if (urlBrandA || urlBrandB) {
      hasInitializedFromURL.current = true;
      isInitializedFromURL.current = true;

      // Set brands from URL
      if (urlBrandA) {
        setBrandA(urlBrandA);
      }
      if (urlBrandB) {
        setBrandB(urlBrandB);
      }
    }
  }, [brands, searchParams]);

  // Set valueA from URL when listA is loaded
  useEffect(() => {
    if (!hasInitializedFromURL.current || listA.length === 0 || !brandA) return;

    const urlBrandA = searchParams.get("brandA");
    const urlValueA = searchParams.get("valueA");

    // Restore valueA from URL if brand matches and value is in the list
    if (
      urlBrandA === brandA &&
      urlValueA &&
      listA.some((item) => item.Code === urlValueA) &&
      valueA !== urlValueA
    ) {
      setValueA(urlValueA);
    }
  }, [listA, brandA, searchParams, valueA]);

  // Set valueB from URL when listB is loaded
  useEffect(() => {
    if (!hasInitializedFromURL.current || listB.length === 0 || !brandB) return;

    const urlBrandB = searchParams.get("brandB");
    const urlValueB = searchParams.get("valueB");

    // Restore valueB from URL if brand matches and value is in the list
    if (
      urlBrandB === brandB &&
      urlValueB &&
      listB.some((item) => item.Code === urlValueB) &&
      valueB !== urlValueB
    ) {
      setValueB(urlValueB);
    }
  }, [listB, brandB, searchParams, valueB]);

  // Set thicknessA from URL when thicknessAOptions is loaded
  useEffect(() => {
    if (
      !hasInitializedFromURL.current ||
      thicknessAOptions.length === 0 ||
      !valueA
    )
      return;

    const urlValueA = searchParams.get("valueA");
    const urlThicknessA = searchParams.get("thicknessA");

    // Restore thicknessA from URL if valueA matches and thickness is in the options
    if (
      urlValueA === valueA &&
      urlThicknessA &&
      thicknessAOptions.some((item) => item.code === urlThicknessA) &&
      thicknessA !== urlThicknessA
    ) {
      setThicknessA(urlThicknessA);
    }
  }, [thicknessAOptions, searchParams, thicknessA, valueA]);

  // Set thicknessB from URL when thicknessBOptions is loaded
  useEffect(() => {
    if (
      !hasInitializedFromURL.current ||
      thicknessBOptions.length === 0 ||
      !valueB
    )
      return;

    const urlValueB = searchParams.get("valueB");
    const urlThicknessB = searchParams.get("thicknessB");

    // Restore thicknessB from URL if valueB matches and thickness is in the options
    if (
      urlValueB === valueB &&
      urlThicknessB &&
      thicknessBOptions.some((item) => item.code === urlThicknessB) &&
      thicknessB !== urlThicknessB
    ) {
      setThicknessB(urlThicknessB);
    }
  }, [thicknessBOptions, searchParams, thicknessB, valueB]);

  // Reset initialization flag after values are restored
  useEffect(() => {
    if (!isInitializedFromURL.current) return;

    const urlBrandA = searchParams.get("brandA");
    const urlBrandB = searchParams.get("brandB");
    const urlValueA = searchParams.get("valueA");
    const urlValueB = searchParams.get("valueB");
    const urlThicknessA = searchParams.get("thicknessA");
    const urlThicknessB = searchParams.get("thicknessB");

    // Check if all values that exist in URL have been restored
    const allRestored =
      (!urlBrandA || brandA === urlBrandA) &&
      (!urlBrandB || brandB === urlBrandB) &&
      (!urlValueA || valueA === urlValueA) &&
      (!urlValueB || valueB === urlValueB) &&
      (!urlThicknessA || thicknessA === urlThicknessA) &&
      (!urlThicknessB || thicknessB === urlThicknessB);

    if (allRestored) {
      // Reset flag after a delay to allow URL updates
      const timer = setTimeout(() => {
        isInitializedFromURL.current = false;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [brandA, brandB, valueA, valueB, thicknessA, thicknessB, searchParams]);

  // Update URL when state changes (except during initialization)
  useEffect(() => {
    // Skip URL updates during initialization
    if (isInitializedFromURL.current) {
      // Update ref even when skipping
      prevStateRef.current = {
        brandA,
        brandB,
        valueA,
        valueB,
        thicknessA,
        thicknessB,
      };
      return;
    }

    // Check if state actually changed compared to previous state
    const prevState = prevStateRef.current;
    const hasChanges =
      brandA !== prevState.brandA ||
      brandB !== prevState.brandB ||
      valueA !== prevState.valueA ||
      valueB !== prevState.valueB ||
      thicknessA !== prevState.thicknessA ||
      thicknessB !== prevState.thicknessB;

    if (hasChanges) {
      const newParams = new URLSearchParams();
      if (brandA) newParams.set("brandA", brandA);
      if (brandB) newParams.set("brandB", brandB);
      if (valueA) newParams.set("valueA", valueA);
      if (valueB) newParams.set("valueB", valueB);
      if (thicknessA) newParams.set("thicknessA", thicknessA);
      if (thicknessB) newParams.set("thicknessB", thicknessB);

      // Use replace to avoid adding to history
      setSearchParams(newParams, { replace: true });
      prevStateRef.current = {
        brandA,
        brandB,
        valueA,
        valueB,
        thicknessA,
        thicknessB,
      };
    } else {
      // Update ref even when no changes to keep it in sync
      prevStateRef.current = {
        brandA,
        brandB,
        valueA,
        valueB,
        thicknessA,
        thicknessB,
      };
    }
  }, [brandA, brandB, valueA, valueB, thicknessA, thicknessB, setSearchParams]);

  // Reset branch A when brandA changes (but not during URL restoration)
  useEffect(() => {
    // Don't reset if we're actively initializing from URL
    if (isInitializedFromURL.current) return;

    // Don't reset if brand matches URL (it was set from URL)
    const urlBrandA = searchParams.get("brandA");
    if (urlBrandA === brandA) return;

    // Reset only if user manually changed brand (not from URL restoration)
    const isManualChange = brandA !== "" && urlBrandA !== brandA;

    if (isManualChange && valueA !== "") {
      setValueA("");
      setThicknessA("");
      setThicknessAOptions([]);
      setInfoA("");
      setChartData(null);
    }
  }, [brandA, searchParams, valueA]);

  // Reset branch B when brandB changes (but not during URL restoration)
  useEffect(() => {
    // Don't reset if we're actively initializing from URL
    if (isInitializedFromURL.current) return;

    // Don't reset if brand matches URL (it was set from URL)
    const urlBrandB = searchParams.get("brandB");
    if (urlBrandB === brandB) return;

    // Reset only if user manually changed brand (not from URL restoration)
    const isManualChange = brandB !== "" && urlBrandB !== brandB;

    if (isManualChange && valueB !== "") {
      setValueB("");
      setThicknessB("");
      setThicknessBOptions([]);
      setInfoB("");
      setChartData(null);
    }
  }, [brandB, searchParams, valueB]);

  // Load models for brandA
  useEffect(() => {
    if (!brandA) {
      setListA([]);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${getApiUrl()}/vibro/models/${brandA}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
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
        const res = await fetch(`${getApiUrl()}/vibro/models/${brandB}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
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
        setError(""); //localhost:3005  dev3.constrtodo.ru:3005
        const res = await fetch(`${getApiUrl()}/api/v2/material/list/vibro`, {
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

  // Load thickness options for valueA
  useEffect(() => {
    // Don't reset thickness if we're restoring from URL
    if (!hasInitializedFromURL.current) {
      setThicknessA("");
    }
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
    // Don't reset thickness if we're restoring from URL
    if (!hasInitializedFromURL.current) {
      setThicknessB("");
    }
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
          `${getApiUrl()}/vibro/material/model/${valueA}/thickness/${thickness}`,
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
          `${getApiUrl()}/vibro/material/model/${valueB}/thickness/${thickness}`,
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

    // Преобразуем коды в фактические значения толщины
    const actualThicknessA = thicknessAOptions.find(
      (item) => item.code === thicknessA
    )?.thickness || thicknessA;
    
    const actualThicknessB = thicknessBOptions.find(
      (item) => item.code === thicknessB
    )?.thickness || thicknessB;

    const controller = new AbortController();
    (async () => {
      try {
        // явно скрыть предыдущий график, пока грузится новый
        setChartData(null);
        const res = await fetch(`${getApiUrl()}/vibro/graph`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify([
            { model_code: valueA, thickness: actualThicknessA },
            { model_code: valueB, thickness: actualThicknessB },
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
  }, [valueA, valueB, thicknessA, thicknessB, thicknessAOptions, thicknessBOptions]);

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
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              role="button"
              src={ICON_URL}
              alt="Копировать ссылку"
              width={40}
              height={40}
              onClick={handleCopyUrl}
              style={{
                cursor: "pointer",
                transition: "opacity 0.2s, transform 0.3s ease-in-out",
                transform: isClicked ? "scale(1.15)" : "scale(1)",
                opacity: 1,
                boxShadow: "#a8aaae 0px 0px 8px 3px",
                padding: 5,
                borderRadius: 10,
              }}
              onMouseEnter={(e) => {
                if (!isClicked) {
                  e.currentTarget.style.opacity = "1";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.7";
              }}
            />
          </div>
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
