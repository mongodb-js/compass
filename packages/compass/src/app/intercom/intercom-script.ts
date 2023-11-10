import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { debug, mongoLogId, log } = createLoggerAndTelemetry('COMPASS-INTERCOM');

const INTERCOM_SCRIPT_ELEM_ID = 'intercom-script';

export type IntercomMetadata = {
  app_id: string;
  user_id?: string;
  created_at?: number;
  app_name?: string;
  app_version?: string;
  app_stage?: string;
};

type WindowWithIntercomGlobals = Window &
  typeof globalThis & {
    Intercom?: (...args: any[]) => any;
    attachEvent?: (...args: any[]) => any;
  };

export function buildIntercomScriptUrl(appId: string): string {
  return `https://widget.intercom.io/widget/${appId}`;
}

export class IntercomScript {
  private queue: Promise<void>;

  constructor() {
    // we use a queue to ensure that the state of intercom will eventually reflect
    // what is selected in the preferences.
    this.queue = Promise.resolve();
  }

  load(metadata: IntercomMetadata): void {
    this.queue = this.queue
      .then(() => this.loadOnce(metadata))
      .catch((e) => debug('queue error', e));
  }

  unload(): void {
    this.queue = this.queue
      .then(() => this.unloadOnce())
      .catch((e) => debug('queue error', e));
  }

  // NOTE: adapted from
  // https://developers.intercom.com/installing-intercom/docs/basic-javascript#how-to-install
  private loadOnce(metadata: IntercomMetadata): Promise<void> {
    const win = window as WindowWithIntercomGlobals;
    if (typeof win === 'undefined') {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      log.info(
        mongoLogId(1_001_000_116),
        'Intercom',
        'Loading intercom script'
      );

      const el = win.document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
      if (el) {
        debug('intercom script already present on the page, skipping.');
        return resolve();
      }

      const ic = win.Intercom;
      if (typeof ic === 'function') {
        debug(
          'intercom function was present on the page, reattaching and updating',
          {
            ...metadata,
          }
        );

        ic('reattach_activator');
        ic('update', {
          ...metadata,
        });
      } else {
        const d = win.document;

        // eslint-disable-next-line no-var
        var i: any = function () {
          // eslint-disable-next-line prefer-rest-params
          i.c(arguments);
        };
        i.q = [];
        i.c = function (args: any) {
          i.q.push(args);
        };
        win.Intercom = i;

        /* eslint no-inner-declarations: 0 */
        function l() {
          try {
            const s = d.createElement('script');
            s.type = 'text/javascript';
            s.id = INTERCOM_SCRIPT_ELEM_ID;
            s.async = true;
            s.src = buildIntercomScriptUrl(metadata.app_id);
            const x = d.getElementsByTagName('script')[0];
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            x.parentNode!.insertBefore(s, x);
            debug('intercom script injected');
            win.Intercom!('boot', { ...metadata });
            log.info(
              mongoLogId(1_001_000_111),
              'Intercom',
              'Intercom booted with metadata',
              metadata
            );
            resolve();
          } catch (e) {
            reject(e);
          }
        }
        if (d.readyState === 'complete') {
          // call directly, window already loaded
          l();
        } else if (win.attachEvent) {
          win.attachEvent('onload', l);
        } else {
          win.addEventListener('load', l, false);
        }
      }
    }).catch((e) => {
      log.warn(
        mongoLogId(1_001_000_112),
        'Intercom',
        'Failed to inject intercom script',
        { error: e.stack }
      );
    });
  }

  private unloadOnce(): void {
    const win = window as WindowWithIntercomGlobals;
    if (typeof win === 'undefined') {
      return;
    }

    try {
      log.info(
        mongoLogId(1_001_000_113),
        'Intercom',
        'Unloading intercom script'
      );

      // remove the intercom widget
      if (win.Intercom) {
        win.Intercom('hide');
        win.Intercom('shutdown');
      }

      const el = win.document.getElementById(INTERCOM_SCRIPT_ELEM_ID);
      if (el) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        el.parentNode!.removeChild(el);
      }
      log.warn(
        mongoLogId(1_001_000_114),
        'Intercom',
        'Intercom script unloaded'
      );
    } catch (e) {
      log.warn(
        mongoLogId(1_001_000_115),
        'Intercom',
        'Failed to unload intercom script',
        { error: (e as Error)?.message }
      );
    }
  }
}
