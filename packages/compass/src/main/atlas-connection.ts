import { ipcMain } from 'hadron-ipc';
import { app, BrowserWindow, session } from 'electron';

const LOGIN_URL = 'https://account.mongodb.com/account/login';
const CLOUD_URL = 'https://cloud.mongodb.com';
const SUCCESS_REDIRECT_URL = /^https:\/\/cloud.mongodb.com(\/)?$/;
const SESSION_COOKIE = 'mmsa-prod';

function cookies() {
  return session.defaultSession.cookies;
}

async function getCloudSessionCookie() {
  const [maybeCookie] = await cookies().get({ name: SESSION_COOKIE });
  return maybeCookie ? `${maybeCookie.name}=${maybeCookie.value}` : null;
}

export function setupAtlasConnectionManager() {
  void app.whenReady().then(() => {
    ipcMain.handle('is-atlas-session', async () => {
      return !!(await getCloudSessionCookie());
    });

    ipcMain.handle('atlas-logout', async () => {
      await session.defaultSession.clearStorageData({ storages: ['cookies'] });
    });

    ipcMain.handle('start-atlas-login', async (evt) => {
      function setupWebRequestListeners() {
        evt.sender.session.webRequest.onBeforeSendHeaders(
          { urls: ['*://cloud.mongodb.com/*'] },
          (_details, callback) => {
            void getCloudSessionCookie().then((maybeCookie) => {
              if (!maybeCookie) {
                return callback({ cancel: true });
              }
              callback({ requestHeaders: { Cookie: maybeCookie } });
            });
          }
        );
        evt.sender.session.webRequest.onHeadersReceived(
          { urls: ['*://cloud.mongodb.com/*'] },
          (details, callback) => {
            Object.keys(details.responseHeaders ?? {}).forEach((header) => {
              if (/access-control-allow-origin/i.test(header)) {
                delete details.responseHeaders![header];
              }
            });
            callback({
              responseHeaders: {
                ...details.responseHeaders,
                'access-control-allow-origin': '*',
              },
              statusLine: details.statusLine,
            });
          }
        );
      }

      if (await getCloudSessionCookie()) {
        setupWebRequestListeners();
        return;
      }

      const window = new BrowserWindow({
        height: 700,
        width: 400,
        resizable: false,
        fullscreenable: false,
      });

      return new Promise<void>((resolve, reject) => {
        const onClose = () => {
          reject(new Error('Login unsuccessfull: window closed'));
        };

        window.on('closed', onClose);

        window.webContents.session.webRequest.onBeforeRedirect(
          { urls: ['*://*/*'] },
          ({ redirectURL }) => {
            if (SUCCESS_REDIRECT_URL.test(redirectURL)) {
              window.off('closed', onClose);
              window.close();
              setupWebRequestListeners();
              evt.sender.focus();
              resolve();
            }
          }
        );

        void window.loadURL(LOGIN_URL);
      });
    });
  });
}
