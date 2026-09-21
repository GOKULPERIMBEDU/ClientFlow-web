import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "clientflow.welcomeSeen.v3";

interface GuideContextValue {
  open: boolean;
  openGuide: () => void;
  closeGuide: (persist?: boolean) => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

export function GuideProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== "1";
    } catch {
      return true;
    }
  });

  const openGuide = useCallback(() => setOpen(true), []);

  const closeGuide = useCallback((persist = true) => {
    if (persist) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore private-mode quota errors
      }
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeGuide(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, closeGuide]);

  const value = useMemo(() => ({ open, openGuide, closeGuide }), [open, openGuide, closeGuide]);

  return <GuideContext.Provider value={value}>{children}</GuideContext.Provider>;
}

export function useGuide() {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error("useGuide must be used within GuideProvider");
  }
  return context;
}
