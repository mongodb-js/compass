import AppRegistry from 'hadron-app-registry';
import store from 'stores';
import { reset } from 'modules';

describe('Collection Store', () => {
  const appRegistry = new AppRegistry();

  describe('#onActivated', () => {
    beforeEach(() => {
      store.onActivated(appRegistry);
    });

    afterEach(() => {
      store.dispatch(reset());
    });

    it('sets the app registry in the state', () => {
      expect(store.getState().appRegistry).to.deep.equal(appRegistry);
    });

    context('when the data service is connected', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', 'error', 'ds');
      });

      it('sets the data service in the state', () => {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', () => {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });

    context('when the server version changes', () => {
      beforeEach(() => {
        appRegistry.emit('server-version-changed', '4.2.0');
      });

      it('sets the server version in the state', () => {
        expect(store.getState().serverVersion).to.equal('4.2.0');
      });
    });

    context('when a namespace is selected', () => {
      context.skip('when the namespace has a collection', () => {
        beforeEach(() => {
          appRegistry.emit('select-namespace', { namespace: 'db.coll' });
        });

        it('creates a tab in the store', () => {
          expect(store.getState().tabs[0].namespace).to.equal('db.coll');
        });
      });

      context('when the namespace does not have a collection', () => {
        beforeEach(() => {
          appRegistry.emit('select-namespace', { namespace: 'db' });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is null', () => {
        beforeEach(() => {
          appRegistry.emit('select-namespace', { namespace: null });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is undefined', () => {
        beforeEach(() => {
          appRegistry.emit('select-namespace', {});
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is empty', () => {
        beforeEach(() => {
          appRegistry.emit('select-namespace', { namespace: '' });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });
    });

    context('when a opening a namespace in a new tab', () => {
      context.skip('when the namespace has a collection', () => {
        beforeEach(() => {
          appRegistry.emit('open-namespace-in-new-tab', { namespace: 'db.coll' });
        });

        it('creates a tab in the store', () => {
          expect(store.getState().tabs[0].namespace).to.equal('db.coll');
        });
      });

      context('when the namespace does not have a collection', () => {
        beforeEach(() => {
          appRegistry.emit('open-namespace-in-new-tab', { namespace: 'db' });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is null', () => {
        beforeEach(() => {
          appRegistry.emit('open-namespace-in-new-tab', { namespace: null });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is undefined', () => {
        beforeEach(() => {
          appRegistry.emit('open-namespace-in-new-tab', {});
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });

      context('when the namespace is empty', () => {
        beforeEach(() => {
          appRegistry.emit('open-namespace-in-new-tab', { namespace: '' });
        });

        it('does not create a tab in the store', () => {
          expect(store.getState().tabs).to.have.length(0);
        });
      });
    });
  });
});
