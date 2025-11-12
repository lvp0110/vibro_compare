
// Get environment variables from window.__ENV__ (injected by server)
// or fallback to import.meta.env (Vite's build-time env variables)
export const getEnv = (key) => {
  if (typeof window !== "undefined" && window.__ENV__ && window.__ENV__[key]) {
    return window.__ENV__[key];
  }

  // Fallback to build-time env variables
  return import.meta.env[key];
};

// Helper function to get the API URL
export const getApiUrl = () => {
  return getEnv("VITE_API_URL");
};