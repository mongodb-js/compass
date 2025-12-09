export type IntercomMetadata = {
  app_id: string;
  user_id?: string;
  created_at?: number;
  app_name?: string;
  app_version?: string;
  app_stage?: string;
};

export const INTERCOM_IFRAME_MESSAGES = {
  INTERCOM_IFRAME_READY: 'INTERCOM_IFRAME_READY',
  INTERCOM_HAS_MESSAGE: 'INTERCOM_HAS_MESSAGE',
  HIDE_INTERCOM_IFRAME: 'HIDE_INTERCOM_IFRAME', // TODO: Remove.
  IFRAME_CLOSE_REQUESTED: 'IFRAME_CLOSE_REQUESTED',
  IFRAME_LOG_MESSAGE: 'INTERCOM_IFRAME_LOG',
} as const;

export type IntercomIframeMessageType =
  (typeof INTERCOM_IFRAME_MESSAGES)[keyof typeof INTERCOM_IFRAME_MESSAGES];

export function buildIntercomScriptUrl(appId: string): string {
  return `https://widget.intercom.io/widget/${appId}`;
}

/**
 * Creates an iframe element for Intercom with overlay and close button.
 */
export function createIntercomIframeElement(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed',

    bottom: '20px',
    right: '20px',
    width: '400px',
    height: '600px',

    // top: 0,
    // left: 0,
    // width: '100vw',
    // height: '100vh',

    pointerEvents: 'none',

    zIndex: '99999',
    display: 'none',

    // border: 'none',
    border: '2px solid purple',
    backgroundColor: 'transparent',
  });

  return iframe;
}

function generateIframeJavascript(metadata: IntercomMetadata): string {
  return `
(function() {
  'use strict';

  const INTERCOM_SCRIPT_ELEM_ID = 'intercom-script';

  /**
   * Post a log message to parent window
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data
   */
  function postLog(level, message, data) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: '${INTERCOM_IFRAME_MESSAGES.IFRAME_LOG_MESSAGE}',
        payload: { level, message, data }
      }, '*');
    }
  }

  postLog('info', 'In intercom script. Setting up listeners.');

  /**
   * Load Intercom script and boot with metadata
   * NOTE: adapted from
   * https://developers.intercom.com/installing-intercom/docs/basic-javascript#how-to-install
   * @param {Object} metadata - Intercom metadata
   * @returns {Promise<void>}
   */
  function loadIntercomOnce(metadata) {
    const win = window;
    if (typeof win === 'undefined') {
      return Promise.resolve();
    }

    return new Promise(function(resolve, reject) {
      postLog('info', 'Loading intercom script');

      const el = win.document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
      if (el) {
        postLog('debug', 'Script already present on the page, skipping.');
        return resolve();
      }

      const ic = win.Intercom;
      if (typeof ic === 'function') {
        postLog('debug', 'Function was present on the page, reattaching and updating', metadata);

        ic('reattach_activator');
        ic('update', metadata);
        resolve();
      } else {
        const d = win.document;

        // Initialize Intercom stub
        var i = function() {
          i.c(arguments);
        };
        i.q = [];
        i.c = function(args) {
          i.q.push(args);
        };
        win.Intercom = i;

        // eslint-disable-next-line no-inner-declarations
        function loadScript() {
          try {
            const s = d.createElement('script');
            s.type = 'text/javascript';
            s.id = INTERCOM_SCRIPT_ELEM_ID;
            s.async = true;
            s.src = "${buildIntercomScriptUrl(metadata.app_id)}";
            
            s.onload = function() {
              postLog('debug', 'Script injected');
              win.Intercom('boot', metadata);
              postLog('info', 'Intercom booted with metadata', metadata);

              win.Intercom('onUnreadCountChange', function(unreadCount) {
                postLog('debug', 'Intercom unread count changed', { unreadCount: unreadCount });
                if (unreadCount > 0) {
                  // Notify parent that there is a message
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: '${INTERCOM_IFRAME_MESSAGES.INTERCOM_HAS_MESSAGE}',
                      payload: { unreadCount: unreadCount }
                    }, '*');
                  }
                }
              });

              win.Intercom('onHide', function() {
                postLog('debug', 'Intercom onHide');
                if (window.parent && window.parent !== window) {
                  window.parent.postMessage({
                    type: '${INTERCOM_IFRAME_MESSAGES.HIDE_INTERCOM_IFRAME}'
                  }, '*');
                }
              });

              win.Intercom('onShow', function() {
                postLog('debug', 'Intercom onShow');
              });

              resolve();
            };
            
            s.onerror = function(error) {
              postLog('error', 'Failed to load script', { error: error.message });
              reject(new Error('Failed to load Intercom script'));
            };

            const x = d.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
          } catch (e) {
            postLog('error', 'Exception during script injection', { error: e.message });
            reject(e);
          }
        }

        if (d.readyState === 'complete') {
          loadScript();
        } else if (win.attachEvent) {
          win.attachEvent('onload', loadScript);
        } else {
          win.addEventListener('load', loadScript, false);
        }
      }
    }).catch(function(e) {
      postLog('warn', 'Failed to inject intercom script', { error: e.stack });
    });
  }

  /**
   * Unload the Intercom script.
   */
  function unloadIntercomOnce() {
    const win = window;
    if (typeof win === 'undefined') {
      return;
    }

    try {
      postLog('info', 'Unloading intercom script');

      // Remove the intercom widget
      if (win.Intercom) {
        win.Intercom('hide');
        win.Intercom('shutdown');
      }

      const el = win.document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
      if (el) {
        el.parentNode.removeChild(el);
      }
      
      postLog('warn', 'Intercom script unloaded');
    } catch (e) {
      postLog('warn', 'Failed to unload intercom script', { error: e.message });
    }
  }

  // Queue to ensure that the state of intercom will eventually reflect
  // what is selected in the preferences.
  var queue = Promise.resolve();

  /**
   * Load Intercom script and boot with metadata.
   * @param {Object} metadata - Intercom metadata.
   */
  function loadIntercom(metadata) {
    queue = queue
      .then(function() { return loadIntercomOnce(metadata); })
      .catch(function(e) { postLog('debug', 'queue error', { error: e.message }); });
  }

  /**
   * Unload Intercom script and shut down widget.
   */
  function unloadIntercom() {
    queue = queue
      .then(function() { return unloadIntercomOnce(); })
      .catch(function(e) { postLog('debug', 'queue error', { error: e.message }); });
  }

  /**
   * Show the Intercom widget.
   */
  function showIntercom() {
    if (window.Intercom) {
      window.Intercom('show');
    }
  }

  /**
   * Hide the Intercom widget.
   */
  function hideIntercom() {
    if (window.Intercom) {
      window.Intercom('hide');
    }
  }

  /**
   * Track an event in Intercom.
   * @param {string} eventName - Event name
   * @param {Object} [metadata] - Event metadata
   * @returns {boolean} True if event was tracked, false otherwise.
   */
  function trackEvent(eventName, metadata) {
    if (window.Intercom) {
      try {
        window.Intercom('trackEvent', eventName, metadata);
        return true;
      } catch (e) {
        postLog('debug', 'intercom track error', { error: e.message });
        return false;
      }
    }
    return false;
  }

  // Expose the API for the intercom interactions to the window,
  // which the renderer can use via 'contentWindow'.
  window.IntercomLoader = {
    load: loadIntercom,
    unload: unloadIntercom,
    show: showIntercom,
    hide: hideIntercom,
    trackEvent: trackEvent
  };

  // Post that we've setup the listeners and are ready to receive commands.
  window.parent.postMessage({
    type: '${INTERCOM_IFRAME_MESSAGES.INTERCOM_IFRAME_READY}'
  });


  // TODO: Remove if we don't want it.
  // Workaround 1: Close button on the iframe to allow users to close it.
  // This is needed as Intercom does not notify us when the user closes
  // the widget.
  const closeButton = document.createElement('button');
  closeButton.textContent = 'x';
  closeButton.setAttribute('aria-label', 'Close Intercom');
  closeButton.style.cssText = '\
    position: fixed;\
    top: 8px;\
    right: 8px;\
    width: 24px;\
    height: 24px;\
    border-radius: 50%;\
    border: none;\
    background-color: rgba(255, 255, 255, 0.9);\
    color: #000;\
    cursor: pointer;\
    padding: 0;\
    display: flex;\
    align-items: center;\
    justify-content: center;\
    z-index: 2147483647;\
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);\
  ';

  closeButton.addEventListener('mouseenter', function() {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 1)';
  });
  closeButton.addEventListener('mouseleave', function() {
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  });
  closeButton.addEventListener('click', function() {
    postLog('info', 'Close button clicked');
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: '${INTERCOM_IFRAME_MESSAGES.IFRAME_CLOSE_REQUESTED}'
      }, '*');
    }
  });
  document.body.appendChild(closeButton);
})();
`;
}

export function generateIframeContent(metadata: IntercomMetadata): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="initial-scale=1" />
    <style>
      body {
        pointer-events: none;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
      }
      #intercom-frame {
        pointer-events:auto;
      }
      </style>
  </head>
  <body>
     <script>
       ${generateIframeJavascript(metadata)}
     </script>
  </body>
</html>`;
}
