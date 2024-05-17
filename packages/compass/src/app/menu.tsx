/* eslint-disable jsx-a11y/aria-role */
import React from 'react';
import {
  ElectronMenuItem,
  ElectronSubMenu,
} from '@mongodb-js/react-electron-menu';

function Menu({
  appName,
  onNewWindowClick,
}: {
  appName: string;
  onNewWindowClick(): void;
}) {
  return (
    <>
      {/* MacOS-only Compass sub menu */}
      {process.platform === 'darwin' && (
        <ElectronSubMenu label={appName}>
          <ElectronMenuItem
            label={`About ${appName}`}
            role="about"
          ></ElectronMenuItem>
        </ElectronSubMenu>
      )}
      <ElectronSubMenu label="&Connect">
        <ElectronMenuItem
          label="New &Window"
          accelerator="CmdOrCtrl+N"
          onClick={onNewWindowClick}
        ></ElectronMenuItem>
      </ElectronSubMenu>
      <ElectronSubMenu label="Edit">
        <ElectronMenuItem
          label="Undo"
          accelerator="Command+Z"
          role="undo"
        ></ElectronMenuItem>
      </ElectronSubMenu>
      <ElectronSubMenu label="&View">
        <ElectronMenuItem
          label="&Reload"
          accelerator="CmdOrCtrl+Shift+R"
          role="reload"
        ></ElectronMenuItem>
        <ElectronMenuItem
          label="&Toggle DevTools"
          accelerator="Alt+CmdOrCtrl+I"
          role="toggleDevTools"
        ></ElectronMenuItem>
      </ElectronSubMenu>
    </>
  );
}

export default Menu;
