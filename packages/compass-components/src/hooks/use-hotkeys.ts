import { useMemo } from 'react';
import { useHotkeys as useGlobalHotkeys } from 'react-hotkeys-hook';

const isMac = () => navigator.userAgent.indexOf('Mac') !== -1;

/**
 *
 * Modifier | macOS       | Windows/Linux
 * -------- | ----------- | -------------
 * ctrl     | control     | ctrl
 * shift    | shift       | shift
 * alt      | option      | alt
 * meta     | command     | ctrl
 *
 */
export const useHotkeys = (...args: Parameters<typeof useGlobalHotkeys>) => {
  const [key] = args;
  const ref = useGlobalHotkeys(...args);

  const shortcut = useMemo(() => {
    if (Array.isArray(key)) {
      return key.map(mapKeyToShortcut);
    }
    return mapKeyToShortcut(key);
  }, [key]);

  return {
    shortcut,
    ref,
  };
};

const mapKeyToShortcut = (key: string) => {
  if (isMac()) {
    return key.replace('meta', '⌘').replace('alt', 'option');
  }
  return key.replace('meta', 'ctrl');
};
