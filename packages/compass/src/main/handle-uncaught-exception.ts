import { app, dialog, clipboard } from 'electron';
import cleanStack from 'clean-stack';
import ensureError from 'ensure-error';
import COMPASS_ICON from './icon';

async function handleUncaughtException(err: Error): Promise<void> {
  // eslint-disable-next-line no-console
  console.error('handling uncaughtException', err);
  err = ensureError(err);
  const stack = cleanStack(err.stack || '');

  const detail = `${app.getName()} version ${app.getVersion()}\nStacktrace:\n${stack}`;
  const message = `${app.getName()} has encountered an unexpected error`;

  // eslint-disable-next-line no-console
  console.error(`${message}: ${detail}`);

  const showErrorMessageBox = async () => {
    const { response } = await dialog.showMessageBox({
      type: 'error',
      buttons: [
        'OK',
        process.platform === 'darwin' ? 'Copy Error' : 'Copy error',
      ],
      icon: COMPASS_ICON,
      defaultId: 0,
      noLink: true,
      message: message,
      detail: detail,
    });

    if (response === 1) {
      clipboard.writeText(`${message}\n${stack}`);
      return;
    }

    if (response === 0) {
      app.quit();
      return;
    }
  };

  // Dialog can't be used until app emits a `ready` event
  await app.whenReady();
  await showErrorMessageBox();
}

export { handleUncaughtException };
