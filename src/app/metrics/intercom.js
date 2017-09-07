// var _ = require('lodash');
// var ipc = require('hadron-ipc');
// var app = require('hadron-app');
//
// function getNodeObserver(fn) {
//   var observer = new MutationObserver(function(mutations) {
//     mutations.forEach(function(mutation) {
//       if (!mutation.addedNodes) {
//         return;
//       }
//       [].forEach.call(mutation.addedNodes, fn);
//     });
//   });
//   return observer;
// }
//
// module.exports.configure = function() {
//   // open intercom panel when user chooses it from menu
//   ipc.on('window:show-intercom-panel', function() {
//     /* eslint new-cap: 0 */
//     if (window.Intercom && app.preferences.enableFeedbackPanel && app.preferences.trackUsageStatistics) {
//       document.querySelector('#intercom-container').classList.remove('hidden');
//     }
//   });
//
//   /**
//    * Listen for links in the Intercom chat window
//    * such that when a link is clicked, the event is properly
//    * passed off to `app.router` and a web page actually opens.
//    */
//   var listenForLinks = getNodeObserver(function(element) {
//     if (element.nodeName === 'A') {
//       element.onclick = app.state.onLinkClick.bind(app.state);
//     } else if (element.querySelectorAll) {
//       _.each(element.querySelectorAll('a'), function(node) {
//         node.onclick = app.state.onLinkClick.bind(app.state);
//       });
//     }
//   });
//
//   var waitForIntercom = getNodeObserver(function(element) {
//     if (element.id === 'intercom-container') { // if intercom is now available...
//       listenForLinks.observe(element, {
//         childList: true,
//         subtree: true
//       });
//       waitForIntercom.disconnect(); // stop waiting for intercom
//     }
//   });
//
//   waitForIntercom.observe(document.body, {
//     childList: true
//   });
// };
