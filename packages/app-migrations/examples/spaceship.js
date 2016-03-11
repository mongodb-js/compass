/* eslint no-console: 0 */

// define your migrations functions, keyed to the version they were introduced at.
var migrations = {
  '1.0.4': function(previousVersion, currentVersion, done) {
    // introduced new "jetpack" feature which requires changes to the engine.
    // ... add code here ...
    done(null, 'upgraded engine to support jetpack.');
  },
  '1.0.9': function(previousVersion, currentVersion, done) {
    // added photon cannons for more fire power, but needed to deprecate
    // laser cannons instead.
    // ... add code here ...
    done(null, 'removed laser cannons, added photon cannons.');
  }
};

var migrate = require('../')(migrations);

// upgrade from 1.0.5 (we already got jetpacks) to 1.1.4 (need photon cannon)
migrate('1.0.2', '1.1.4', function(err, res) {
  if (err) return console.error('Error:', err.message);
  console.log('Success:', res);
});
