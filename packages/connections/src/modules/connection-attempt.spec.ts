import { expect } from 'chai';

import { createConnectionAttempt } from './connection-attempt';

describe('ConnectionAttempt Module', function () {
  describe('connect', function () {
    it('returns the connected data service', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(dataService), 25)
        );
      });
      const connectionAttemptResult = await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });
      expect(connectionAttemptResult).to.deep.equal(dataService);
    });

    it('returns undefined if is cancelled', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(dataService), 100)
        );
      });

      const connectPromise = connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(await connectPromise).to.equal(undefined);
    });

    it('throws if connecting throws', async function () {
      let rejectOnConnect;
      const connectionAttempt = createConnectionAttempt(() => {
        return new Promise((_, reject) => {
          rejectOnConnect = reject;
        });
      });

      const connectPromise = connectionAttempt
        .connect({
          connectionString: 'mongodb://localhost:27017',
        })
        .catch((err) => err);

      rejectOnConnect(new Error('should have been thrown'));

      expect((await connectPromise).message).to.equal(
        'should have been thrown'
      );
    });

    it('after successfully connecting it disconnects when close is called', async function () {
      let calledToDisconnect = false;
      const dataService = {
        disconnect: () => {
          calledToDisconnect = true;
          return Promise.resolve();
        },
      } as any;
      const connectionAttempt = createConnectionAttempt(() => {
        return new Promise((resolve) =>
          setTimeout(() => resolve(dataService), 25)
        );
      });
      await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(calledToDisconnect).to.equal(true);
    });
  });
});
