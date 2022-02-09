"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDebug = void 0;
const debug_1 = __importDefault(require("debug"));
const PREFIX = 'mongodb-compass-import-export';
const _LOGGERS = {};
const createDebug = function (name) {
    if (!_LOGGERS[name]) {
        _LOGGERS[name] = (0, debug_1.default)(`${PREFIX}:${name}`);
    }
    return _LOGGERS[name];
};
exports.createDebug = createDebug;
//# sourceMappingURL=logger.js.map