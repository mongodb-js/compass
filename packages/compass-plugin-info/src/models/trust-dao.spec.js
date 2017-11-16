import { load, save, remove } from 'models/trust-dao';

const TEST_SERVICE = 'compass-security-dao-spec';

describe('TrustDAO', () => {
  describe('#load', () => {
    beforeEach((done) => {
      remove(TEST_SERVICE).then(() => {
        done();
      });
    });

    context('when the settings dont exist', () => {
      it('yields an empty object', (done) => {
        load(TEST_SERVICE).then((trust) => {
          expect(trust).to.deep.equal({});
          done();
        });
      });
    });

    context('when the settings exist', () => {
      beforeEach((done) => {
        save(TEST_SERVICE, { pluginName: true }).then(() => {
          done();
        });
      });

      afterEach((done) => {
        remove(TEST_SERVICE).then(() => {
          done();
        });
      });

      it('returns the persisted settings', (done) => {
        load(TEST_SERVICE).then((trust) => {
          expect(trust.pluginName).to.equal(true);
          done();
        });
      });
    });
  });

  describe('#save', () => {

  });
});
