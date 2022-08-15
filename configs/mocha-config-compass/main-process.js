const { initialize, enable } = require('@electron/remote/main');
const { app } = require('electron');
app.on('web-contents-created', function (_, webContents) {
  enable(webContents);
});
initialize();
