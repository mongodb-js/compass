'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connector = exports.connect = exports.store = undefined;

var _storeMixin = require('./storeMixin');

var _storeMixin2 = _interopRequireDefault(_storeMixin);

var _connectMixin = require('./connectMixin');

var _connectMixin2 = _interopRequireDefault(_connectMixin);

var _decorator = require('./decorator');

var _decorator2 = _interopRequireDefault(_decorator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//compatibility with versions below 0.6.0
var port = function port() {
  _storeMixin2.default.connect = _connectMixin2.default;
  return _storeMixin2.default;
};

//^0.6.0 index
port.store = _storeMixin2.default;
port.connect = _connectMixin2.default;
port.connector = _decorator2.default;
exports.store = _storeMixin2.default;
exports.connect = _connectMixin2.default;
exports.connector = _decorator2.default;
//don't remove `module.exports = port`, to enable common-js-non-es6 way of importing : import {x} from '..'

module.exports = port;
exports.default = port;