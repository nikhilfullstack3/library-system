import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "library-app-theme";
const ThemeContext = createContext(null);

function getStoredTheme() {
  if (typeof window === "undefined") {
    return "default";
  }

  return window.localStorage.getItem(THEME_STORAGE_KEY) || "default";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.body.classList.toggle("theme-midnight-jelly", theme === "midnight-jelly");
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isMidnightJelly: theme === "midnight-jelly",
      toggleMidnightJelly: () =>
        setTheme((current) => (current === "midnight-jelly" ? "default" : "midnight-jelly")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
