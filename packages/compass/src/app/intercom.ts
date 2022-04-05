import PQueue from 'p-queue';

import createDebug from 'debug';
import type { EventEmitter } from 'events';

const debug = createDebug('mongodb-compass:intercom');

const INTERCOM_SCRIPT_ELEM_ID = 'intercom-script';

type IntercomMetadata = {
  app_id?: string;
  user_id?: string;
  created_at?: number;
  app_name?: string;
  app_version?: string;
  app_stage?: string;
};

function loadIntercomScript(
  intercomWidgetUrl: string,
  metadata: IntercomMetadata
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    debug('setup intercom');

    const el = document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
    if (el) {
      debug('intercom script already present on the page, skipping.');
      return resolve();
    }
    if (typeof window === 'undefined') {
      return resolve();
    }
    const w: any = window;
    const ic = w.Intercom;
    if (typeof ic === 'function') {
      ic('reattach_activator');
      ic('update', {
        ...metadata,
        widget: { activator: '#IntercomDefaultWidget' },
      });
    } else {
      const d = document;

      // eslint-disable-next-line no-var
      var i: any = function () {
        // eslint-disable-next-line prefer-rest-params
        i.c(arguments);
      };
      i.q = [];
      i.c = function (args: any) {
        i.q.push(args);
      };
      w.Intercom = i;

      /* eslint no-inner-declarations: 0 */
      function l() {
        try {
          const s = d.createElement('script');
          s.type = 'text/javascript';
          s.id = INTERCOM_SCRIPT_ELEM_ID;
          s.async = true;
          s.src = intercomWidgetUrl;
          const x = d.getElementsByTagName('script')[0];
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          x.parentNode!.insertBefore(s, x);
          debug('intercom script injected');
          w.Intercom('boot', metadata);
          debug('intercom booted with metadata', metadata);
          resolve();
        } catch (e) {
          reject(e);
        }
      }
      if (d.readyState === 'complete') {
        // call directly, window already loaded
        l();
      } else if (w.attachEvent) {
        w.attachEvent('onload', l);
      } else {
        w.addEventListener('load', l, false);
      }
    }
  }).catch((e) => {
    debug('failed to inject intercom script, reason:', e);
  });
}

export function unloadIntercom(): void {
  try {
    const win: any = window;

    debug('unload intercom');
    if (typeof window === 'undefined') {
      return;
    }

    // remove the intercom widget
    if (win.Intercom) {
      win.Intercom('hide');
      win.Intercom('shutdown');
    }

    const el = document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
    if (el) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      el.parentNode!.removeChild(el);
    }
    debug('intercom script unloaded');
  } catch (e) {
    debug('unload intercom failed, reason:', e);
  }
}

export async function setupIntercom(
  preferences: Pick<EventEmitter, 'on'> & {
    isFeatureEnabled: (feature: string) => boolean;
  },
  user: {
    id: string;
    createdAt: Date;
  }
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (process.env.HADRON_ISOLATED === 'true') {
    debug('Skipping intercom setup on HADRON_ISOLATED');
    return;
  }

  const intercomAppId = process.env.HADRON_METRICS_INTERCOM_APP_ID;

  if (!intercomAppId) {
    debug(
      'skipping Intercom setup HADRON_METRICS_INTERCOM_APP_ID is not defined'
    );
    return;
  }

  const metadata: IntercomMetadata = {
    user_id: user.id,
    app_id: intercomAppId,
    created_at: Math.floor(user.createdAt.getTime() / 1000),
    app_name: process.env.HADRON_PRODUCT_NAME,
    app_version: process.env.HADRON_APP_VERSION,
    app_stage: process.env.NODE_ENV,
  };

  const intercomWidgetUrl =
    'https://widget.intercom.io/widget/' + intercomAppId;

  // in some environment the network can be firewalled, this is a safeguard to avoid
  // uncaught errors when injecting the script.

  debug('testing intercom availability');
  const response = await fetch(intercomWidgetUrl);
  if (response.status >= 400) {
    debug('intercom unreachable, skipping setup');
    return;
  }

  debug('intercom is reachable, proceeding with the setup');

  // we use a queue to ensure that the state of intercom will eventually reflect
  // what is selected in the preferences.
  const queue = new PQueue({ concurrency: 1 });

  if (preferences.isFeatureEnabled('enableFeedbackPanel')) {
    debug(
      'intercom loading enqueued since enableFeedbackPanel was initially enabled'
    );
    queue
      .add(() => loadIntercomScript(intercomWidgetUrl, metadata))
      .catch((e) => debug('queue error', e));
  } else {
    debug('enableFeedbackPanel is disabled, skipping loading intercom for now');
  }

  preferences.on(
    'change:enableFeedbackPanel',
    function (prefs: unknown, enabled: boolean) {
      debug('enableFeedbackPanel changed to:', enabled);
      // we need to re-check with isFeatureEnabled to make sure all the
      // other settings for network usage are aligned too.
      if (preferences.isFeatureEnabled('enableFeedbackPanel')) {
        debug('enqueuing intercom script loading');
        queue
          .add(() => loadIntercomScript(intercomWidgetUrl, {}))
          .catch((e) => debug('queue error', e));
      } else {
        debug('enqueuing intercom script unloading');
        queue.add(() => unloadIntercom()).catch((e) => debug('queue error', e));
      }
    }
  );
}
