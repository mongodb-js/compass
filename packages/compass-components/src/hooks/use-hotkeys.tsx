import React from 'react';
import { useHotkeys as useGlobalHotkeys } from 'react-hotkeys-hook';

const isMac = () => navigator.userAgent.indexOf('Mac') !== -1;

type GlobalHotkeysArgs = Parameters<typeof useGlobalHotkeys>;

/**
 *
 * The modifier keys are interpreted differently on macOS and Windows/Linux.
 * useGlobalHotkeys hook normalizes the modifier keys so that they are interpreted on both platforms as follows:
 *
 * Modifier | macOS       | Windows/Linux
 * -------- | ----------- | -------------
 * ctrl     | control     | ctrl
 * shift    | shift       | shift
 * alt      | option      | alt
 * meta     | command     | ctrl
 *
 */
export const useHotkeys = (
  shortcut: string,
  callback: GlobalHotkeysArgs[1],
  options?: GlobalHotkeysArgs[2],
  deps?: GlobalHotkeysArgs[3]
) => {
  const ref = useGlobalHotkeys(shortcut, callback, options, deps);
  return {
    shortcut,
    ref,
  };
};

// exported for testing
export const mapKeyToShortcut = (key: string) => {
  // map the modifier keys to the platform specific keys
  const shortcut = isMac()
    ? key.replace(/\bmeta\b/, '⌘').replace(/\balt\b/, 'option')
    : key.replace(/\bmeta\b/, 'ctrl');
  // normalize the shortcut and add spaces between + signs
  return shortcut
    .replace(/\+/g, ' + ') // Add space on both sides of each '+'
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim();
};

export const Hotkey = ({ shortcut }: { shortcut: string }) => {
  return <>{mapKeyToShortcut(shortcut)}</>;
};
