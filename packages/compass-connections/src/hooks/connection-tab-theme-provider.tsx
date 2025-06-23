import React, { useMemo } from 'react';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useConnectionColor } from '@mongodb-js/connection-form';
import {
  palette,
  useDarkMode,
  TabThemeProvider,
} from '@mongodb-js/compass-components';
import { useConnectionsColorList } from '../stores/store-context';

export const ConnectionThemeProvider: React.FunctionComponent<{
  children: React.ReactNode;
  connectionId?: ConnectionInfo['id'];
}> = ({ children, connectionId }) => {
  const { connectionColorToHex, connectionColorToHexActive } =
    useConnectionColor();
  const connectionColorsList = useConnectionsColorList();
  const darkMode = useDarkMode();

  const theme = useMemo(() => {
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
      '--workspace-tab-border-color': darkMode
        ? palette.gray.dark2
        : palette.gray.light2,
      '--workspace-tab-color': darkMode
        ? palette.gray.base
        : palette.gray.dark1,
      '--workspace-tab-selected-background-color': darkMode
        ? palette.black
        : palette.white,
      '--workspace-tab-selected-top-border-color': activeBgColor,
      '--workspace-tab-selected-color': darkMode
        ? palette.white
        : palette.gray.dark3,
      '&:focus-visible': {
        '--workspace-tab-border-color': darkMode
          ? palette.blue.light1
          : palette.blue.base,
        '--workspace-tab-selected-color': darkMode
          ? palette.blue.light1
          : palette.blue.base,
      },
    };
  }, [
    connectionId,
    connectionColorsList,
    connectionColorToHex,
    connectionColorToHexActive,
    darkMode,
  ]);

  return <TabThemeProvider theme={theme}>{children}</TabThemeProvider>;
};
