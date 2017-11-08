import Store from 'stores';

describe('ServerVersionStore [Store]', () => {
  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  describe('#onInstanceFetched', () => {
    const s = {
      instance: {
        build: {
          enterprise_module: true,
          version: '3.4.4'
        }
      }
    };

    it('sets the state with the version and distro', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.versionNumber).to.equal('3.4.4');
        expect(state.versionDistro).to.equal('Enterprise');
        done();
      });
      Store.onInstanceFetched(s);
    });
  });
});
