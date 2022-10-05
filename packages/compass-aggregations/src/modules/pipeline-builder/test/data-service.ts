import type { DataService } from 'mongodb-data-service';
import { spy } from 'sinon';

export const mockDataService = function (options: {
  data: unknown[]
}) {
  const spies = {
    startSession: spy(),
    aggregate: spy(),
    cursorToArray: spy(),
    cursorClose: spy(),
    killSessions: spy(),
  };

  const dataService = new class {
    startSession(client: string) {
      return spies.startSession(client);
    }
    aggregate(...args: unknown[]) {
      spies.aggregate(...args);
      return new class {
        toArray() {
          spies.cursorToArray();
          return options.data;
        }
        close() {
          return spies.cursorClose();
        }
      }
    }
    killSessions() {
      return spies.killSessions();
    }
  } as unknown as DataService;

  return { spies, dataService };
}