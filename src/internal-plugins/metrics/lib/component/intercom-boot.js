/* eslint new-cap: 0 */
function receiveMessage(evt) {
  const data = evt.data;
  if (data.action === 'boot') {
    window.Intercom('boot', data.data);
  } else if (data.action === 'show') {
    window.Intercom('show');
  } else if (data.action === 'shutdown') {
    window.Intercom('shutdown');
  }
}

window.addEventListener('message', receiveMessage, false);
window.parent.postMessage({ action: 'intercom-frame-ready' }, '*');
