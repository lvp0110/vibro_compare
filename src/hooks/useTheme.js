import { useState, useEffect } from 'react';

/**
 * Hook to detect theme from parent application when used in iframe
 * Supports multiple detection methods:
 * 1. PostMessage from parent (if parent sends theme messages)
 * 2. Parent window background color detection
 * 3. System preference as fallback
 */
export function useTheme() {
  const [theme, setTheme] = useState('dark'); // default to dark

  useEffect(() => {
    // Method 1: Listen for PostMessage from parent
    const handleMessage = (event) => {
      // Accept messages from any origin (you can restrict this if needed)
      if (event.data && typeof event.data === 'object') {
        if (event.data.theme === 'dark' || event.data.theme === 'light') {
          setTheme(event.data.theme);
        }
      } else if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.theme === 'dark' || data.theme === 'light') {
            setTheme(data.theme);
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Method 2: Try to detect parent window background color
    let themeDetected = false;
    try {
      // Check if we're in an iframe
      if (window.self !== window.top) {
        try {
          // Try to access parent window (may fail due to CORS)
          const parentDoc = window.parent.document;
          const parentBody = parentDoc.body;
          const computedStyle = window.parent.getComputedStyle(parentBody);
          const bgColor = computedStyle.backgroundColor;
          
          // Convert RGB to hex and determine if it's dark or light
          if (bgColor) {
            const rgb = bgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              // Calculate luminance
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              // If luminance is less than 0.5, it's dark
              setTheme(luminance < 0.5 ? 'dark' : 'light');
              themeDetected = true;
            }
          }
        } catch (e) {
          // CORS or other error, fall through to next method
        }
      }
    } catch (e) {
      // Error accessing parent, fall through
    }

    // Method 3: Use system preference as fallback
    let mediaQuery = null;
    let handleSystemThemeChange = null;
    
    if (!themeDetected) {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setTheme(mediaQuery.matches ? 'dark' : 'light');

      // Listen for system theme changes
      handleSystemThemeChange = (e) => {
        setTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    // Request theme from parent if possible
    try {
      if (window.self !== window.top) {
        // Try to request theme from parent
        window.parent.postMessage({ type: 'request-theme' }, '*');
      }
    } catch (e) {
      // Can't access parent, continue
    }

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (mediaQuery && handleSystemThemeChange) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, []);

  return theme;
}

