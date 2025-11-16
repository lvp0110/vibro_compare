import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect theme from parent application when used in iframe
 * Supports multiple detection methods:
 * 1. PostMessage from parent (if parent sends theme messages)
 * 2. Parent window background color detection with continuous monitoring
 * 3. MutationObserver to watch for changes in parent window
 */
export function useTheme() {
  const [theme, setTheme] = useState('dark'); // default to dark
  const intervalRef = useRef(null);
  const observerRef = useRef(null);

  // Function to detect theme from parent window
  const detectThemeFromParent = () => {
    try {
      // Check if we're in an iframe
      if (window.self !== window.top) {
        try {
          const parentDoc = window.parent.document;
          const parentBody = parentDoc.body;
          const parentHtml = parentDoc.documentElement;

          // Method 1: Check for data-theme attribute or theme-related classes
          const bodyTheme = parentBody.getAttribute('data-theme') || 
                           parentBody.className.match(/(?:^|\s)(dark|light)(?:\s|$)/)?.[1];
          const htmlTheme = parentHtml.getAttribute('data-theme') || 
                           parentHtml.className.match(/(?:^|\s)(dark|light)(?:\s|$)/)?.[1];
          
          if (bodyTheme === 'dark' || bodyTheme === 'light') {
            setTheme(bodyTheme);
            return true;
          }
          if (htmlTheme === 'dark' || htmlTheme === 'light') {
            setTheme(htmlTheme);
            return true;
          }

          // Method 2: Check background color of body
          const computedStyle = window.parent.getComputedStyle(parentBody);
          const bgColor = computedStyle.backgroundColor;
          
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const rgb = bgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              const detectedTheme = luminance < 0.5 ? 'dark' : 'light';
              setTheme(detectedTheme);
              return true;
            }
          }
          
          // Method 3: Check html element background color
          const htmlComputedStyle = window.parent.getComputedStyle(parentHtml);
          const htmlBgColor = htmlComputedStyle.backgroundColor;
          
          if (htmlBgColor && htmlBgColor !== 'rgba(0, 0, 0, 0)' && htmlBgColor !== 'transparent') {
            const rgb = htmlBgColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0]);
              const g = parseInt(rgb[1]);
              const b = parseInt(rgb[2]);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              const detectedTheme = luminance < 0.5 ? 'dark' : 'light';
              setTheme(detectedTheme);
              return true;
            }
          }
        } catch (e) {
          // CORS or other error, return false
          return false;
        }
      }
    } catch (e) {
      // Error accessing parent
      return false;
    }
    return false;
  };

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

    // Initial theme detection
    detectThemeFromParent();

    // Method 2: Set up MutationObserver to watch for changes in parent window
    try {
      if (window.self !== window.top) {
        const parentDoc = window.parent.document;
        const parentBody = parentDoc.body;
        const parentHtml = parentDoc.documentElement;

        // Create observer to watch for attribute/class changes
        observerRef.current = new MutationObserver(() => {
          detectThemeFromParent();
        });

        // Observe changes to body and html elements
        if (parentBody) {
          observerRef.current.observe(parentBody, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme'],
            childList: false,
            subtree: false
          });
        }
        if (parentHtml) {
          observerRef.current.observe(parentHtml, {
            attributes: true,
            attributeFilter: ['class', 'style', 'data-theme'],
            childList: false,
            subtree: false
          });
        }
      }
    } catch (e) {
      // CORS or other error, fall back to polling
    }

    // Method 3: Poll parent window background color periodically
    // This ensures we catch theme changes even if MutationObserver doesn't work
    intervalRef.current = setInterval(() => {
      detectThemeFromParent();
    }, 500); // Check every 500ms

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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return theme;
}

