import type { DataService } from 'mongodb-data-service';
import Sinon from 'sinon';

export const mockDataService = function (
  options: {
    data: unknown[] | (() => unknown[]);
  } = { data: [] }
) {
  const dataService = {
    startSession() {
      // noop
    },
    aggregate() {
      return new (class {
        toArray() {
          return Promise.resolve(
            typeof options.data === 'function'
              ? options.data()
              : options.data
          );
        }
        close() {
          // noop
        }
      })();
    },
    killSessions() {
      // noop
    }
  } as unknown as DataService;

  Sinon.spy(dataService);

  return dataService;
};
