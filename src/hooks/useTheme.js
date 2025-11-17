import { useState, useEffect, useRef } from 'react';

/**
 * Hook to detect theme from parent application when used in iframe
 * Due to CORS restrictions, only PostMessage API is used for cross-origin communication.
 * 
 * Parent application should send theme messages like:
 * - window.frames[0].postMessage({ theme: 'dark' }, '*')
 * - window.frames[0].postMessage({ theme: 'light' }, '*')
 * 
 * Or listen for theme requests and respond:
 * window.addEventListener('message', (event) => {
 *   if (event.data.type === 'request-theme') {
 *     const currentTheme = getCurrentTheme(); // your theme detection logic
 *     event.source.postMessage({ theme: currentTheme }, '*');
 *   }
 * });
 */
export function useTheme() {
  const [theme, setTheme] = useState('dark'); // default to dark
  const requestTimeoutRef = useRef(null);
  const hasReceivedThemeRef = useRef(false);

  // Request theme from parent application
  const requestThemeFromParent = () => {
    try {
      if (window.self !== window.top) {
        // Request theme from parent
        window.parent.postMessage({ type: 'request-theme' }, '*');
        // Only log first few requests to avoid console spam
        if (!hasReceivedThemeRef.current) {
          console.log('[Theme Detection] Requested theme from parent');
        }
      }
    } catch (e) {
      console.log('[Theme Detection] Error requesting theme:', e.message);
    }
  };

  useEffect(() => {
    // Listen for PostMessage from parent
    const handleMessage = (event) => {
      // Accept messages from any origin (you can restrict this if needed)
      if (event.data && typeof event.data === 'object') {
        if (event.data.theme === 'dark' || event.data.theme === 'light') {
          hasReceivedThemeRef.current = true;
          console.log('[Theme Detection] Received theme from parent:', event.data.theme);
          setTheme(prevTheme => {
            if (prevTheme !== event.data.theme) {
              console.log('[Theme Detection] Theme changed from', prevTheme, 'to', event.data.theme);
              return event.data.theme;
            }
            return prevTheme;
          });
        }
      } else if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.theme === 'dark' || data.theme === 'light') {
            hasReceivedThemeRef.current = true;
            console.log('[Theme Detection] Received theme from parent (string):', data.theme);
            setTheme(prevTheme => {
              if (prevTheme !== data.theme) {
                console.log('[Theme Detection] Theme changed from', prevTheme, 'to', data.theme);
                return data.theme;
              }
              return prevTheme;
            });
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Expose test function to window for manual testing
    // Usage in console: window.__setIframeTheme('dark') or window.__setIframeTheme('light')
    window.__setIframeTheme = (newTheme) => {
      if (newTheme === 'dark' || newTheme === 'light') {
        console.log('[Theme Detection] Manual theme set:', newTheme);
        hasReceivedThemeRef.current = true;
        setTheme(newTheme);
      } else {
        console.warn('[Theme Detection] Invalid theme. Use "dark" or "light"');
      }
    };

    // Request theme from parent on mount and periodically
    if (window.self !== window.top) {
      // Initial request
      requestThemeFromParent();
      
      // Show helpful message if no response after a delay
      setTimeout(() => {
        if (!hasReceivedThemeRef.current) {
          console.warn(
            '[Theme Detection] No theme received from parent. ' +
            'Please configure parent app to send theme messages. ' +
            'See IFRAME_THEME_INTEGRATION.md for instructions. ' +
            'For testing, use: window.__setIframeTheme("dark") or window.__setIframeTheme("light")'
          );
        }
      }, 3000);
      
      // Request periodically to catch theme changes
      // Interval is set to 5 seconds - parent app should respond quickly on first request
      requestTimeoutRef.current = setInterval(() => {
        requestThemeFromParent();
      }, 5000); // Request every 5 seconds
    }

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (requestTimeoutRef.current) {
        clearInterval(requestTimeoutRef.current);
      }
      delete window.__setIframeTheme;
    };
  }, []);

  return theme;
}

