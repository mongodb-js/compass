/**
 * Inject the livereload client so windows are reloaded automatically
 * when any client assets/code are changed.
 */
module.exports.inject = function() {
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'http://localhost:35729/livereload.js';
  head.appendChild(script);
};
