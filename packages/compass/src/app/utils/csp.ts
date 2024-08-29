const defaultCSP = {
  'default-src': [
    "'self'",
    "'unsafe-eval'",
    'blob:',
    'https://js.intercomcdn.com',
    'https://api.intercom.io',
    'https://api-iam.intercom.io',
    'https://api-ping.intercom.io',
    'https://nexus-websocket-a.intercom.io',
    'https://nexus-websocket-b.intercom.io',
    'https://nexus-long-poller-a.intercom.io',
    'https://nexus-long-poller-b.intercom.io',
    'wss://nexus-websocket-a.intercom.io',
    'wss://nexus-websocket-b.intercom.io',
    'https://widget.intercom.io',
    'https://js.intercomcdn.com',
    'https://uploads.intercomcdn.com',
    'https://cloud.mongodb.com',
    'https://cloud-dev.mongodb.com',
    'https://compass.mongodb.com',
    'https://uploads.intercomusercontent.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'file://*',
    'https://compass-maps.mongodb.com',
    'https://js.intercomcdn.com',
    'https://static.intercomassets.com',
    'https://downloads.intercomcdn.com',
    'https://uploads.intercomusercontent.com',
    'https://webassets.mongodb.com',
    'https://gifs.intercomcdn.com',
  ],
  'style-src': ['*', "'unsafe-inline'"],
  'connect-src': [
    'https://compass-maps.mongodb.com',
    'https://api.intercom.io',
    'https://api-iam.intercom.io',
    'https://api-ping.intercom.io',
    'https://nexus-websocket-a.intercom.io',
    'https://nexus-websocket-b.intercom.io',
    'https://nexus-long-poller-a.intercom.io',
    'https://nexus-long-poller-b.intercom.io',
    'wss://nexus-websocket-a.intercom.io',
    'wss://nexus-websocket-b.intercom.io',
    'https://widget.intercom.io',
    'https://js.intercomcdn.com',
    'https://uploads.intercomcdn.com',
    'https://uploads.intercomusercontent.com',
    'https://cloud.mongodb.com',
    'https://cloud-dev.mongodb.com',
    'https://compass.mongodb.com',
    'https://ip-ranges.amazonaws.com',
  ],
  'child-src': [
    'blob:',
    'https://share.intercom.io',
    'https://intercom-sheets.com',
  ],
  'script-src': [
    "'self'",
    'https://app.intercom.io',
    'https://widget.intercom.io',
    'https://js.intercomcdn.com',
    "'unsafe-eval'",
  ],
  'object-src': ["'none'"],
  'font-src': ['*', 'https://js.intercomcdn.com'],
};

function injectCSP() {
  const metaCSP = document.createElement('meta');
  const extraAllowed: string[] = [];
  if (
    process.env.APP_ENV === 'webdriverio' ||
    process.env.NODE_ENV === 'development'
  ) {
    // In e2e tests and in dev mode we need to allow application to send
    // requests to localhost in some cases: e2e tests use locally running
    // servers and dev mode serves content through localhost
    extraAllowed.push('http://localhost:*');
    // WS allowed for webpack hot update
    extraAllowed.push('ws://localhost:*');
    // Used by proxy tests, since Chrome does not like proxying localhost
    // (this does not result in actual outgoing HTTP requests)
    extraAllowed.push('http://compass.mongodb.com/');
  }
  const cspContent =
    Object.entries(defaultCSP)
      .map(([name, values]) => {
        // 'none' is an exclusive value, we don't expect to allow anything for a
        // directive that defines this value
        if (values.includes("'none'") === false) {
          values = values.concat(...extraAllowed);
        }
        return `${name} ${values.join(' ')}`;
      })
      .join('; ') + ';';
  metaCSP.setAttribute('http-equiv', 'Content-Security-Policy');
  metaCSP.setAttribute('content', cspContent);
  document.head.prepend(metaCSP);
}

injectCSP();
