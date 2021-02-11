import { createConnectionAttempt } from './connection-attempt';

describe('connection-attempt', () => {
  describe('connect', () => {
    it('returns the connected data service', async() => {
      const dataService = {
        connect: (callback) => setTimeout(() => callback(), 25)
      };

      const connectionAttempt = createConnectionAttempt();

      const connectionAttemptResult = await connectionAttempt.connect(
        dataService
      );

      expect(connectionAttemptResult).to.deep.equal(dataService);
    });

    it('returns null if is cancelled', async() => {
      const dataService = {
        connect: () => new Promise((resolve) => {
          setTimeout(() => resolve(), 100);
        })
      };

      const connectionAttempt = createConnectionAttempt();

      const connectPromise = connectionAttempt.connect(
        dataService
      );

      connectionAttempt.cancelConnectionAttempt();

      expect(await connectPromise).to.equal(null);
    });

    it('throws if connecting throws', async() => {
      let rejectOnConnect;
      const dataService = {
        connect: (callback) => {
          rejectOnConnect = callback;
        }
      };

      const connectionAttempt = createConnectionAttempt();

      const connectPromise = connectionAttempt.connect(
        dataService
      ).catch(
        err => err
      );

      rejectOnConnect(new Error('should have been thrown'));

      expect((await connectPromise).message).to.equal('should have been thrown');
    });
  });
});
