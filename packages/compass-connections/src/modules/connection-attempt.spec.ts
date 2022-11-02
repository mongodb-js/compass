import { expect } from 'chai';

import { createConnectionAttempt } from './connection-attempt';

describe('ConnectionAttempt Module', function () {
  describe('connect', function () {
    it('returns the connected data service', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(null), 25));
        return dataService;
      });
      const connectionAttemptResult = await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });
      expect(connectionAttemptResult).to.deep.equal(dataService);
    });

    it('returns undefined if is cancelled', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(null), 100));
        return dataService;
      });

      const connectPromise = connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(await connectPromise).to.equal(undefined);
    });

    it('throws if connecting throws', async function () {
      try {
        const connectionAttempt = createConnectionAttempt(
          async (): Promise<any> => {
            await new Promise((resolve) => setTimeout(() => resolve(null), 5));

            throw new Error('should have been thrown');
          }
        );

        await connectionAttempt.connect({
          connectionString: 'mongodb://localhost:27017',
        });

        expect(false, 'It should have errored');
      } catch (err) {
        expect(err.message).to.equal('should have been thrown');
      }
    });

    it('after successfully connecting it disconnects when close is called', async function () {
      let calledToDisconnect = false;
      const dataService = {
        disconnect: () => {
          calledToDisconnect = true;
          return Promise.resolve();
        },
      } as any;
      const connectionAttempt = createConnectionAttempt(async () => {
        await new Promise((resolve) =>
          setTimeout(() => resolve(undefined), 25)
        );
        return dataService;
      });
      await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(calledToDisconnect).to.equal(true);
    });
  });
});
