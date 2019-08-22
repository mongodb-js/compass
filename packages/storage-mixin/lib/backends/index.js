module.exports = {
  local: require('./local'),
  disk: require('./disk'),
  secure: require('./secure'),
  remote: require('./remote'),
  'null': require('./null'),
  'splice': require('./splice'),
  'splice-disk': require('./splice-disk')
};
