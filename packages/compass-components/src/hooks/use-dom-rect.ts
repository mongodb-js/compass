import { useState, useRef, useLayoutEffect } from 'react';

export function useDOMRect<T extends HTMLElement = HTMLDivElement>(): [
  React.HTMLProps<T>,
  DOMRectReadOnly
] {
  const [rect, setRect] = useState<DOMRectReadOnly>(
    () => new DOMRectReadOnly()
  );
  const ref = useRef<T | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  if (observer.current === null) {
    observer.current = new ResizeObserver((entry) => {
      setRect(entry[0].contentRect);
    });
  }
  useLayoutEffect(() => {
    if (ref.current) {
      const el = ref.current;
      observer.current?.observe(ref.current);
      return () => {
        observer.current?.unobserve(el);
      };
    }
  }, []);
  return [{ ref }, rect];
}
