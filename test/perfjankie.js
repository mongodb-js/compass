var perfjankie = require('perfjankie');
var helpers = require('./helpers');

perfjankie({
  name: 'Connect Screen',
  suite: 'Performance',
  time: new Date().getTime(),
  run: new Date().getTime(),
  selenium: 'http://localhost:9515/',

  couch: {
    server: 'http://localhost:5984',
    database: 'performance',
    updateSite: false,
    onlyUpdateSite: false
  },

  browsers: [{
    browserName: 'electron',
    chromeOptions: {
      binary: helpers.getElectronPath()
    }
  }]
});
