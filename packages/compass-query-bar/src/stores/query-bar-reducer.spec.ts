import { expect } from 'chai';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import {
  QueryBarActions,
  applyFilterChange,
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

      it(spec, async function () {
        function getField() {
          return store.getState().queryBar.fields[field];
        }
        expect(getField()).to.have.property('string', '');
        expect(getField()).to.have.property(
          'value',
          DEFAULT_QUERY_VALUES[field]
        );
        expect(getField()).to.have.property('valid', true);
        await store.dispatch(changeField(field, str));
        expect(getField()).to.have.property('string', str);
        expect(getField()).to.have.property('value').deep.eq(expectedValue);
        expect(getField()).to.have.property('valid', expectedValid);
      });
    });

    it('shows the new text before validation finishes', function () {
      void store.dispatch(changeField('filter', '{ foo: 1 }'));

      expect(store.getState().queryBar.fields.filter.string).to.equal(
        '{ foo: 1 }'
      );
    });

    it('keeps the latest text when an older validation finishes last', async function () {
      const typing = store.dispatch(changeField('filter', '{ foo: 1 }'));
      const clearing = store.dispatch(changeField('filter', ''));
      // Finish the clearing first, so the older filter's result arrives last
      await clearing;
      await typing;

      expect(store.getState().queryBar.fields.filter).to.deep.equal({
        string: '',
        value: DEFAULT_QUERY_VALUES.filter,
        valid: true,
      });
    });
  });

  describe('setQuery', function () {
    it('should set field properties from valid query options', async function () {
      await store.dispatch(
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

  describe('applyFilterChange', function () {
    it('keeps both changes when applied in quick succession', async function () {
      await Promise.all([
        store.dispatch(
          applyFilterChange({
            type: 'setValue',
            payload: { field: 'a', value: 1 },
          })
        ),
        store.dispatch(
          applyFilterChange({
            type: 'setValue',
            payload: { field: 'b', value: 2 },
          })
        ),
      ]);

      const { filter } = store.getState().queryBar.fields;
      expect(filter.value).to.deep.eq({ a: 1, b: 2 });
      expect(filter.string).to.eq('{ a: 1, b: 2 }');
      expect(store.getState().queryBar.pendingParseFieldRequestIds).to.deep.eq(
        {}
      );
    });

    it('does not allow applying until the filter text is updated', async function () {
      const changing = store.dispatch(
        applyFilterChange({
          type: 'setValue',
          payload: { field: 'a', value: 1 },
        })
      );
      const appliedQuery = await store.dispatch(applyQuery('test') as any);
      await changing;

      expect(appliedQuery).to.eq(false);
    });

    it('keeps the filter invalid while its text is still invalid', async function () {
      await store.dispatch(changeField('filter', '{ a:'));
      const changing = store.dispatch(
        applyFilterChange({
          type: 'setValue',
          payload: { field: 'b', value: 1 },
        })
      );

      expect(store.getState().queryBar.fields.filter.valid).to.be.false;
      await changing;
    });

    it('keeps a filter text edit that is still being validated', async function () {
      const typing = store.dispatch(changeField('filter', '{ a: 1 }'));
      const changing = store.dispatch(
        applyFilterChange({
          type: 'setValue',
          payload: { field: 'b', value: 2 },
        })
      );
      await Promise.all([typing, changing]);

      expect(store.getState().queryBar.fields.filter).to.deep.eq({
        string: '{ a: 1 }',
        value: { a: 1 },
        valid: true,
      });
    });

    it('keeps a query filter that is still being parsed', async function () {
      const setting = store.dispatch(setQuery({ filter: { a: 1 } }));
      const changing = store.dispatch(
        applyFilterChange({
          type: 'setValue',
          payload: { field: 'b', value: 2 },
        })
      );
      await Promise.all([setting, changing]);

      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        a: 1,
      });
    });

    it('builds on a filter text edit once it is validated', async function () {
      await store.dispatch(changeField('filter', '{ a: 1 }'));
      await store.dispatch(
        applyFilterChange({
          type: 'setValue',
          payload: { field: 'b', value: 2 },
        })
      );

      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        a: 1,
        b: 2,
      });
    });
  });

  describe('setQuery races', function () {
    it('keeps a field edited while the query is parsed', async function () {
      const setting = store.dispatch(setQuery({ filter: { a: 1 }, limit: 5 }));
      await store.dispatch(changeField('filter', '{ b: 1 }'));
      await setting;

      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        b: 1,
      });
      expect(store.getState().queryBar.fields.limit.value).to.eq(5);
    });

    it('keeps an edit that finishes validating before the query is parsed', async function () {
      const setting = store.dispatch(setQuery({ filter: { a: 1 } }));
      store.dispatch({
        type: QueryBarActions.ChangeFieldText,
        name: 'filter',
        string: '{ b: 1 }',
        requestId: 'edit',
      });
      store.dispatch({
        type: QueryBarActions.ChangeField,
        name: 'filter',
        requestId: 'edit',
        value: { string: '{ b: 1 }', valid: true, value: { b: 1 } },
      });
      await setting;

      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        b: 1,
      });
    });

    it('keeps a reset made while the query is parsed', async function () {
      await store.dispatch(setQuery({ filter: { a: 1 } }));
      const setting = store.dispatch(setQuery({ filter: { b: 1 } }));
      store.dispatch(resetQuery('test'));
      await setting;

      expect(store.getState().queryBar.fields.filter.string).to.eq('');
    });

    it('applies the latest of two queries', async function () {
      const first = store.dispatch(setQuery({ filter: { a: 1 } }));
      const second = store.dispatch(setQuery({ filter: { b: 1 } }));
      await Promise.all([first, second]);

      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        b: 1,
      });
      expect(store.getState().queryBar.pendingParseFieldRequestIds).to.deep.eq(
        {}
      );
    });

    it('does not allow applying while the query is parsed', async function () {
      const setting = store.dispatch(setQuery({ filter: { a: 1 } }));
      const appliedQuery = await store.dispatch(applyQuery('test') as any);
      await setting;

      expect(appliedQuery).to.eq(false);
    });
  });

  describe('applyFromHistory races', function () {
    it('keeps a field edited while the history query is parsed', async function () {
      const applying = store.dispatch(
        applyFromHistory({ filter: { a: 1 }, limit: 5 })
      );
      const changing = store.dispatch(changeField('filter', '{ b: 1 }'));
      await applying;
      await changing;

      const { fields, pendingParseFieldRequestIds } = store.getState().queryBar;
      expect(fields.filter.value).to.deep.eq({ b: 1 });
      expect(fields.limit.string).to.eq('');
      expect(pendingParseFieldRequestIds).to.deep.eq({});
    });

    it('applies the selection and keeps a retained field edit that is still being validated', async function () {
      const typing = store.dispatch(changeField('filter', '{ a: 1 }'));
      const selecting = store.dispatch(
        applyFromHistory({ sort: { b: 1 } }, ['filter'])
      );
      await Promise.all([typing, selecting]);

      const { fields, pendingParseFieldRequestIds } = store.getState().queryBar;
      expect(fields.filter).to.deep.eq({
        string: '{ a: 1 }',
        value: { a: 1 },
        valid: true,
      });
      expect(fields.sort.value).to.deep.eq({ b: 1 });
      expect(pendingParseFieldRequestIds).to.deep.eq({});
    });

    it('applies the selection when the retained field finishes validating first', async function () {
      store.dispatch({
        type: QueryBarActions.ChangeFieldText,
        name: 'filter',
        string: '{ a: 1 }',
        requestId: 'edit',
      });
      const selecting = store.dispatch(
        applyFromHistory({ sort: { b: 1 } }, ['filter'])
      );
      store.dispatch({
        type: QueryBarActions.ChangeField,
        name: 'filter',
        requestId: 'edit',
        value: { string: '{ a: 1 }', valid: true, value: { a: 1 } },
      });
      await selecting;

      const { fields, pendingParseFieldRequestIds } = store.getState().queryBar;
      expect(fields.filter.value).to.deep.eq({ a: 1 });
      expect(fields.sort.value).to.deep.eq({ b: 1 });
      expect(pendingParseFieldRequestIds).to.deep.eq({});
    });

    it('applies a history query once the retained field is validated', async function () {
      await store.dispatch(changeField('filter', '{ a: 1 }'));
      await store.dispatch(applyFromHistory({ sort: { b: 1 } }, ['filter']));

      const { fields } = store.getState().queryBar;
      expect(fields.filter.value).to.deep.eq({ a: 1 });
      expect(fields.sort.value).to.deep.eq({ b: 1 });
    });

    it('applies a history query while a field that is not retained is validated', async function () {
      const typing = store.dispatch(changeField('project', '{ c: 1 }'));
      const selecting = store.dispatch(
        applyFromHistory({ sort: { b: 1 } }, ['filter'])
      );
      await Promise.all([typing, selecting]);

      expect(store.getState().queryBar.fields.sort.value).to.deep.eq({
        b: 1,
      });
    });

    it('does not open the bulk update modal after a newer edit', async function () {
      const localAppRegistry = {
        on: Sinon.spy(),
        emit: Sinon.spy(),
      } as unknown as AppRegistry;
      const store = createStore({}, {
        preferences,
        localAppRegistry,
      } as unknown as QueryBarExtraArgs);

      const applying = store.dispatch(
        applyFromHistory({ filter: { a: 1 }, update: { $set: { a: 2 } } })
      );
      const changing = store.dispatch(changeField('filter', '{ b: 1 }'));
      await applying;
      await changing;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localAppRegistry.emit).to.not.have.been.calledWith(
        'favorites-open-bulk-update-favorite'
      );
    });
  });

  describe('applyQuery', function () {
    it('should "apply" query if query is valid', async function () {
      await store.dispatch(setQuery({ filter: { _id: '123' }, limit: 10 }));
      const appliedQuery = await store.dispatch(applyQuery('test') as any);
      expect(appliedQuery).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        filter: { _id: '123' },
        limit: 10,
      });
      expect(store.getState().queryBar)
        .to.have.nested.property('lastAppliedQuery.query.test')
        .deep.eq(appliedQuery);
    });

    it('should not "apply" query if query is invalid', async function () {
      await store.dispatch(changeField('filter', '{ _id'));
      const appliedQuery = await store.dispatch(applyQuery('test') as any);
      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
    });

    it('should not "apply" query while a field is being validated', async function () {
      const changing = store.dispatch(changeField('filter', '{ foo: 1 }'));
      const appliedQuery = await store.dispatch(applyQuery('test') as any);
      await changing;

      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
    });

    it('should not "apply" query if fields change during validation', async function () {
      await store.dispatch(setQuery({ filter: { a: 1 } }));
      const applying = store.dispatch(applyQuery('test') as any);
      const changing = store.dispatch(changeField('filter', '{ b: 1 }'));
      const appliedQuery = await applying;
      await changing;

      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
    });

    it('should not "apply" query if a history query is selected during validation', async function () {
      await store.dispatch(setQuery({ filter: { a: 1 } }));
      const applying = store.dispatch(applyQuery('test') as any);
      const selecting = store.dispatch(applyFromHistory({ filter: { b: 1 } }));
      const appliedQuery = await applying;
      await selecting;

      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        b: 1,
      });
    });

    it('should not "apply" query if a query is set during validation', async function () {
      await store.dispatch(setQuery({ filter: { a: 1 } }));
      const applying = store.dispatch(applyQuery('test') as any);
      const setting = store.dispatch(setQuery({ filter: { b: 1 } }));
      const appliedQuery = await applying;
      await setting;

      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
      expect(store.getState().queryBar.fields.filter.value).to.deep.eq({
        b: 1,
      });
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
      await store.dispatch(queryAction);
      await store.dispatch(applyQuery('test'));
      await waitFor(() => {
        expect(saveQueriesStub.calledOnce).to.be.true;
      });
      await store.dispatch(
        saveRecentAsFavorite(saveQueriesStub.firstCall.firstArg, 'favorite')
      );
      await waitFor(() => {
        expect(loadAllStub.called).to.be.true;
      });
      const appliedQuery = await store.dispatch(applyQuery('test'));

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
  });

  describe('resetQuery', function () {
    for (const change of ['changeField', 'setQuery'] as const) {
      it(`should preserve a newer ${change} dispatched immediately after reset`, async function () {
        await store.dispatch(setQuery({ skip: 1 }));

        store.dispatch(resetQuery('test'));
        const changing =
          change === 'changeField'
            ? store.dispatch(changeField('skip', '2'))
            : store.dispatch(setQuery({ skip: 2 }));
        await changing;

        const appliedQuery = await store.dispatch(applyQuery('test'));
        expect(appliedQuery).to.deep.eq({ ...DEFAULT_QUERY_VALUES, skip: 2 });
      });
    }

    it('should reset query form if last applied query is different from the default query', async function () {
      const query = { filter: { _id: 1 } };
      await store.dispatch(setQuery(query));
      await store.dispatch(applyQuery('test'));
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

    it('should not reset query if last applied query is default query', async function () {
      // Resetting without applying at all first
      let wasReset = store.dispatch(resetQuery('test'));
      expect(store.getState().queryBar).to.not.have.nested.property(
        'lastAppliedQuery.query.test'
      );
      expect(wasReset).to.eq(false);
      // Now apply default query and try to reset again
      await store.dispatch(applyQuery('test'));
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
    it('should reset query to whatever was passed in the action', async function () {
      const newQuery = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };

      await store.dispatch(applyFromHistory(newQuery));

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

    it('should not touch the last applied query for a non-update query', async function () {
      await store.dispatch(applyFromHistory({ filter: { _id: 2 } }));

      expect(store.getState().queryBar.lastAppliedQuery).to.deep.eq({
        source: null,
        query: {},
      });
    });

    it('should record the query as the last applied crud query for an update query', async function () {
      await store.dispatch(
        applyFromHistory({ filter: { _id: 2 }, update: { $set: { a: 1 } } })
      );

      expect(store.getState().queryBar.lastAppliedQuery.source).to.eq('crud');
      expect(store.getState().queryBar.lastAppliedQuery.query.crud)
        .to.have.property('filter')
        .deep.eq({ _id: 2 });
    });

    it('should auto expand when the query contains extra options', async function () {
      const queryNoExtraOptions = {
        filter: { _id: 2 },
      };
      await store.dispatch(applyFromHistory(queryNoExtraOptions));
      expect(store.getState().queryBar.expanded).to.be.false;

      const queryWithExtraOptions = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };
      await store.dispatch(applyFromHistory(queryWithExtraOptions));
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
    it('should call localAppStorage with a correct query', async function () {
      const localAppRegistry = {
        on: Sinon.spy(),
        emit: Sinon.spy(),
      } as unknown as AppRegistry;
      const store = createStore(
        {
          fields: await mapQueryToFormFields(
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
