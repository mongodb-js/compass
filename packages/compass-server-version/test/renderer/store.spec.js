import Store from '../../src/stores';

describe('ServerVersionStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
    Store.onActivated({ on() {}, emit() {} });
  });

  describe('#onInstanceStatusChange', () => {
    const instance = {
      build: {
        isEnterprise: true,
        version: '3.4.4'
      },
      dataLake: {
        isDataLake: false,
        version: null
      }
    };

    it('sets the state with the version and distro', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.versionNumber).to.equal('3.4.4');
        expect(state.versionDistro).to.equal('Enterprise');
        done();
      });
      Store.onInstanceStatusChange(instance, 'ready');
    });
  });
});
