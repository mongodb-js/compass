import { expect } from 'chai';
import sinon from 'sinon';
import { createLogger } from '@mongodb-js/compass-logging';

import { createConnectionAttempt } from './connection-attempt';
import type { UnboundDataServiceImplLogger } from './logger';

const { mongoLogId } = createLogger('CONNECTION-ATTEMPT-TEST');

describe('ConnectionAttempt Module', function () {
  let logger: UnboundDataServiceImplLogger;

  beforeEach(function () {
    logger = {
      mongoLogId,
      debug: sinon.spy(),
      info: sinon.spy(),
      warn: sinon.spy(),
      error: sinon.spy(),
      fatal: sinon.spy(),
    };
  });

  describe('connect', function () {
    it('returns the connected data service', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt({
        connectFn: async () => {
          await new Promise((resolve) => setTimeout(() => resolve(null), 25));
          return dataService;
        },
        logger,
      });
      const connectionAttemptResult = await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });
      expect(connectionAttemptResult).to.deep.equal(dataService);
    });

    it('returns undefined if is cancelled', async function () {
      const dataService = {} as any;
      const connectionAttempt = createConnectionAttempt({
        connectFn: async () => {
          await new Promise((resolve) => setTimeout(() => resolve(null), 100));
          return dataService;
        },
        logger,
      });

      const connectPromise = connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(await connectPromise).to.equal(undefined);
    });

    it('throws if connecting throws', async function () {
      try {
        const connectionAttempt = createConnectionAttempt({
          connectFn: async (): Promise<any> => {
            await new Promise((resolve) => setTimeout(() => resolve(null), 5));

            throw new Error('should have been thrown');
          },
          logger,
        });

        await connectionAttempt.connect({
          connectionString: 'mongodb://localhost:27017',
        });

        expect(false, 'It should have errored');
      } catch (err) {
        expect((err as Error).message).to.equal('should have been thrown');
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
      const connectionAttempt = createConnectionAttempt({
        connectFn: async () => {
          await new Promise((resolve) =>
            setTimeout(() => resolve(undefined), 25)
          );
          return dataService;
        },
        logger,
      });
      await connectionAttempt.connect({
        connectionString: 'mongodb://localhost:27017',
      });

      connectionAttempt.cancelConnectionAttempt();

      expect(calledToDisconnect).to.equal(true);
    });
  });
});
