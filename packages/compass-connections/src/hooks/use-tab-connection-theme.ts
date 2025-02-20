import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { useDarkMode, type TabTheme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { useCallback } from 'react';
import { useConnectionsColorList } from '../stores/store-context';

type ThemeProvider = {
  getThemeOf(
    this: void,
    connectionId: ConnectionInfo['id']
  ): Partial<TabTheme> | undefined;
};

export function useTabConnectionTheme(): ThemeProvider {
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const connectionColorsList = useConnectionsColorList();
  const darkTheme = useDarkMode();

  const getThemeOf = useCallback(
    (connectionId: ConnectionInfo['id']) => {
      const color = connectionColorsList.find((connection) => {
        return connection.id === connectionId;
      })?.color;
      const bgColor = connectionColorToHex(color);
      const activeBgColor = connectionColorToHexActive(color);

      if (!color || !bgColor || !activeBgColor) {
        return;
      }

      return {
        '--workspace-tab-background-color': bgColor,
        '--workspace-tab-top-border-color': bgColor,
        '--workspace-tab-border-color': darkTheme
          ? palette.gray.dark2
          : palette.gray.light2,
        '--workspace-tab-color': darkTheme
          ? palette.gray.base
          : palette.gray.dark1,
        '--workspace-tab-selected-background-color': darkTheme
          ? palette.black
          : palette.white,
        '--workspace-tab-selected-top-border-color': activeBgColor,
        '--workspace-tab-selected-color': darkTheme
          ? palette.white
          : palette.gray.dark3,
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
      connectionColorsList,
      connectionColorToHex,
      connectionColorToHexActive,
      darkTheme,
    ]
  );

  return {
    getThemeOf,
  };
}
