import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
}

const ToastContext = createContext<{ toast: (message: string) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string) => {
    idRef.current += 1;
    const id = idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 px-4 w-full max-w-md"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="flex w-auto max-w-full items-center gap-2 rounded-full border border-line bg-white/95 px-4 py-2.5 text-sm font-bold text-ink shadow-lift backdrop-blur"
          >
            <CheckCircle2 size={16} className="shrink-0 text-brand-green" aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
