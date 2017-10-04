import Store from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('QueryBarStore [Store]', () => {
  const registry = new AppRegistry();

  before(() => {
    registry.registerStore('QueryBarStore', Store);
    registry.onActivated();
  });

  beforeEach(() => {
    Store.setState(Store.getInitialState());
  });

  describe('AppRegistry#emit collection-changed', () => {
    it('updates the namespace', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.ns).to.equal('db.test');
        done();
      });
      registry.emit('collection-changed', 'db.test');
    });
  });

  describe('AppRegistry#emit database-changed', () => {
    it('updates the namespace', (done) => {
      const unsubscribe = Store.listen((state) => {
        unsubscribe();
        expect(state.ns).to.equal('db.test');
        done();
      });
      registry.emit('database-changed', 'db.test');
    });
  });
});
