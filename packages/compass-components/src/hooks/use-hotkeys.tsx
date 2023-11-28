import React from 'react';
import { useHotkeys as useGlobalHotkeys } from 'react-hotkeys-hook';
import { InlineKeyCode } from '../components/leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@leafygreen-ui/emotion';

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
 * Modifier | macOS     | Windows | Linux
 * -------- | --------- | ------- | -------
 * ctrl     | control   | ctrl    | ctrl
 * shift    | shift     | shift   | shift
 * alt      | option    | alt     | alt
 * meta     | command   | windows | meta
 * mod      | command   | ctrl    | ctrl
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

export const formatHotkey = (key: string) => {
  let shortcut = key.toLowerCase();
  // map the modifier keys to the platform specific keys
  shortcut = isMac()
    ? shortcut
        .replace(/\bmeta\b/, '⌘')
        .replace(/\balt\b/, 'option')
        .replace(/\bmod\b/, '⌘')
    : shortcut.replace(/\bmod\b/, 'ctrl');

  return shortcut
    .replace(/\+/g, ' + ') // Add space on both sides of each '+'
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace('arrowup', '↑')
    .replace('arrowdown', '↓')
    .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize the first letter of each word
    .trim();
};

export const KeyboardShortcut = ({ hotkey }: { hotkey: string }) => {
  const key = formatHotkey(hotkey);
  return (
    <span className={shortcutContainerStyles}>
      {key.split('+').map((x) => (
        <InlineKeyCode key={x}>{x.trim()}</InlineKeyCode>
      ))}
    </span>
  );
};
