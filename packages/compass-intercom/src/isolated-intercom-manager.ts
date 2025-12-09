import { createLogger } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import { getActiveUser } from 'compass-preferences-model';
import { isIntercomAllowed } from './allowed-integrations';
import {
  buildIntercomScriptUrl,
  createIntercomIframeElement,
  generateIframeContent,
  INTERCOM_IFRAME_MESSAGES,
  type IntercomMetadata,
} from './intercom-iframe';

const { debug } = createLogger('aaaCOMPASS-INTERCOM');

interface IntercomLoader {
  load: (metadata: IntercomMetadata) => void;
  unload: () => void;
  show: () => void;
  hide: () => void;
  trackEvent: (eventName: string, metadata?: unknown) => boolean;
}

interface IntercomWindow extends Window {
  IntercomLoader?: IntercomLoader;
}

type IntercomTrackingEvent = 'submitted-nl-prompt';

/**
 * We isolate intercom in an iframe as we do not want to
 * give an external script access to the renderer's node integration.
 *
 * This class provides an interface for managing and communicating with
 * the intercom iframe.
 */
export class IsolatedIntercomManager {
  private static iframe: HTMLIFrameElement | null = null;

  private static initPromise: Promise<void> | null = null;

  private static listeners: ((event: MessageEvent) => void)[] = [];

  private static iframeContentBlobUrl: string | null = null;

  private constructor() {
    // Marking constructor as private to disallow usage.
  }

  private static async setupIframe(metadata: IntercomMetadata): Promise<void> {
    if (this.iframe) {
      return;
    }
    debug('setting up intercom iframe');

    this.iframe = createIntercomIframeElement();

    let onReady: () => void;
    const readyPromise = new Promise<void>((resolve) => {
      onReady = () => {
        debug('intercom iframe is ready');
        resolve();
      };
    });

    const htmlContent = await generateIframeContent(metadata);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    this.iframeContentBlobUrl = window.URL.createObjectURL(blob);
    this.iframe.src = this.iframeContentBlobUrl;

    // Handle messages from the iframe.
    const handleMessage = (event: MessageEvent) => {
      if (!this.iframe || event.source !== this.iframe.contentWindow) return;

      const { type, payload } = event.data;

      switch (type) {
        case INTERCOM_IFRAME_MESSAGES.INTERCOM_HAS_MESSAGE:
          IsolatedIntercomManager.showIntercomIframe();
          break;

        case INTERCOM_IFRAME_MESSAGES.HIDE_INTERCOM_IFRAME:
          IsolatedIntercomManager.hideIntercomIframe();
          break;

        case INTERCOM_IFRAME_MESSAGES.IFRAME_CLOSE_REQUESTED:
          debug('close button clicked - hiding iframe');
          IsolatedIntercomManager.hideIntercomIframe();
          break;

        case INTERCOM_IFRAME_MESSAGES.INTERCOM_IFRAME_READY:
          onReady();
          break;

        case INTERCOM_IFRAME_MESSAGES.IFRAME_LOG_MESSAGE:
          debug(
            `intercom iframe log [${payload.level}]: ${payload.message}`,
            payload.data
          );
          break;
      }
    };
    window.addEventListener('message', handleMessage);
    this.listeners.push(handleMessage);

    document.body.appendChild(this.iframe);

    debug('intercom iframe appended to document body');

    await readyPromise;

    debug('intercom iframe ready');
  }

  private static async _init(preferences: PreferencesAccess): Promise<void> {
    debug('starting intercom _init');

    if (typeof window === 'undefined') {
      throw new Error(
        'Intercom can only be initialized in a browser environment'
      );
    }

    const { enableFeedbackPanel } = preferences.getPreferences();

    // TODO: Remove note: Rhys is testing with the intercom test app id.
    // We can use that to push messages to full try it.
    const intercomAppId = process.env.HADRON_METRICS_INTERCOM_APP_ID;

    if (!intercomAppId) {
      debug(
        'skipping Intercom setup HADRON_METRICS_INTERCOM_APP_ID is not defined'
      );
      return;
    }

    const user = getActiveUser(preferences);

    const metadata: IntercomMetadata = {
      user_id: user.id,
      app_id: intercomAppId,
      created_at: Math.floor(user.createdAt.getTime() / 1000),
      app_name: process.env.HADRON_PRODUCT_NAME,
      app_version: process.env.HADRON_APP_VERSION,
      app_stage: process.env.NODE_ENV,
    };

    const shouldLoad = enableFeedbackPanel && (await isIntercomAllowed());
    if (shouldLoad) {
      // In some environment the network can be firewalled, this is a safeguard to avoid
      // uncaught errors when injecting the script.
      debug('testing intercom availability');

      const intercomWidgetUrl = buildIntercomScriptUrl(metadata.app_id);

      const response = await fetch(intercomWidgetUrl).catch((e) => {
        debug('fetch failed', e);
        return null;
      });

      if (!response || response.status >= 400) {
        debug('intercom unreachable, skipping setup');
        return;
      }

      debug('intercom is reachable, proceeding with the setup');
    } else {
      debug(
        'not testing intercom connectivity because enableFeedbackPanel == false || isAllowed == false'
      );
    }

    // We setup the iframe regardless of whether we will load intercom or not,
    // so that we have it ready to go when the user enables the feedback panel.
    await IsolatedIntercomManager.setupIframe(metadata);

    async function toggleEnableFeedbackPanel(enableFeedbackPanel: boolean) {
      if (enableFeedbackPanel && (await isIntercomAllowed())) {
        debug('loading intercom script');
        (
          IsolatedIntercomManager.iframe?.contentWindow as IntercomWindow
        )?.IntercomLoader?.load(metadata);
      } else {
        debug('unloading intercom script');
        (
          IsolatedIntercomManager.iframe?.contentWindow as IntercomWindow
        )?.IntercomLoader?.unload();
      }
    }

    try {
      await toggleEnableFeedbackPanel(shouldLoad);
    } catch (error) {
      debug('initial toggle failed', {
        error,
      });
    }

    preferences.onPreferenceValueChanged(
      'enableFeedbackPanel',
      (enableFeedbackPanel) => {
        debug('enableFeedbackPanel changed');
        void toggleEnableFeedbackPanel(enableFeedbackPanel);
      }
    );

    debug('finished intercom _init');
  }

  static init(preferences: PreferencesAccess): Promise<void> {
    return (this.initPromise ??= this._init(preferences));
  }

  static cleanup() {
    // Clean up iframe and event listeners.
    this.iframe?.remove();
    this.iframe = null;

    if (this.iframeContentBlobUrl) {
      window.URL.revokeObjectURL(this.iframeContentBlobUrl);
      this.iframeContentBlobUrl = null;
    }

    for (const listener of this.listeners) {
      window.removeEventListener('message', listener);
    }
    this.listeners = [];
  }

  // Called when intercom has an unread message to show.
  // We expand the iframe so intercom can show the post or
  // notification to the user.
  private static showIntercomIframe() {
    if (!this.iframe) return;

    // const wrapper = this.iframe.__wrapper;
    // (wrapper ?? this.iframe).style.display = 'block';

    this.iframe.style.display = 'block';
  }

  private static hideIntercomIframe() {
    if (!this.iframe) return;

    // const wrapper = this.iframe.__wrapper;
    // (wrapper ?? this.iframe).style.display = 'none';

    this.iframe.style.display = 'none';
  }

  static async intercomTrack(event: IntercomTrackingEvent, metadata?: unknown) {
    await this.initPromise;

    const intercomWindow = this.iframe?.contentWindow as IntercomWindow;
    if (!intercomWindow?.IntercomLoader) {
      debug('IntercomLoader not available yet');
      return;
    }

    const tracked = intercomWindow.IntercomLoader.trackEvent(event, metadata);
    if (tracked) {
      debug('tracked event', { event, metadata });
    } else {
      debug('failed to track event', { event, metadata });
    }
  }
}

export function intercomTrack(
  event: IntercomTrackingEvent,
  metadata?: unknown
) {
  return IsolatedIntercomManager.intercomTrack(event, metadata);
}
