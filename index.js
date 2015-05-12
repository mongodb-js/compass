if (process.env.NODE_ENV !== 'development') {
  require('./scout-server/bin/scout-server.js');
}
require('./scout-electron');
