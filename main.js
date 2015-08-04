/**
 * The main entrpoint Electron will execute.
 */
if (process.env.NODE_ENV === 'development') {
  process.env.DEBUG = 'mon*,sco*';
}

// @todo (imlucas): Use subprocess instead?
// @todo (imlucas): move scout-(server|client|brain) to mongoscope prefix.
require('scout-server').start();

require('./src/electron');
