import configureStore from '.';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import sinon from 'sinon';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';

describe('Schema Store', function () {
  describe('#configureStore', function () {
    let store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const dataService = 'test';
    const namespace = 'db.coll';

    beforeEach(function () {
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        namespace: namespace,
      });
    });

    afterEach(function () {
      store = null;
    });

    it('sets the local app registry', function () {
      expect(store.localAppRegistry).to.equal(localAppRegistry);
    });

    it('sets the global app registry', function () {
      expect(store.globalAppRegistry).to.equal(globalAppRegistry);
    });

    it('sets the data provider', function () {
      expect(store.dataService).to.equal(dataService);
    });

    it('sets the namespace', function () {
      expect(store.ns).to.equal(namespace);
    });

    it('defaults analysis state to initial', function () {
      expect(store.state.analysisState).to.equal(ANALYSIS_STATE_INITIAL);
    });

    it('defaults the error to empty', function () {
      expect(store.state.errorMessage).to.equal('');
    });

    it('defaults max time ms to the default', function () {
      expect(store.query.maxTimeMS).to.equal(60000);
    });

    it('defaults the schema to null', function () {
      expect(store.state.schema).to.equal(null);
    });
  });

  context('when query change events are emitted', function () {
    let store;
    const localAppRegistry = new AppRegistry();
    const filter = { name: 'test' };
    const limit = 50;
    const project = { name: 1 };

    beforeEach(function () {
      store = configureStore({ localAppRegistry: localAppRegistry });
      localAppRegistry.emit('query-changed', {
        filter: filter,
        limit: limit,
        project: project,
      });
    });

    afterEach(function () {
      store = null;
    });

    it('sets the filter', function () {
      expect(store.query.filter).to.deep.equal(filter);
    });

    it('sets the limit', function () {
      expect(store.query.limit).to.deep.equal(limit);
    });

    it('sets the project', function () {
      expect(store.query.project).to.deep.equal(project);
    });
  });

  context('#onExportToLanguage', function () {
    let store;
    let localAppRegistryEmitSpy;
    let globalAppRegistryEmitSpy;

    beforeEach(function () {
      const globalAppRegistry = new AppRegistry();
      const localAppRegistry = new AppRegistry();
      globalAppRegistryEmitSpy = sinon.spy();
      localAppRegistryEmitSpy = sinon.spy();
      sinon.replace(globalAppRegistry, 'emit', globalAppRegistryEmitSpy);
      sinon.replace(localAppRegistry, 'emit', localAppRegistryEmitSpy);

      store = configureStore({
        globalAppRegistry,
        localAppRegistry,
      });

      expect(globalAppRegistryEmitSpy.called).to.be.false;
      expect(localAppRegistryEmitSpy.called).to.be.false;

      store.onExportToLanguage({
        filterString: '123',
        projectString: 'abc',
        sortString: '',
        collationString: '',
        skipString: '',
        limitString: '',
        maxTimeMSString: '',
      });
    });

    afterEach(function () {
      store = null;
      sinon.restore();
    });

    it('emits the event with the query options to the local app registry', function () {
      expect(localAppRegistryEmitSpy.calledOnce).to.be.true;
      expect(localAppRegistryEmitSpy.firstCall.args[0]).to.equal(
        'open-query-export-to-language'
      );
      expect(localAppRegistryEmitSpy.firstCall.args[1]).to.deep.equal({
        filter: '123',
        project: 'abc',
        sort: '',
        collation: '',
        skip: '',
        limit: '',
        maxTimeMS: '',
      });
    });
  });
});
