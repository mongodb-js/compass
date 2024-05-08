import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { useConnectionRepository } from '../provider';
import { useDarkMode, type TabTheme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { useCallback } from 'react';
import { usePreference } from 'compass-preferences-model/provider';

type ThemeProvider = {
  getThemeOf(
    this: void,
    connectionId: ConnectionInfo['id']
  ): TabTheme | undefined;
};

export function useTabConnectionTheme(): ThemeProvider {
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const { getConnectionInfoById } = useConnectionRepository();
  const darkTheme = useDarkMode();
  const isMultipleConnectionsEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const getThemeOf = useCallback(
    (connectionId: ConnectionInfo['id']) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      const color = connectionInfo?.favorite?.color;
      const bgColor = connectionColorToHex(color);
      const activeBgColor = connectionColorToHexActive(color);

      if (
        !color ||
        !bgColor ||
        !activeBgColor ||
        !isMultipleConnectionsEnabled
      ) {
        return;
      }

      return {
        '--workspace-tab-background-color': bgColor,
        '--workspace-tab-border-color': darkTheme
          ? palette.gray.dark2
          : palette.gray.light2,
        '--workspace-tab-color': darkTheme
          ? palette.gray.base
          : palette.gray.dark1,
        '--workspace-tab-selected-background-color': activeBgColor,
        '--workspace-tab-selected-color': darkTheme
          ? palette.gray.light2
          : palette.gray.dark2,
        '&:focus-visible': {
          '--workspace-tab-border-color': darkTheme
            ? palette.blue.light1
            : palette.blue.base,
          '--workspace-tab-selected-color': darkTheme
            ? palette.blue.light1
            : palette.blue.base,
        },
      };
    },
    [
      palette,
      getConnectionInfoById,
      connectionColorToHex,
      connectionColorToHexActive,
      darkTheme,
      isMultipleConnectionsEnabled,
    ]
  );

  return {
    getThemeOf,
  };
}
