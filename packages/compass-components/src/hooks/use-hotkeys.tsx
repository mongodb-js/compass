import React from 'react';
import { useHotkeys as useGlobalHotkeys } from 'react-hotkeys-hook';
import { InlineKeyCode, css, spacing } from '../';

const shortcutContainerStyles = css({
  display: 'flex',
  gap: spacing[1],
});

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
  key: string,
  callback: GlobalHotkeysArgs[1],
  options?: GlobalHotkeysArgs[2],
  deps?: GlobalHotkeysArgs[3]
) => {
  return useGlobalHotkeys(key, callback, options, deps);
};

export const mapHotkeyToShortcut = (key: string) => {
  // map the modifier keys to the platform specific keys
  const shortcut = isMac()
    ? key.replace(/\bmeta\b/, '⌘').replace(/\balt\b/, 'option')
    : key.replace(/\bmeta\b/, 'ctrl');
  // normalize the shortcut and add spaces between + signs
  return shortcut
    .replace(/\+/g, ' + ') // Add space on both sides of each '+'
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .trim();
};

export const KeyboardShortcut = ({ hotkey }: { hotkey: string }) => {
  const key = mapHotkeyToShortcut(hotkey);
  return (
    <span className={shortcutContainerStyles}>
      {key.split('+').map((x) => (
        <InlineKeyCode key={x}>{x.trim()}</InlineKeyCode>
      ))}
    </span>
  );
};
