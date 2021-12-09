import { shell, remote } from 'electron';
import COMPASS_ICON from '../main/icon';
import { ConnectionStorage } from 'mongodb-data-service';

async function showExportFavoritesDialog() {
  const downloadPath = remote.app.getPath('downloads');

  const { response } = await remote.dialog.showMessageBox({
    type: 'info',
    title: 'Exoprt favorites',
    icon: COMPASS_ICON,
    message: `Favorites will be exported to ${downloadPath}`,
    detail:
      'This is a detail language.',
    buttons: [
      'Open Folder',
      'OK'
    ],
  });
  switch (response) {
    case 0:
      shell.showItemInFolder(downloadPath);
      break;
    case 1:
      // 
      const storage = new ConnectionStorage();
      const connections = await storage.loadAll();
      const password = '123';
      await storage.export(connections, `${downloadPath}/compass-export.json`, { encryptionPassword: password } )

      // import

      // const storage = new ConnectionStorage();
      // const password = '123';
      // const sourceFile = 'test';
      // const connections = await storage.import(sourceFile, { encryptionPassword: password } )
      // await Promise.all(connections.map(storage.save));
    default:
      break;
  }
}

export default showExportFavoritesDialog;
