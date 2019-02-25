import AppRegistry from 'hadron-app-registry';
import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { CollectionStore as store } from 'stores';
import { reset } from 'modules/collection/reset';

const NamespaceStore = Reflux.createStore({
  mixins: [StateMixin.store],
  getInitialState() {
    return { ns: 'initial' };
  },
  get ns() {
    return this.state.ns;
  },
  set ns(ns) {
    this.state.ns = ns;
  }
});

describe('CollectionStore [Store]', () => {
  beforeEach(() => {
    store.dispatch(reset());
  });

  afterEach(() => {
    store.dispatch(reset());
  });

  describe('#onActivated', () => {
    let hold;
    before(() => {
      hold = global.hadronApp.appRegistry;
      global.hadronApp.appRegistry = new AppRegistry();
      global.hadronApp.appRegistry.registerStore('App.NamespaceStore', NamespaceStore);
      store.onActivated(global.hadronApp.appRegistry);
    });
    after(() => {
      global.hadronApp.appRegistry = hold;
    });

    context('when app pipeline results change', () => {
      beforeEach(() => {
        expect(store.getState().collection).to.deep.equal({}); // initial state
        global.hadronApp.appRegistry.emit('show-agg-pipeline-out-results', 'db.coll');
      });

      it('dispatches the change collection action', () => {
        expect(store.getState().collection).to.deep.equal({
          _id: 'db.coll',
          readonly: false,
          capped: false,
          isCustomCollation: false
        });
      });
    });
    context('call public setCollection method', () => {
      beforeEach(() => {
        expect(store.getState().collection).to.deep.equal({}); // initial state
        store.setCollection({
          _id: 'db.test',
          readonly: true,
          capped: false,
          isCustomCollation: false
        });
      });

      it('dispatches the change collection action', () => {
        expect(store.getState().collection).to.deep.equal({
          _id: 'db.test',
          readonly: true,
          capped: false,
          isCustomCollation: false
        });
      });
      it('sets the ns store', () => {
        expect(global.hadronApp.appRegistry.getStore('App.NamespaceStore').ns).to.equal('db.test');
      });
      it('public ns method', () => {
        expect(store.ns()).to.equal('db.test');
      });
      it('public isReadonly method', () => {
        expect(store.isReadonly()).to.equal(true);
      });
    });
    context('call public setTabs method', () => {
      beforeEach(() => {
        expect(store.getState().tabs).to.deep.equal([]); // initial state
        store.setTabs([1, 3, 5]);
      });

      it('dispatches the change tabs action', () => {
        expect(store.getState().tabs).to.deep.equal([1, 3, 5]);
      });
    });
    context('call public setActiveTab method', () => {
      let emit;
      beforeEach(() => {
        emit = global.hadronApp.appRegistry.emit;
        global.hadronApp.appRegistry.emit = sinon.spy();
        expect(store.getState().activeTabIndex).to.deep.equal(0); // initial state
        store.setTabs([1, 3, 5]);
        store.setActiveTab(1);
      });
      afterEach(() => {
        global.hadronApp.appRegistry.emit = emit;
      });

      it('dispatches the change tabs action', () => {
        expect(store.getState().activeTabIndex).to.equal(1);
      });
      it('getActiveTab returns correct', () => {
        expect(store.getActiveTab()).to.equal(1);
      });
      it('emits active-tab-changed', () => {
        expect(global.hadronApp.appRegistry.emit.called).to.equal(true);
        expect(global.hadronApp.appRegistry.emit.args[0]).to.deep.equal(
          ['active-tab-changed', 3]
        );
      });
    });
  });
});
