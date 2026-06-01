"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "easy-read-fonts";

type EasyReadContextValue = {
  easyRead: boolean;
  toggleEasyRead: () => void;
};

const EasyReadContext = createContext<EasyReadContextValue | null>(null);

function applyEasyReadClass(enabled: boolean) {
  document.documentElement.classList.toggle("easy-read", enabled);
}

export function EasyReadProvider({ children }: { children: React.ReactNode }) {
  const [easyRead, setEasyRead] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "true";
    setEasyRead(stored);
    applyEasyReadClass(stored);
  }, []);

  const toggleEasyRead = useCallback(() => {
    setEasyRead((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      applyEasyReadClass(next);
      return next;
    });
  }, []);

  return (
    <EasyReadContext.Provider value={{ easyRead, toggleEasyRead }}>
      {children}
    </EasyReadContext.Provider>
  );
}

export function useEasyRead() {
  const ctx = useContext(EasyReadContext);
  if (!ctx) {
    throw new Error("useEasyRead must be used within EasyReadProvider");
  }
  return ctx;
}
