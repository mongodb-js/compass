// Copied from https://github.com/webdriverio/webdriverio/blob/1825c633aead82bc650dff1f403ac30cff7c7cb3/packages/devtools/src/constants.ts
// These are the default flags that webdriverio uses to start Chrome driver.
// NOTE: this has since been removed along with the devtools automation protocol https://github.com/webdriverio/webdriverio/commit/28e64e439ffc36a95f24aeda9f1d21111429dfa3#diff-6ea151d6c0687197931735239f397b7f5f0140a588c5b2b82ff584bbe73be069
const DEFAULT_WEBDRIVER_FLAGS = [
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
  '--no-verify-widevine-cdm',
  '--disable-component-update',
  '--disable-speech-api',
  '--disable-breakpad',
  '--disable-metrics',
  '--no-network-profile-sharing',
  '--disable-client-side-phishing-detection',
  '--password-store=basic',
  '--use-mock-keychain',
  '--disable-component-extensions-with-background-pages',
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

// These flags are used to start Chrome driver based on the CI requirements.
const CI_FLAGS = [
  // Chromecast feature that is enabled by default in some chrome versions
  // and breaks the app on Ubuntu
  '--media-router=0',
  // Evergren RHEL ci runs everything as root, and chrome will not start as
  // root without this flag
  '--no-sandbox',
  // Seeing gpu init related errors on at least RHEL, especially when starting
  // the CLI
  '--disable-gpu',
];

// These flags are used to start Chrome driver based on the Compass requirements.
const COMPASS_FLAGS = [
  // Allow options such as --user-data-dir to pass through the command line
  // flag validation code.
  '--ignore-additional-command-line-flags',
  // Use the Atlas dev server for generative ai and atlas requests (cloud-dev).
  '--atlasServiceBackendPreset=atlas-dev',
];

// The shared set of flags that are used to start Chrome driver when running Compass
// tests in CLI or GUI mode.
export const CHROME_STARTUP_FLAGS = [
  ...DEFAULT_WEBDRIVER_FLAGS,
  ...CI_FLAGS,
  ...COMPASS_FLAGS,
];
