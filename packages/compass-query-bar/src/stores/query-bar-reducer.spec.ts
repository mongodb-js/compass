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
import type AppRegistry from '@mongodb-js/compass-app-registry';
import { mapQueryToFormFields } from '../utils/query';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import { createSandboxFromDefaultPreferences } from '@mongodb-js/compass-preferences-model';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { waitFor } from '@mongodb-js/testing-library-compass';
import type { RecentQuery } from '@mongodb-js/my-queries-storage';
import { Double, Int32, Long, MinKey, ObjectId } from 'bson';

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

      ['maxTimeMS', '1', 1, true],
      ['maxTimeMS', '-1', DEFAULT_QUERY_VALUES['maxTimeMS'], false],

      ['hint', '"hintPineappleIndex"', 'hintPineappleIndex', true],
      ['hint', '{ pineapple: 1 }', { pineapple: 1 }, true],
      ['hint', 'pineapple', DEFAULT_QUERY_VALUES['hint'], false],
      ['hint', '1', DEFAULT_QUERY_VALUES['hint'], false],
      ['hint', '-1', DEFAULT_QUERY_VALUES['hint'], false],
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
      expect(getField('collation'))
        .to.have.property('value')
        .deep.eq({ lang: 'en' });
      expect(getField('collation')).to.have.property(
        'string',
        '{ lang: "en" }'
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
      // Formatted differently from the applied query
      const loadAllStub = Sinon.stub().resolves([
        { filter: "{_id: '123'}", limit: 10 },
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
      expect(updateAttributesStub).to.have.been.calledOnce;
      expect(saveQueriesStub).not.to.have.been.calledTwice;
    });

    describe('saving recent queries', function () {
      let saveQueryStub: Sinon.SinonStub;
      let updateAttributesStub: Sinon.SinonStub;

      function createStoreWithRecents(recentQueries: RecentQuery[] = []) {
        saveQueryStub = Sinon.stub().resolves();
        updateAttributesStub = Sinon.stub().resolves(true);
        return createStore({ recentQueries, namespace: 'db.coll' }, {
          preferences,
          logger: createNoopLogger(),
          track: createNoopTrack(),
          recentQueryStorage: {
            saveQuery: saveQueryStub,
            updateAttributes: updateAttributesStub,
            loadAll: Sinon.stub().resolves(recentQueries),
          },
        } as unknown as QueryBarExtraArgs);
      }

      function recentQuery(filter: string): RecentQuery {
        return {
          _id: '0f92b5fa-19fe-4200-a4bb-d25765bce8a2',
          _ns: 'db.coll',
          _lastExecuted: new Date(),
          filter,
        };
      }

      it('saves the query strings as they were typed', async function () {
        const store = createStoreWithRecents();
        const filter = `{
  // comments are kept
  _id: ObjectId('507f1f77bcf86cd799439011'),
  count: NumberLong('9007199254740993'),
  date: ISODate('2020-01-01T00:00:00.000Z'),
  nested: { a: [1, { b: Decimal128('1.5') }] }
}`;
        store.dispatch(changeField('filter', filter));
        store.dispatch(changeField('sort', "[['count', -1]]"));
        store.dispatch(changeField('hint', "'count_1'"));
        store.dispatch(changeField('limit', '10'));
        store.dispatch(applyQuery('test'));

        await waitFor(() => {
          expect(saveQueryStub).to.have.been.calledOnce;
        });
        expect(saveQueryStub.firstCall.firstArg).to.deep.equal({
          filter,
          sort: "[['count', -1]]",
          hint: "'count_1'",
          limit: 10,
          _ns: 'db.coll',
          _host: '',
        });
      });

      it('does not save queries with default values', async function () {
        const store = createStoreWithRecents();
        store.dispatch(changeField('filter', '{ /* empty */ }'));
        store.dispatch(changeField('project', '{}'));
        store.dispatch(applyQuery('test'));

        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(saveQueryStub).not.to.have.been.called;
        expect(updateAttributesStub).not.to.have.been.called;
      });

      it('does not save duplicates that are formatted differently', async function () {
        const store = createStoreWithRecents([
          recentQuery("{_id:ObjectId('507f1f77bcf86cd799439011')}"),
        ]);
        store.dispatch(
          changeField(
            'filter',
            "{\n  _id: ObjectId('507f1f77bcf86cd799439011') // comment\n}"
          )
        );
        store.dispatch(applyQuery('test'));

        await waitFor(() => {
          expect(updateAttributesStub).to.have.been.calledOnce;
        });
        expect(saveQueryStub).not.to.have.been.called;
      });

      it('does not treat queries with different long values as duplicates', async function () {
        const store = createStoreWithRecents([
          recentQuery("{ count: NumberLong('9007199254740993') }"),
        ]);
        store.dispatch(
          changeField('filter', "{ count: NumberLong('9007199254740992') }")
        );
        store.dispatch(applyQuery('test'));

        await waitFor(() => {
          expect(saveQueryStub).to.have.been.calledOnce;
        });
        expect(updateAttributesStub).not.to.have.been.called;
      });
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
      store.dispatch(changeField('project', '{ a: 1 }'));
      store.dispatch(
        applyFromHistory({
          filter: '{ _id: 2 }',
          sort: '{ _id: -1 }',
          limit: 10,
        })
      );

      const { fields } = store.getState().queryBar;
      expect(fields.filter.value).to.deep.eq({ _id: 2 });
      expect(fields.filter.string).to.eq('{ _id: 2 }');
      expect(fields.sort.value).to.deep.eq({ _id: -1 });
      expect(fields.sort.string).to.eq('{ _id: -1 }');
      expect(fields.limit.value).to.eq(10);
      expect(fields.limit.string).to.eq('10');
      expect(fields.project.value).to.eq(DEFAULT_QUERY_VALUES.project);
      expect(fields.project.string).to.eq('');
    });

    it('should keep the saved query strings and their BSON values', function () {
      const filter = `{
  // comments are kept
  _id: ObjectId('507f1f77bcf86cd799439011'),
  count: NumberLong('9007199254740993'),
  int: NumberInt(5),
  double: Double(5),
  date: ISODate('2020-01-01T00:00:00.000Z'),
  name: /ber/i,
  nested: { a: [1, { b: MinKey() }] }
}`;
      store.dispatch(applyFromHistory({ filter, hint: "'count_1'" }));

      const { fields } = store.getState().queryBar;
      expect(fields.filter.string).to.eq(filter);
      expect(fields.filter.valid).to.be.true;
      expect(fields.filter.value._id).to.be.instanceOf(ObjectId);
      expect(fields.filter.value.count).to.be.instanceOf(Long);
      expect(fields.filter.value.count.toString()).to.eq('9007199254740993');
      expect(fields.filter.value.int).to.be.instanceOf(Int32);
      expect(fields.filter.value.double).to.be.instanceOf(Double);
      expect(fields.filter.value.date).to.deep.eq(
        new Date('2020-01-01T00:00:00.000Z')
      );
      expect(fields.filter.value.nested.a[1].b).to.be.instanceOf(MinKey);
      expect(fields.hint.value).to.eq('count_1');
    });

    it('should keep invalid saved query strings so that they can be fixed', function () {
      store.dispatch(applyFromHistory({ filter: '{ _id: ' }));

      const { fields } = store.getState().queryBar;
      expect(fields.filter.string).to.eq('{ _id: ');
      expect(fields.filter.valid).to.be.false;
    });

    it('should retain the requested fields as they are', function () {
      store.dispatch(changeField('filter', '{ a: 1 } // current'));
      store.dispatch(changeField('sort', '{ a: '));
      store.dispatch(
        applyFromHistory({ filter: '{ b: 1 }', project: '{ b: 1 }' }, [
          'filter',
          'sort',
        ])
      );

      const { fields } = store.getState().queryBar;
      expect(fields.filter.string).to.eq('{ a: 1 } // current');
      expect(fields.sort.string).to.eq('{ a: ');
      expect(fields.sort.valid).to.be.false;
      expect(fields.project.string).to.eq('{ b: 1 }');
    });

    it('should not touch the last applied query for a non-update query', function () {
      store.dispatch(applyFromHistory({ filter: '{ _id: 2 }' }));

      expect(store.getState().queryBar.lastAppliedQuery).to.deep.eq({
        source: null,
        query: {},
      });
    });

    it('should record the query as the last applied crud query for an update query', function () {
      const localAppRegistry = { emit: Sinon.spy() };
      const store = createStore({}, {
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        localAppRegistry,
      } as unknown as QueryBarExtraArgs);
      const query = {
        filter: "{ _id: ObjectId('507f1f77bcf86cd799439011') }",
        update: '{ $set: { a: 1 } }',
      };
      store.dispatch(applyFromHistory(query));

      expect(store.getState().queryBar.lastAppliedQuery.source).to.eq('crud');
      expect(store.getState().queryBar.lastAppliedQuery.query.crud)
        .to.have.property('filter')
        .deep.eq({ _id: new ObjectId('507f1f77bcf86cd799439011') });
      expect(localAppRegistry.emit).to.have.been.calledOnceWithExactly(
        'favorites-open-bulk-update-favorite',
        query
      );
    });

    it('should not open an update query with an invalid filter', function () {
      const localAppRegistry = { emit: Sinon.spy() };
      const store = createStore({}, {
        preferences,
        logger: createNoopLogger(),
        track: createNoopTrack(),
        localAppRegistry,
      } as unknown as QueryBarExtraArgs);
      store.dispatch(
        applyFromHistory({ filter: '{ _id: ', update: '{ $set: { a: 1 } }' })
      );

      expect(store.getState().queryBar.lastAppliedQuery.source).to.eq(null);
      expect(localAppRegistry.emit).not.to.have.been.called;
    });

    it('should auto expand when the query contains extra options', function () {
      store.dispatch(applyFromHistory({ filter: '{ _id: 2 }' }));
      expect(store.getState().queryBar.expanded).to.be.false;

      store.dispatch(
        applyFromHistory({ filter: '{ _id: 2 }', sort: '{ _id: -1 }' })
      );
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

  describe('isInterpretLoading', function () {
    it('sets isInterpretLoading to true on InterpretStarted action', function () {
      store.dispatch({ type: QueryBarActions.InterpretStarted });
      expect(store.getState().queryBar.isInterpretLoading).to.be.true;
    });

    it('sets isInterpretLoading to false on InterpretFinished action', function () {
      store.dispatch({ type: QueryBarActions.InterpretStarted });
      store.dispatch({ type: QueryBarActions.InterpretFinished });
      expect(store.getState().queryBar.isInterpretLoading).to.be.false;
    });
  });
});
