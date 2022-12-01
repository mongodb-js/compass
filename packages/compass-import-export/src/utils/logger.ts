import debug from 'debug';
const PREFIX = 'mongodb-compass-import-export';

const _LOGGERS: Record<string, debug.Debugger> = {};

export const createDebug = function (name: string) {
  if (!_LOGGERS[name]) {
    _LOGGERS[name] = debug(`${PREFIX}:${name}`);
  }
  return _LOGGERS[name];
};
