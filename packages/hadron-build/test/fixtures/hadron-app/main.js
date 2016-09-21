'use strict';

const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;
const nativeImage = electron.nativeImage;

app.on('ready', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'Test Fixture App for hadron-build',
    message: 'Showing this message is all this app does and is only for testing.',
    buttons: ['OK'],
    icon: nativeImage.createFromPath('./hadron-app.png')
  }, () => app.quit());
});
