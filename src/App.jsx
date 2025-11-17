import { useEffect, useState } from "react";
import { Outlet, NavLink, useSearchParams } from "react-router-dom";
import { useTheme } from "./hooks/useTheme";
import "./App.css";

export default function App() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localTheme, setLocalTheme] = useState(theme);

  // Sync local theme with hook theme
  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  // Manual theme toggle function
  const toggleTheme = () => {
    const newTheme = localTheme === 'dark' ? 'light' : 'dark';
    setLocalTheme(newTheme);
    
    // Update URL parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set('theme', newTheme);
    setSearchParams(newParams, { replace: true });
    
    // Also update through theme manager if available
    if (window.__setIframeTheme) {
      window.__setIframeTheme(newTheme);
    }
  };

  // Set CSS variable for table background color based on theme
  useEffect(() => {
    const currentTheme = localTheme || theme;
    const tableBgColor = currentTheme === 'dark' ? '#373737' : '#EBEBEB';
    document.documentElement.style.setProperty('--table-bg-color', tableBgColor);
    
    // Apply directly to all existing tables
    const applyTableStyles = () => {
      const tables = document.querySelectorAll('table');
      let appliedCount = 0;
      tables.forEach(table => {
        const currentBg = window.getComputedStyle(table).backgroundColor;
        table.style.setProperty('background-color', tableBgColor, 'important');
        appliedCount++;
      });
      if (appliedCount > 0) {
        console.log('Applied table styles:', appliedCount, 'tables, color:', tableBgColor);
      }
    };
    
    // Apply immediately
    applyTableStyles();
    
    // Also apply after a short delay to catch dynamically rendered tables
    const timeoutId = setTimeout(() => {
      applyTableStyles();
    }, 100);
    
    // Watch for new tables being added (e.g., from Markdown rendering)
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'TABLE' || node.querySelector?.('table')) {
              shouldApply = true;
            }
          }
        });
      });
      if (shouldApply) {
        // Small delay to ensure styles are applied after rendering
        setTimeout(applyTableStyles, 50);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('Theme updated:', currentTheme, 'Table BG:', tableBgColor, 'Tables found:', document.querySelectorAll('table').length);
    
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [localTheme, theme]);

  return (
    <div className="app">
      {/* <header className="app__header">
        <NavLink
          to="/vibro"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link--active" : "nav-link"
          }
        >
          <small className="badge">VC</small> сравнение виброизоляционных
          материалов
        </NavLink>
      </header> */}

      {/* Theme toggle button */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: localTheme === 'dark' ? '#373737' : '#EBEBEB',
        border: `2px solid ${localTheme === 'dark' ? '#EBEBEB' : '#373737'}`,
        borderRadius: '8px',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '12px',
        color: localTheme === 'dark' ? '#EBEBEB' : '#373737',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }} onClick={toggleTheme} title="Переключить тему">
        {localTheme === 'dark' ? '☀️' : '🌙'} {localTheme === 'dark' ? 'Светлая' : 'Темная'}
      </div>

      <main className="app__main">
        <Outlet />
      </main>

      <footer className="app__footer">
        <small>dBase© VibroCompare | </small>
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
      </footer>
    </div>
  );
}
