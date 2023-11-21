import { expect } from 'chai';
import { promises as fs } from 'fs';
import os from 'os';

import { DEFAULT_QUERY_VALUES } from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import {
  QueryBarActions,
  applyFromHistory,
  applyQuery,
  changeField,
  changeSchemaFields,
  explainQuery,
  resetQuery,
  setQuery,
} from './query-bar-reducer';
import configureStore from './query-bar-store';
import type { QueryBarStoreOptions } from './query-bar-store';
import Sinon from 'sinon';
import type AppRegistry from 'hadron-app-registry';

function createStore(opts: Partial<QueryBarStoreOptions>) {
  return configureStore(opts);
}

describe('queryBarReducer', function () {
  let tmpDir: string;
  let store: ReturnType<typeof createStore>;

  before(async function () {
    tmpDir = await fs.mkdtemp(os.tmpdir());
  });

  beforeEach(function () {
    store = createStore({
      basepath: tmpDir,
    });
  });

  after(async function () {
    await fs.rmdir(tmpDir, { recursive: true });
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
      expect(getField('filter')).to.have.property('string', "{_id: '123'}");
      expect(getField('filter')).to.have.property('valid', true);

      expect(getField('project')).to.have.property('value').deep.eq({ _id: 1 });
      expect(getField('project')).to.have.property('string', '{_id: 1}');
      expect(getField('project')).to.have.property('valid', true);

      expect(getField('sort')).to.have.property('value').deep.eq({ _id: -1 });
      expect(getField('sort')).to.have.property('string', '{_id: -1}');
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
      const appliedQuery = store.dispatch(applyQuery() as any);
      expect(appliedQuery).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        filter: { _id: '123' },
        limit: 10,
      });
      expect(store.getState().queryBar)
        .to.have.property('lastAppliedQuery')
        .deep.eq(appliedQuery);
    });

    it('should not "apply" query if query is invalid', function () {
      store.dispatch(changeField('filter', '{ _id'));
      const appliedQuery = store.dispatch(applyQuery() as any);
      expect(appliedQuery).to.eq(false);
      expect(store.getState().queryBar).to.have.property(
        'lastAppliedQuery',
        null
      );
    });
  });

  describe('resetQuery', function () {
    it('should reset query form if last applied query is different from the default query', function () {
      const query = { filter: { _id: 1 } };
      store.dispatch(setQuery(query));
      store.dispatch(applyQuery());
      expect(store.getState().queryBar)
        .to.have.property('lastAppliedQuery')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
          ...query,
        });
      const wasReset = store.dispatch(resetQuery());
      expect(wasReset).to.deep.eq(DEFAULT_QUERY_VALUES);
      expect(store.getState().queryBar).to.have.property(
        'lastAppliedQuery',
        null
      );
    });

    it('should not reset query if last applied query is default query', function () {
      // Resetting without applying at all first
      let wasReset = store.dispatch(resetQuery());
      expect(store.getState().queryBar).to.have.property(
        'lastAppliedQuery',
        null
      );
      expect(wasReset).to.eq(false);
      // Now apply default query and try to reset again
      store.dispatch(applyQuery());
      wasReset = store.dispatch(resetQuery());
      expect(wasReset).to.eq(false);
      expect(store.getState().queryBar)
        .to.have.property('lastAppliedQuery')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
        });
    });
  });

  describe('changeSchemaFields', function () {
    it('should save fields in the store', function () {
      expect(store.getState().queryBar)
        .to.have.property('schemaFields')
        .deep.eq([]);
      const fields = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
      store.dispatch(changeSchemaFields(fields));
      expect(store.getState().queryBar)
        .to.have.property('schemaFields')
        .deep.eq(fields);
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
        '{_id: 2}'
      );

      expect(store.getState().queryBar)
        .to.have.nested.property('fields.sort.value')
        .deep.eq(newQuery.sort);
      expect(store.getState().queryBar).to.have.nested.property(
        'fields.sort.string',
        '{_id: -1}'
      );
    });
  });

  describe('isReadonlyConnection', function () {
    it('should refresh the readonly status when requested', function () {
      const store = createStore({});
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
      const store = createStore({
        localAppRegistry,
        query: {
          filter: { _id: { $exists: true } },
          project: { _id: 1 },
          limit: 10,
        },
      });
      store.dispatch(explainQuery());
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localAppRegistry.emit).to.have.been.calledOnceWith(
        'open-explain-plan-modal',
        {
          query: {
            filter: { _id: { $exists: true } },
            collation: null,
            sort: null,
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
