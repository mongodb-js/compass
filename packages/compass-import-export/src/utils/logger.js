import debug from 'debug';
const PREFIX = 'mongodb-compass-import-export';

const _LOGGERS = {};

export const createDebug = function (name) {
  if (!_LOGGERS[name]) {
    _LOGGERS[name] = debug(`${PREFIX}:${name}`);
  }
  return _LOGGERS[name];
};
