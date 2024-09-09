import { expect } from 'chai';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import {
  QueryBarActions,
  applyFromHistory,
  applyQuery,
  changeField,
  explainQuery,
  resetQuery,
  saveRecentAsFavorite,
  setQuery,
} from './query-bar-reducer';
import { configureStore } from './query-bar-store';
import type { QueryBarExtraArgs, RootState } from './query-bar-store';
import Sinon from 'sinon';
import type AppRegistry from 'hadron-app-registry';
import { mapQueryToFormFields } from '../utils/query';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { waitFor } from '@mongodb-js/testing-library-compass';

function createStore(
  opts: Partial<RootState['queryBar']> = {},
  services: QueryBarExtraArgs
) {
  return configureStore(opts, services);
}

describe('queryBarReducer', function () {
  let store: ReturnType<typeof createStore>;
  let preferences: PreferencesAccess;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    store = createStore({}, {
      preferences,
      logger: createNoopLogger(),
      track: createNoopTrack(),
    } as QueryBarExtraArgs);
  });

  afterEach(function () {
    Sinon.restore();
  });

  describe('changeField', function () {
    const specs: [QueryProperty, string, unknown, boolean][] = [
      ['filter', '{ foo: true }', { foo: true }, true],
      ['filter', '{ bar', DEFAULT_QUERY_VALUES['filter'], false],

      ['project', '{ bla: 1}', { bla: 1 }, true],
      ['project', '{ meow:', DEFAULT_QUERY_VALUES['project'], false],

      ['sort', '[["foo", 1]]', [['foo', 1]], true],
      ['sort', '[[', DEFAULT_QUERY_VALUES['sort'], false],

      ['skip', '10', 10, true],
      ['skip', '-10', DEFAULT_QUERY_VALUES['skip'], false],

      ['limit', '1000', 1000, true],
      ['limit', '-1000', DEFAULT_QUERY_VALUES['limit'], false],

      ['collation', '{ locale: "simple" }', { locale: 'simple' }, true],
      ['collation', '{ lang: "en" }', DEFAULT_QUERY_VALUES['collation'], false],

      ['maxTimeMS', '1', 1, true],
      ['maxTimeMS', '-1', DEFAULT_QUERY_VALUES['maxTimeMS'], false],
    ];

    specs.forEach(([field, str, expectedValue, expectedValid]) => {
      const spec = `should update field "${field}" to a ${
        expectedValid ? 'valid' : 'invalid'
      } value`;

      it(spec, function () {
        function getField() {
          return store.getState().queryBar.fields[field];
        }
        expect(getField()).to.have.property('string', '');
        expect(getField()).to.have.property(
          'value',
          DEFAULT_QUERY_VALUES[field]
        );
        expect(getField()).to.have.property('valid', true);
        store.dispatch(changeField(field, str));
        expect(getField()).to.have.property('string', str);
        expect(getField()).to.have.property('value').deep.eq(expectedValue);
        expect(getField()).to.have.property('valid', expectedValid);
      });
    });
  });

  describe('setQuery', function () {
    it('should set field properties from valid query options', function () {
      store.dispatch(
        setQuery({
          filter: { _id: '123' },
          project: { _id: 1 },
          sort: { _id: -1 },
          skip: -10,
          limit: -100,
          collation: { lang: 'en' },
          maxTimeMS: -1000,
        })
      );

      function getField(field: QueryProperty) {
        return store.getState().queryBar.fields[field];
      }

      expect(getField('filter'))
        .to.have.property('value')
        .deep.eq({ _id: '123' });
      expect(getField('filter')).to.have.property('string', '{ _id: "123" }');
      expect(getField('filter')).to.have.property('valid', true);

      expect(getField('project')).to.have.property('value').deep.eq({ _id: 1 });
      expect(getField('project')).to.have.property('string', '{ _id: 1 }');
      expect(getField('project')).to.have.property('valid', true);

      expect(getField('sort')).to.have.property('value').deep.eq({ _id: -1 });
      expect(getField('sort')).to.have.property('string', '{ _id: -1 }');
      expect(getField('sort')).to.have.property('valid', true);

      expect(getField('skip')).to.have.property(
        'value',
        DEFAULT_QUERY_VALUES['skip']
      );
      expect(getField('limit')).to.have.property(
        'value',
        DEFAULT_QUERY_VALUES['limit']
      );
      expect(getField('collation')).to.have.property(
        'value',
        DEFAULT_QUERY_VALUES['collation']
      );
      expect(getField('maxTimeMS')).to.have.property(
        'value',
        DEFAULT_QUERY_VALUES['maxTimeMS']
      );
    });
  });

  describe('applyQuery', function () {
    it('should "apply" query if query is valid', function () {
      store.dispatch(setQuery({ filter: { _id: '123' }, limit: 10 }));
      const appliedQuery = store.dispatch(applyQuery('test') as any);
      expect(appliedQuery).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        filter: { _id: '123' },
        limit: 10,
      });
      expect(store.getState().queryBar)
        .to.have.nested.property('lastAppliedQuery.query.test')
        .deep.eq(appliedQuery);
    });

    it('should not "apply" query if query is invalid', function () {
      store.dispatch(changeField('filter', '{ _id'));
      const appliedQuery = store.dispatch(applyQuery('test') as any);
      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
    });

    it('should not re-save favorite query in recents', async function () {
      const updateAttributesStub = Sinon.stub();
      const saveQueriesStub = Sinon.stub().resolves();
      const loadAllStub = Sinon.stub().resolves([
        { filter: { _id: '123' }, limit: 10 },
      ]);
      const favoriteQueriesStorage = {
        updateAttributes: updateAttributesStub,
        loadAll: loadAllStub,
      };
      const recentQueriesStorage = {
        saveQuery: saveQueriesStub,
      };
      preferences = await createSandboxFromDefaultPreferences();
      const store = createStore({}, {
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        favoriteQueryStorage: favoriteQueriesStorage,
        recentQueryStorage: recentQueriesStorage,
      } as any);

      const queryAction = setQuery({ filter: { _id: '123' }, limit: 10 });
      store.dispatch(queryAction);
      store.dispatch(applyQuery('test'));
      await waitFor(() => {
        expect(saveQueriesStub.calledOnce).to.be.true;
      });
      await store.dispatch(
        saveRecentAsFavorite(saveQueriesStub.firstCall.firstArg, 'favorite')
      );
      await waitFor(() => {
        expect(loadAllStub.called).to.be.true;
      });
      const appliedQuery = store.dispatch(applyQuery('test'));

      expect(appliedQuery).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        filter: { _id: '123' },
        limit: 10,
      });
      expect(store.getState().queryBar)
        .to.have.nested.property('lastAppliedQuery.query.test')
        .deep.eq(appliedQuery);

      // updateAttributes is called in saveRecentAsFavorite and updateFavoriteQuery
      expect(updateAttributesStub).to.have.been.calledTwice;
      expect(saveQueriesStub).not.to.have.been.calledTwice;
    });
  });

  describe('resetQuery', function () {
    it('should reset query form if last applied query is different from the default query', function () {
      const query = { filter: { _id: 1 } };
      store.dispatch(setQuery(query));
      store.dispatch(applyQuery('test'));
      expect(store.getState().queryBar)
        .to.have.nested.property('lastAppliedQuery.query.test')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
          ...query,
        });
      const wasReset = store.dispatch(resetQuery('test'));
      expect(wasReset).to.deep.eq(DEFAULT_QUERY_VALUES);
      expect(store.getState().queryBar).to.have.nested.property(
        'lastAppliedQuery.query.test',
        null
      );
    });

    it('should not reset query if last applied query is default query', function () {
      // Resetting without applying at all first
      let wasReset = store.dispatch(resetQuery('test'));
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
      expect(wasReset).to.eq(false);
      // Now apply default query and try to reset again
      store.dispatch(applyQuery('test'));
      wasReset = store.dispatch(resetQuery('test'));
      expect(wasReset).to.eq(false);
      expect(store.getState().queryBar)
        .to.have.nested.property('lastAppliedQuery.query.test')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
        });
    });
  });

  describe('applyFromHistory', function () {
    it('should reset query to whatever was passed in the action', function () {
      const newQuery = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };

      store.dispatch(applyFromHistory(newQuery));

      expect(store.getState().queryBar)
        .to.have.nested.property('fields.filter.value')
        .deep.eq(newQuery.filter);
      expect(store.getState().queryBar).to.have.nested.property(
        'fields.filter.string',
        '{ _id: 2 }'
      );

      expect(store.getState().queryBar)
        .to.have.nested.property('fields.sort.value')
        .deep.eq(newQuery.sort);
      expect(store.getState().queryBar).to.have.nested.property(
        'fields.sort.string',
        '{ _id: -1 }'
      );
    });

    it('should auto expand when the query contains extra options', function () {
      const queryNoExtraOptions = {
        filter: { _id: 2 },
      };
      store.dispatch(applyFromHistory(queryNoExtraOptions));
      expect(store.getState().queryBar.expanded).to.be.false;

      const queryWithExtraOptions = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };
      store.dispatch(applyFromHistory(queryWithExtraOptions));
      expect(store.getState().queryBar.expanded).to.be.true;
    });
  });

  describe('isReadonlyConnection', function () {
    it('should refresh the readonly status when requested', function () {
      store.dispatch({
        type: QueryBarActions.ChangeReadonlyConnectionStatus,
        readonly: true,
      });

      expect(store.getState().queryBar.isReadonlyConnection).to.be.true;
    });
  });

  describe('explainQuery', function () {
    it('should call localAppStorage with a correct query', function () {
      const localAppRegistry = {
        on: Sinon.spy(),
        emit: Sinon.spy(),
      } as unknown as AppRegistry;
      const store = createStore(
        {
          fields: mapQueryToFormFields(
            { maxTimeMS: undefined },
            {
              ...DEFAULT_FIELD_VALUES,
              filter: { _id: { $exists: true } },
              project: { _id: 1 },
              limit: 10,
            }
          ),
        },
        { localAppRegistry } as any
      );
      store.dispatch(explainQuery());
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localAppRegistry.emit).to.have.been.calledOnceWith(
        'open-explain-plan-modal',
        {
          query: {
            filter: { _id: { $exists: true } },
            collation: null,
            sort: null,
            hint: null,
            skip: 0,
            limit: 10,
            maxTimeMS: 60000,
            projection: { _id: 1 },
          },
        }
      );
    });
  });
});
