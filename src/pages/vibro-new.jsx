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
  const [brands, setBrands] = useState([]);

  const [items, setItems] = useState([]);

  const [brandA, setBrandA] = useState("");
  const [brandB, setBrandB] = useState("");

  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");

  const [thicknessA, setThicknessA] = useState("");
  const [thicknessB, setThicknessB] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [listA, setListA] = useState([]);
  const [listB, setListB] = useState([]);
  const [chartData, setChartData] = useState(null);

  // Thickness per selected model
  const [thicknessAOptions, setThicknessAOptions] = useState([]);
  const [thicknessBOptions, setThicknessBOptions] = useState([]);
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

  // Load reference items list (Sylomer)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(""); //localhost:3005  constrtodo.ru:3005
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
        // setItems(filtered);
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  const brandAName = brands.find((b) => b.Code === brandA)?.Name || "";
  const brandBName = brands.find((b) => b.Code === brandB)?.Name || "";

  const materialAName = listA.find((m) => m.Code === valueA)?.Name || "";
  const materialBName = listB.find((m) => m.Code === valueB)?.Name || "";

  const labelAFull = [brandAName, materialAName].filter(Boolean).join(" ");
  const labelBFull = [brandBName, materialBName].filter(Boolean).join(" ");

  const handleBrandA = async (value) => {
    setBrandA(value);
    setValueA("");
    setThicknessA("");
    setListA([]);
    setThicknessAOptions([]);
    setInfoA("");

    const res = await fetch(`${getApiUrl()}/vibro/models/${value}`, {
      headers: { Accept: "application/json" },
    });

    const response = await res.json();

    setListA(response.data || []);
  };

  const handleBrandB = async (value) => {
    setBrandB(value);
    setValueB("");
    setThicknessB("");
    setListB([]);
    setThicknessBOptions([]);
    setInfoB("");

    const res = await fetch(`${getApiUrl()}/vibro/models/${value}`, {
      headers: { Accept: "application/json" },
    });

    const response = await res.json();

    setListB(response.data || []);
  };

  const handleValueA = async (value) => {
    setValueA(value);
    setThicknessA("");
    setThicknessAOptions([]);
    setInfoA("");

    const res = await fetch(getThicknessUrl(value), {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    setThicknessAOptions(json.data || []);
  };

  const handleValueB = async (value) => {
    setValueB(value);
    setThicknessB("");
    setThicknessBOptions([]);
    setInfoB("");

    const res = await fetch(getThicknessUrl(value), {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    setThicknessBOptions(json.data || []);
  };

  const handleThicknessA = async (value) => {
    setThicknessA(value);
    setInfoA("");

    const thickness = thicknessAOptions.find(
      (item) => item.code === value
    )?.thickness;

    const res = await fetch(
      `${getApiUrl()}/vibro/material/model/${valueA}/thickness/${thickness}`
    );

    const json = await res.json();
    setInfoA(json.data || "");
  };

  const handleThicknessB = async (value) => {
    setThicknessB(value);
    setInfoB("");

    const thickness = thicknessBOptions.find(
      (item) => item.code === value
    )?.thickness;

    const res = await fetch(
      `${getApiUrl()}/vibro/material/model/${valueB}/thickness/${thickness}`
    );

    const json = await res.json();
    setInfoB(json.data || "");
  };

  useEffect(() => {
    if (!(thicknessA && thicknessB)) {
      setChartData(null);
      return;
    }

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
            { model_code: valueA, size_code: thicknessA },
            { model_code: valueB, size_code: thicknessB },
          ]),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setChartData(json.data || null);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    })();
  }, [thicknessA, thicknessB]);

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
                  onChange={(e) => handleBrandA(e.target.value)}
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
                    onChange={(e) => handleValueA(e.target.value)}
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
                    onChange={(e) => handleThicknessA(e.target.value)}
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
                  onChange={(e) => handleBrandB(e.target.value)}
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
                    onChange={(e) => handleValueB(e.target.value)}
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
                    onChange={(e) => handleThicknessB(e.target.value)}
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
