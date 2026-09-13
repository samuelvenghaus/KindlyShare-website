"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "kindlyshare-theme";
const CHANGE_EVENT = "kindlyshare-theme-change";

export type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

// Tijdens SSR/eerste hydratie is er geen localStorage - matcht het blokkerende scriptje in
// layout.tsx, dat "dark" laat staan tenzij er een opgeslagen "light"-voorkeur is.
function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f7f7f8" : "#0a0a0c");
}

/** Leest/schrijft de gekozen weergavemodus (licht/donker) via localStorage als externe bron
 * (useSyncExternalStore), zodat een wijziging ook meteen in deze tab een re-render triggert -
 * de native "storage"-event vuurt alleen in ANDERE tabs, dus voor dezelfde tab versturen we
 * een eigen event. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage kan geblokkeerd zijn (privénavigatie e.d.) - de voorkeur onthouden lukt
      // dan niet, maar de toggle blijft functioneren binnen de sessie.
    }
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
