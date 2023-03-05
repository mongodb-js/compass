import type { DataService } from 'mongodb-data-service';
import Sinon from 'sinon';

export const mockDataService = function (
  options: {
    data: unknown[] | (() => unknown[]);
  } = { data: [] }
) {
  const dataService = {
    isCancelError(err: any) {
      return err?.name === 'AbortError';
    },
    getConnectionString() {
      return { hosts: [] };
    },
    estimatedCount() {
      return Promise.resolve(0);
    },
    aggregate() {
      return Promise.resolve(
        typeof options.data === 'function' ? options.data() : options.data
      );
    },
  } as unknown as DataService;

  Sinon.spy(dataService);

  return dataService;
};
