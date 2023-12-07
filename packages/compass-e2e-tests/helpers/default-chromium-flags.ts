// Copied from https://github.com/webdriverio/webdriverio/blob/1825c633aead82bc650dff1f403ac30cff7c7cb3/packages/devtools/src/constants.ts
export const DEFAULT_CHROMIUM_FLAGS = [
  // suppresses Save Password prompt window
  '--enable-automation',
  // do not block popups
  '--disable-popup-blocking',
  // Disable all chrome extensions entirely
  '--disable-extensions',
  // Disable various background network services, including extension updating,
  //   safe browsing service, upgrade detector, translate, UMA
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  // Disable syncing to a Google account
  '--disable-sync',
  // Disable reporting to UMA, but allows for collection
  '--metrics-recording-only',
  // Disable installation of default apps on first run
  '--disable-default-apps',
  // Mute any audio
  '--mute-audio',
  // Skip first run wizards
  '--no-first-run',
  '--no-default-browser-check',
  // chromedriver flags
  '--disable-hang-monitor',
  '--disable-prompt-on-repost',
  '--disable-client-side-phishing-detection',
  '--password-store=basic',
  '--use-mock-keychain',
  '--disable-component-extensions-with-background-pages',
  '--disable-breakpad',
  '--disable-dev-shm-usage',
  '--disable-ipc-flooding-protection',
  '--disable-renderer-backgrounding',
  '--force-fieldtrials=*BackgroundTracing/default/',
  '--enable-features=NetworkService,NetworkServiceInProcess',
  /**
   * `site-per-process` affects `page.frames()`, see #4471
   * `TranslateUI` disables built-in Google Translate service
   */
  '--disable-features=site-per-process,TranslateUI,BlinkGenPropertyTrees',
];
