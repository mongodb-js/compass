'use strict';

var storeMixin = require('./storeMixin');
var connectMixin = require('./connectMixin');
import connectDecorator from './decorator';

module.exports = {
  store: storeMixin,
  connect: connectMixin,
  connectDecorator: connectDecorator
};


