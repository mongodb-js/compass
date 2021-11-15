import Store from './';

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
        expect(state.isDataLake).to.equal(false);
        done();
      });
      Store.onInstanceStatusChange(instance, 'ready');
    });
  });

  describe('#onInstanceStatusChange with DataLake', () => {
    const instance = {
      build: {
        isEnterprise: true,
        version: '3.4.4'
      },
      dataLake: {
        isDataLake: true,
        version: '1.0.0'
      }
    };

    it('sets the state with the version and distro', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.versionNumber).to.equal('3.4.4');
        expect(state.versionDistro).to.equal('Enterprise');
        expect(state.isDataLake).to.equal(true);
        expect(state.dataLakeVersion).to.equal('1.0.0');
        done();
      });
      Store.onInstanceStatusChange(instance, 'ready');
    });
  });
});
