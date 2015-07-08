/*eslint new-cap:0*/
/**
 * App state has been updated so notfiy intercom of it.
 */
module.exports.update = function() {
  window.Intercom('update');
};

/**
 * Injects the intercom client script.
 */
module.exports.inject = function() {
  var i = function() {
    i.c(arguments);
  };
  i.q = [];
  i.c = function(args) {
    i.q.push(args);
  };
  window.Intercom = i;

  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://widget.intercom.io/widget/p57suhg7';
  head.appendChild(script);

  window.Intercom('boot', {
    app_id: 'p57suhg7'
    // @todo (imlucas): Include name, email, and first_run_at in this hash.
  });
};
