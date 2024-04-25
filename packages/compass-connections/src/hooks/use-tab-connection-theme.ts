import { ConnectionInfo } from '@mongodb-js/connection-info';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { useConnectionRepository } from './use-connection-repository';
import { useDarkMode, type TabTheme } from '@mongodb-js/compass-components';
import { palette } from '@leafygreen-ui/palette';
import { useCallback } from 'react';

type ThemeProvider = {
  getThemeOf(connectionId: ConnectionInfo['id']): TabTheme | undefined;
};

export function useTabConnectionTheme(): ThemeProvider {
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const { getConnectionInfoById } = useConnectionRepository();
  const darkTheme = useDarkMode();

  const getThemeOf = useCallback(
    (connectionId: ConnectionInfo['id']) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      const color = connectionInfo?.favorite?.color;
      const bgColor = connectionColorToHex(color);
      const activeBgColor = connectionColorToHexActive(color);

      if (!color || !bgColor || !activeBgColor) {
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
    ]
  );

  return {
    getThemeOf,
  };
}
