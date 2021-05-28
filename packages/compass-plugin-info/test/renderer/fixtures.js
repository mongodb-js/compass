import { Plugin } from '@mongodb-js/hadron-plugin-manager';

const LONG_DESC = 'A description that just keeps going and going and going' +
  ' and going and going and going and going and going and going and going.';

const corePlugin = new Plugin(__dirname);
corePlugin.isActivated = true;
corePlugin.error = undefined;
corePlugin.metadata = {
  'name': '@mongodb-js/core-plugin',
  'productName': 'Core Plugin',
  'version': '0.0.7',
  'description': 'A Sample Core MongoDB Compass Plugin',
  'main': 'index.js'
};

const extPlugin = new Plugin(__dirname);
extPlugin.isActivated = true;
extPlugin.error = undefined;
extPlugin.metadata = {
  'name': 'external-plugin',
  'productName': 'External Plugin',
  'version': '1.0.0',
  'description': LONG_DESC,
  'main': 'index.js'
};

const errPlugin = new Plugin(__dirname);
errPlugin.isActivated = false;
errPlugin.error = new Error('Plugin could not be loaded because of...');
errPlugin.metadata = {
  'name': 'error-plugin',
  'productName': 'Error Plugin',
  'version': '2.5.0',
  'description': 'A Sample Error MongoDB Compass Plugin',
  'main': 'index.js'
};

export { corePlugin, extPlugin, errPlugin };
