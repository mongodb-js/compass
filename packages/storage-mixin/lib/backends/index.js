module.exports = {
  local: require('./local'),
  disk: require('./disk'),
  secure: require('./secure'),
  remote: require('./remote'),
  'null': require('./null'),
  'splice': require('./splice'),
  'splice-disk': require('./splice-disk'),
  'splice-disk-ipc': require('./splice-disk-ipc'),
  'secure-ipc': require('./secure-ipc'),
  'secure-main': require('./secure-main')
};
