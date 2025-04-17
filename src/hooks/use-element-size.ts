import { useEffect, useState, RefObject, useLayoutEffect } from 'react';

export function useElementSize(element: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const useEnvironmentEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useEnvironmentEffect(() => {
    if (!element.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(element.current);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return {
    width: size.width,
    height: size.height,
  };
}
