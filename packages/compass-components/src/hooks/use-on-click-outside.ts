import { useEffect } from 'react';

export function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  isEnabled: boolean,
  handler: (event: Event) => void,
) {
  useEffect(
    () => {
      if (!isEnabled) {
        return;
      }

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
    },
    [ref, handler, isEnabled]
  );
}
