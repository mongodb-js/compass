'use strict';

import storeMixin from './storeMixin';
import connectMixin from './connectMixin';
import connectDecorator from './decorator';

//compatibility with versions below 0.6.0
let port = () => {
  storeMixin.connect = connectMixin;
  return storeMixin;
};

//^0.6.0 index
port.store = storeMixin;
port.connect = connectMixin;
port.connector = connectDecorator;
export {storeMixin as store, connectMixin as connect, connectDecorator as connector}
//don't remove `module.exports = port`, to enable common-js-non-es6 way of importing : import {x} from '..'
module.exports = port;
export default port;

