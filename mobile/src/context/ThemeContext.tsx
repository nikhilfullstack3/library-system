import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_KEY = "library-app-theme";

interface ThemeContextValue {
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleDark: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((v) => { if (v === "dark") setIsDark(true); })
      .catch(() => {});
  }, []);

  const value = useMemo(
    () => ({
      isDark,
      toggleDark: () =>
        setIsDark((prev) => {
          const next = !prev;
          AsyncStorage.setItem(THEME_KEY, next ? "dark" : "light").catch(() => {});
          return next;
        }),
    }),
    [isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
