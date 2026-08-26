import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TextInput,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
  useHotkeys,
} from '@mongodb-js/compass-components';
import { useApplicationMenu } from '@mongodb-js/compass-electron-menu';
import { usePreference } from 'compass-preferences-model/provider';

const backdropStyles = css({
  position: 'fixed',
  inset: 0,
  zIndex: 5,
  margin: 0,
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'default',
});

const paletteStyles = css({
  position: 'fixed',
  zIndex: 6,
  top: spacing[600],
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'min(560px, calc(100vw - 32px))',
  borderRadius: spacing[200],
  border: `1px solid ${palette.gray.light2}`,
  boxShadow: `0px 4px 16px ${palette.black}33`,
  overflow: 'hidden',
});

const paletteLightStyles = css({
  backgroundColor: palette.white,
  borderColor: palette.gray.light2,
});

const paletteDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  borderColor: palette.gray.dark1,
});

const searchStyles = css({
  padding: spacing[300],
});

const resultsStyles = css({
  minHeight: spacing[800],
  borderTop: `1px solid ${palette.gray.light2}`,
});

const resultsDarkStyles = css({
  borderTopColor: palette.gray.dark1,
});

type GoToPaletteProps = {
  onClose: () => void;
};

function GoToPalette({ onClose }: GoToPaletteProps) {
  const darkMode = useDarkMode();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useHotkeys('esc', onClose, { enableOnFormTags: ['INPUT'] });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss Go to"
        data-testid="go-to-backdrop"
        className={backdropStyles}
        onClick={onClose}
      />
      <div
        data-testid="go-to-palette"
        role="dialog"
        aria-label="Go to"
        className={cx(
          paletteStyles,
          darkMode ? paletteDarkStyles : paletteLightStyles
        )}
      >
        <div className={searchStyles}>
          <TextInput
            ref={inputRef}
            aria-label="Search connections"
            placeholder="Search connections"
          />
        </div>
        <div
          data-testid="go-to-results"
          className={cx(resultsStyles, darkMode && resultsDarkStyles)}
        />
      </div>
    </>
  );
}

type ToggleSource = 'hotkey' | 'menu';

export function CompassGoTo() {
  const enableGoTo = usePreference('enableGoTo');
  const [isOpen, setIsOpen] = useState(false);
  // Menu accelerator and renderer hotkeys can both fire for one keypress.
  // Allow the same source to re-fire; ignore a second source within 100ms.
  const lastToggleRef = useRef<{ source: ToggleSource | null; at: number }>({
    source: null,
    at: -1,
  });

  const toggleFrom = useCallback((source: ToggleSource) => {
    const now = Date.now();
    const { source: lastSource, at: lastAt } = lastToggleRef.current;
    if (lastSource !== source && lastSource !== null && now - lastAt < 100) {
      return;
    }
    lastToggleRef.current = { source, at: now };
    setIsOpen((open) => !open);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleFromMenu = useCallback(() => {
    toggleFrom('menu');
  }, [toggleFrom]);

  useHotkeys(
    'mod+p',
    (event) => {
      event.preventDefault();
      toggleFrom('hotkey');
    },
    {
      enabled: !!enableGoTo,
      enableOnFormTags: true,
    },
    [enableGoTo, toggleFrom]
  );

  useApplicationMenu({
    menu: enableGoTo
      ? {
          label: '&File',
          submenu: [
            {
              label: 'Go to…',
              accelerator: 'CmdOrCtrl+P',
              click: toggleFromMenu,
            },
          ],
        }
      : undefined,
  });

  if (!enableGoTo || !isOpen) {
    return null;
  }

  return <GoToPalette onClose={close} />;
}
