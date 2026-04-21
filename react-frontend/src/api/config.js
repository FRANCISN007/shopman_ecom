const getBaseUrl = () => {
  // Always prefer runtime URL
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  // Fallback (SSR / tests only)
  return "http://localhost:8000";
};

export default getBaseUrl;
