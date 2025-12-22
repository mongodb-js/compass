import React, { useCallback } from 'react';
import {
  Icon,
  spacing,
  css,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  usePreference,
  usePreferencesContext,
} from 'compass-preferences-model/provider';

const toolToggleButtonStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  fontSize: '13px',
  fontWeight: 500,
  borderRadius: '6px',
  border: '1px solid',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  background: 'none',
  outline: 'none',
  whiteSpace: 'nowrap',

  '&:focus-visible': {
    boxShadow: `0 0 0 3px ${palette.blue.light2}`,
  },
});

const enabledLightStyles = css({
  borderColor: palette.green.dark1,
  color: palette.green.dark2,

  '&:hover': {
    backgroundColor: palette.green.light3,
  },
});

const enabledDarkStyles = css({
  borderColor: palette.green.base,
  color: palette.green.light1,

  '&:hover': {
    backgroundColor: 'rgba(19, 170, 82, 0.15)',
  },
});

const disabledLightStyles = css({
  borderColor: palette.gray.base,
  color: palette.gray.dark2,

  '&:hover': {
    backgroundColor: palette.gray.light2,
  },
});

const disabledDarkStyles = css({
  borderColor: palette.gray.base,
  color: palette.gray.light1,

  '&:hover': {
    backgroundColor: palette.gray.dark2,
  },
});

/** This is a temporary placeholder component for the tool toggle.
 *  It will be replaced with the Leafygreen equivalent.
 */
export const ToolToggle: React.FunctionComponent = () => {
  const enableToolCalling = usePreference('enableGenAIDatabaseToolCalling');
  const preferences = usePreferencesContext();
  const darkMode = useDarkMode();

  const handleToggle = useCallback(() => {
    void preferences.savePreferences({
      enableGenAIDatabaseToolCalling: !enableToolCalling,
    });
  }, [enableToolCalling, preferences]);

  const getStyles = () => {
    if (enableToolCalling) {
      return darkMode ? enabledDarkStyles : enabledLightStyles;
    }
    return darkMode ? disabledDarkStyles : disabledLightStyles;
  };

  return (
    <button
      data-testid="tool-toggle-button"
      className={`${toolToggleButtonStyles} ${getStyles()}`}
      onClick={handleToggle}
      type="button"
      aria-label={
        enableToolCalling
          ? 'Disable database tool calling'
          : 'Enable database tool calling'
      }
      aria-pressed={enableToolCalling}
    >
      <Icon
        glyph="LightningBolt"
        size="small"
        style={{
          color: enableToolCalling
            ? darkMode
              ? palette.green.light1
              : palette.green.dark2
            : darkMode
            ? palette.gray.light1
            : palette.gray.dark2,
        }}
      />
      Tools
    </button>
  );
};
