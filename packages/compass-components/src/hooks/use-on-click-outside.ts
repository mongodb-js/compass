import { useEffect } from 'react';

export function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  handler: (event: Event) => void
) {
  useEffect(() => {
    const clickEventListener = (event: MouseEvent | TouchEvent) => {
      // Ignore clicks on the ref.
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', clickEventListener);
    document.addEventListener('touchstart', clickEventListener);
    return () => {
      document.removeEventListener('mousedown', clickEventListener);
      document.removeEventListener('touchstart', clickEventListener);
    };
  }, [ref, handler]);
}
