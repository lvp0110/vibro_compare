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
  const [brands, setBrands] = useState([]);

  const [brandA, setBrandA] = useState(searchParams.get("brandA") || "");
  const [brandB, setBrandB] = useState(searchParams.get("brandB") || "");

  const [valueA, setValueA] = useState(searchParams.get("valueA") || "");
  const [valueB, setValueB] = useState(searchParams.get("valueB") || "");

  const [thicknessA, setThicknessA] = useState(
    searchParams.get("thicknessA") || ""
  );
  const [thicknessB, setThicknessB] = useState(
    searchParams.get("thicknessB") || ""
  );

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Состояния для ручного ввода толщины
  const [showManualInputA, setShowManualInputA] = useState(false);
  const [showManualInputB, setShowManualInputB] = useState(false);
  const [manualThicknessA, setManualThicknessA] = useState("");
  const [manualThicknessB, setManualThicknessB] = useState("");
  const [isSubmittedA, setIsSubmittedA] = useState(false);
  const [isSubmittedB, setIsSubmittedB] = useState(false);

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
      // Сохраняем реальные значения толщины: если ручной ввод - сохраняем значение, иначе код
      if (thicknessA === "manual" && manualThicknessA.trim()) {
        params.set("thicknessA", manualThicknessA.trim());
      } else if (thicknessA && thicknessA !== "manual") {
        params.set("thicknessA", thicknessA);
      }
      if (thicknessB === "manual" && manualThicknessB.trim()) {
        params.set("thicknessB", manualThicknessB.trim());
      } else if (thicknessB && thicknessB !== "manual") {
        params.set("thicknessB", thicknessB);
      }

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
        // Сохраняем реальные значения толщины: если ручной ввод - сохраняем значение, иначе код
        if (thicknessA === "manual" && manualThicknessA.trim()) {
          params.set("thicknessA", manualThicknessA.trim());
        } else if (thicknessA && thicknessA !== "manual") {
          params.set("thicknessA", thicknessA);
        }
        if (thicknessB === "manual" && manualThicknessB.trim()) {
          params.set("thicknessB", manualThicknessB.trim());
        } else if (thicknessB && thicknessB !== "manual") {
          params.set("thicknessB", thicknessB);
        }

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

  // Sync state to URL params
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();
    if (brandA) params.set("brandA", brandA);
    if (brandB) params.set("brandB", brandB);
    if (valueA) params.set("valueA", valueA);
    if (valueB) params.set("valueB", valueB);
    // Сохраняем реальные значения толщины: если ручной ввод - сохраняем значение, иначе код
    if (thicknessA === "manual" && manualThicknessA.trim()) {
      params.set("thicknessA", manualThicknessA.trim());
    } else if (thicknessA && thicknessA !== "manual") {
      params.set("thicknessA", thicknessA);
    }
    if (thicknessB === "manual" && manualThicknessB.trim()) {
      params.set("thicknessB", manualThicknessB.trim());
    } else if (thicknessB && thicknessB !== "manual") {
      params.set("thicknessB", thicknessB);
    }

    setSearchParams(params, { replace: true });
  }, [
    brandA,
    brandB,
    valueA,
    valueB,
    thicknessA,
    thicknessB,
    manualThicknessA,
    manualThicknessB,
    isInitialized,
    setSearchParams,
  ]);

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
    setShowManualInputA(false);
    setManualThicknessA("");
    setIsSubmittedA(false);

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
    setShowManualInputB(false);
    setManualThicknessB("");
    setIsSubmittedB(false);

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
    setShowManualInputA(false);
    setManualThicknessA("");
    setIsSubmittedA(false);

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
    setShowManualInputB(false);
    setManualThicknessB("");
    setIsSubmittedB(false);

    const res = await fetch(getThicknessUrl(value), {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    setThicknessBOptions(json.data || []);
  };

  const handleThicknessA = async (value) => {
    if (value === "manual") {
      setShowManualInputA(true);
      setThicknessA("manual");
      setInfoA("");
      setIsSubmittedA(false);
      return;
    }

    setShowManualInputA(false);
    setManualThicknessA("");
    setIsSubmittedA(false);
    setThicknessA(value);
    setInfoA("");

    const thickness = thicknessAOptions.find(
      (item) => item.code === value
    )?.thickness;

    if (!thickness) return;

    try {
      const res = await fetch(
        `${getApiUrl()}/vibro/material/model/${valueA}/thickness/${thickness}`
      );

      if (!res.ok) {
        setInfoA("");
        return;
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        setInfoA("");
        return;
      }

      const json = JSON.parse(text);
      setInfoA(json.data || "");
    } catch (e) {
      console.error("Error fetching thickness info:", e);
      setInfoA("");
    }
  };

  const handleThicknessB = async (value) => {
    if (value === "manual") {
      setShowManualInputB(true);
      setThicknessB("manual");
      setInfoB("");
      setIsSubmittedB(false);
      return;
    }

    setShowManualInputB(false);
    setManualThicknessB("");
    setIsSubmittedB(false);
    setThicknessB(value);
    setInfoB("");

    const thickness = thicknessBOptions.find(
      (item) => item.code === value
    )?.thickness;

    if (!thickness) return;

    try {
      const res = await fetch(
        `${getApiUrl()}/vibro/material/model/${valueB}/thickness/${thickness}`
      );

      if (!res.ok) {
        setInfoB("");
        return;
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        setInfoB("");
        return;
      }

      const json = JSON.parse(text);
      setInfoB(json.data || "");
    } catch (e) {
      console.error("Error fetching thickness info:", e);
      setInfoB("");
    }
  };

  const handleManualThicknessSubmitA = async () => {
    if (!manualThicknessA.trim()) return;

    const thicknessValue = manualThicknessA.trim();
    // Сохраняем "manual" в thicknessA, чтобы пункт оставался выбранным
    setThicknessA("manual");
    // Не закрываем input
    // Отмечаем, что данные отправлены
    setIsSubmittedA(true);

    try {
      const res = await fetch(
        `${getApiUrl()}/vibro/material/model/${valueA}/thickness/${thicknessValue}`
      );

      if (!res.ok) {
        setInfoA("");
        return;
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        setInfoA("");
        return;
      }

      const json = JSON.parse(text);
      setInfoA(json.data || "");
    } catch (e) {
      console.error("Error fetching manual thickness info:", e);
      setInfoA("");
    }
  };

  const handleManualThicknessSubmitB = async () => {
    if (!manualThicknessB.trim()) return;

    const thicknessValue = manualThicknessB.trim();
    // Сохраняем "manual" в thicknessB, чтобы пункт оставался выбранным
    setThicknessB("manual");
    // Не закрываем input
    // Отмечаем, что данные отправлены
    setIsSubmittedB(true);

    try {
      const res = await fetch(
        `${getApiUrl()}/vibro/material/model/${valueB}/thickness/${thicknessValue}`
      );

      if (!res.ok) {
        setInfoB("");
        return;
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        setInfoB("");
        return;
      }

      const json = JSON.parse(text);
      setInfoB(json.data || "");
    } catch (e) {
      console.error("Error fetching manual thickness info:", e);
      setInfoB("");
    }
  };

  // Автоматическая загрузка данных при вводе толщины вручную для A
  useEffect(() => {
    if (!showManualInputA || !manualThicknessA.trim() || !valueA) {
      return;
    }

    // Debounce: ждем 500ms после последнего изменения
    const timeoutId = setTimeout(async () => {
      const thicknessValue = manualThicknessA.trim();
      
      try {
        const res = await fetch(
          `${getApiUrl()}/vibro/material/model/${valueA}/thickness/${thicknessValue}`
        );

        if (!res.ok) {
          setInfoA("");
          return;
        }

        const text = await res.text();
        if (!text || text.trim() === "") {
          setInfoA("");
          return;
        }

        const json = JSON.parse(text);
        setInfoA(json.data || "");
        setIsSubmittedA(true);
      } catch (e) {
        console.error("Error fetching manual thickness info:", e);
        setInfoA("");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [manualThicknessA, showManualInputA, valueA]);

  // Автоматическая загрузка данных при вводе толщины вручную для B
  useEffect(() => {
    if (!showManualInputB || !manualThicknessB.trim() || !valueB) {
      return;
    }

    // Debounce: ждем 500ms после последнего изменения
    const timeoutId = setTimeout(async () => {
      const thicknessValue = manualThicknessB.trim();
      
      try {
        const res = await fetch(
          `${getApiUrl()}/vibro/material/model/${valueB}/thickness/${thicknessValue}`
        );

        if (!res.ok) {
          setInfoB("");
          return;
        }

        const text = await res.text();
        if (!text || text.trim() === "") {
          setInfoB("");
          return;
        }

        const json = JSON.parse(text);
        setInfoB(json.data || "");
        setIsSubmittedB(true);
      } catch (e) {
        console.error("Error fetching manual thickness info:", e);
        setInfoB("");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [manualThicknessB, showManualInputB, valueB]);

  // Initialize from URL params
  useEffect(() => {
    if (brands.length === 0 || isInitialized) return;

    const initFromUrl = async () => {
      const urlBrandA = searchParams.get("brandA");
      const urlBrandB = searchParams.get("brandB");
      const urlValueA = searchParams.get("valueA");
      const urlValueB = searchParams.get("valueB");
      const urlThicknessA = searchParams.get("thicknessA");
      const urlThicknessB = searchParams.get("thicknessB");

      try {
        // Load data for A
        if (urlBrandA) {
          setBrandA(urlBrandA);
          const resA = await fetch(`${getApiUrl()}/vibro/models/${urlBrandA}`, {
            headers: { Accept: "application/json" },
          });
          const responseA = await resA.json();
          setListA(responseA.data || []);

          if (urlValueA) {
            setValueA(urlValueA);
            const resThicknessA = await fetch(getThicknessUrl(urlValueA), {
              headers: { Accept: "application/json" },
            });
            const jsonThicknessA = await resThicknessA.json();
            setThicknessAOptions(jsonThicknessA.data || []);

            if (urlThicknessA) {
              // Проверяем, является ли значение кодом из списка
              const thicknessOption = jsonThicknessA.data?.find(
                (item) => item.code === urlThicknessA
              );
              
              if (thicknessOption) {
                // Это код из списка
                setThicknessA(urlThicknessA);
                const resInfoA = await fetch(
                  `${getApiUrl()}/vibro/material/model/${urlValueA}/thickness/${thicknessOption.thickness}`
                );
                const jsonInfoA = await resInfoA.json();
                setInfoA(jsonInfoA.data || "");
              } else {
                // Это ручной ввод
                setThicknessA("manual");
                setShowManualInputA(true);
                setManualThicknessA(urlThicknessA);
                setIsSubmittedA(true);
                const resInfoA = await fetch(
                  `${getApiUrl()}/vibro/material/model/${urlValueA}/thickness/${urlThicknessA}`
                );
                if (resInfoA.ok) {
                  const text = await resInfoA.text();
                  if (text && text.trim() !== "") {
                    const jsonInfoA = JSON.parse(text);
                    setInfoA(jsonInfoA.data || "");
                  }
                }
              }
            }
          }
        }

        // Load data for B
        if (urlBrandB) {
          setBrandB(urlBrandB);
          const resB = await fetch(`${getApiUrl()}/vibro/models/${urlBrandB}`, {
            headers: { Accept: "application/json" },
          });
          const responseB = await resB.json();
          setListB(responseB.data || []);

          if (urlValueB) {
            setValueB(urlValueB);
            const resThicknessB = await fetch(getThicknessUrl(urlValueB), {
              headers: { Accept: "application/json" },
            });
            const jsonThicknessB = await resThicknessB.json();
            setThicknessBOptions(jsonThicknessB.data || []);

            if (urlThicknessB) {
              // Проверяем, является ли значение кодом из списка
              const thicknessOption = jsonThicknessB.data?.find(
                (item) => item.code === urlThicknessB
              );
              
              if (thicknessOption) {
                // Это код из списка
                setThicknessB(urlThicknessB);
                const resInfoB = await fetch(
                  `${getApiUrl()}/vibro/material/model/${urlValueB}/thickness/${thicknessOption.thickness}`
                );
                const jsonInfoB = await resInfoB.json();
                setInfoB(jsonInfoB.data || "");
              } else {
                // Это ручной ввод
                setThicknessB("manual");
                setShowManualInputB(true);
                setManualThicknessB(urlThicknessB);
                setIsSubmittedB(true);
                const resInfoB = await fetch(
                  `${getApiUrl()}/vibro/material/model/${urlValueB}/thickness/${urlThicknessB}`
                );
                if (resInfoB.ok) {
                  const text = await resInfoB.text();
                  if (text && text.trim() !== "") {
                    const jsonInfoB = JSON.parse(text);
                    setInfoB(jsonInfoB.data || "");
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Error initializing from URL:", e);
      } finally {
        setIsInitialized(true);
      }
    };

    initFromUrl();
  }, [brands, isInitialized, searchParams]);

  useEffect(() => {
    // Определяем реальные значения толщины (если "manual", используем введенное значение)
    // Если выбрана опция из списка, преобразуем код в фактическое значение толщины
    let actualThicknessA;
    if (thicknessA === "manual") {
      actualThicknessA = manualThicknessA;
    } else if (thicknessA) {
      const thicknessOption = thicknessAOptions.find(
        (item) => item.code === thicknessA
      );
      if (!thicknessOption) {
        // Если опция не найдена, не отправляем запрос
        setChartData(null);
        return;
      }
      actualThicknessA = thicknessOption.thickness;
    }

    let actualThicknessB;
    if (thicknessB === "manual") {
      actualThicknessB = manualThicknessB;
    } else if (thicknessB) {
      const thicknessOption = thicknessBOptions.find(
        (item) => item.code === thicknessB
      );
      if (!thicknessOption) {
        // Если опция не найдена, не отправляем запрос
        setChartData(null);
        return;
      }
      actualThicknessB = thicknessOption.thickness;
    }

    if (!(actualThicknessA && actualThicknessB)) {
      setChartData(null);
      return;
    }

    (async () => {
      try {
        // явно скрыть предыдущий график, пока грузится новый
        setChartData(null);

        // Преобразуем значения толщины в числа, если они числовые строки
        const thicknessValueA =
          actualThicknessA &&
          !isNaN(actualThicknessA) &&
          actualThicknessA !== ""
            ? Number(actualThicknessA)
            : actualThicknessA;
        const thicknessValueB =
          actualThicknessB &&
          !isNaN(actualThicknessB) &&
          actualThicknessB !== ""
            ? Number(actualThicknessB)
            : actualThicknessB;

        const requestBody = [
          { model_code: valueA, thickness: thicknessValueA },
          { model_code: valueB, thickness: thicknessValueB },
        ];

        console.log(
          "Sending request to /vibro/graph:",
          JSON.stringify(requestBody, null, 2)
        );

        const res = await fetch(`${getApiUrl()}/vibro/graph`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Server error response:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const text = await res.text();
        if (!text || text.trim() === "") {
          setChartData(null);
          return;
        }

        const json = JSON.parse(text);
        setChartData(json.data || null);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
        setChartData(null);
      }
    })();
  }, [
    thicknessA,
    thicknessB,
    manualThicknessA,
    manualThicknessB,
    valueA,
    valueB,
    thicknessAOptions,
    thicknessBOptions,
  ]);

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
                    disabled={!valueA}
                  >
                    <option value="">Толщина материала...</option>
                    {thicknessAOptions?.map((thickness) => (
                      <option key={thickness.code} value={thickness.code}>
                        {thickness.thickness}
                      </option>
                    ))}
                    <option value="manual">Ввести вручную</option>
                  </select>
                </label>
                {showManualInputA && (
                  <div className="vibro-manual-input-wrapper">
                    <input
                      type="text"
                      value={manualThicknessA}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        setManualThicknessA(value);
                        // Сбрасываем флаг отправки при изменении данных
                        setIsSubmittedA(false);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isSubmittedA &&
                          manualThicknessA.trim()
                        ) {
                          handleManualThicknessSubmitA();
                        }
                      }}
                      className="vibro-manual-input vibro-select"
                      placeholder="Введите толщину..."
                    />
                    <button
                      onClick={handleManualThicknessSubmitA}
                      className="vibro-manual-submit"
                      disabled={!manualThicknessA.trim() || isSubmittedA}
                    >
                      ✓
                    </button>
                  </div>
                )}
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
                    disabled={!valueB}
                  >
                    <option value="">Толщина материала...</option>
                    {thicknessBOptions?.map((thickness) => (
                      <option key={thickness.code} value={thickness.code}>
                        {thickness.thickness}
                      </option>
                    ))}
                    <option value="manual">Ввести вручную</option>
                  </select>
                </label>
                {showManualInputB && (
                  <div className="vibro-manual-input-wrapper">
                    <input
                      type="text"
                      value={manualThicknessB}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, "");
                        setManualThicknessB(value);
                        // Сбрасываем флаг отправки при изменении данных
                        setIsSubmittedB(false);
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isSubmittedB &&
                          manualThicknessB.trim()
                        ) {
                          handleManualThicknessSubmitB();
                        }
                      }}
                      className="vibro-manual-input vibro-select"
                      placeholder="Введите толщину..."
                    />
                    <button
                      onClick={handleManualThicknessSubmitB}
                      className="vibro-manual-submit"
                      disabled={!manualThicknessB.trim() || isSubmittedB}
                    >
                      ✓
                    </button>
                  </div>
                )}
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
            <hr />
              {chartData?.conclusion && (
                <Markdown style={{ marginTop: 8 }}>
                  {chartData.conclusion}
                </Markdown>
              )}
              <hr />
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
