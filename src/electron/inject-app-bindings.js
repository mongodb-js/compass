// Make electron ipc available via `app`.
window.app.use(function(app) {
  app.ipc = require('ipc');
  app.trigger('change:ipc');

  app.ipc.on('run-command', function(data) {
    app.ipc.send(data.command, data.opts);
  });
});
