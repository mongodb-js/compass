import { expect } from 'chai';
import { applyMiddleware, createStore as _createStore } from 'redux';
import thunk from 'redux-thunk';
import { DEFAULT_QUERY_VALUES } from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import {
  applyFromHistory,
  applyQuery,
  changeField,
  changeSchemaFields,
  queryBarReducer,
  resetQuery,
  setQuery,
} from './query-bar-reducer';

function createStore() {
  return _createStore(
    queryBarReducer,
    applyMiddleware(thunk.withExtraArgument({}))
  );
}

describe('queryBarReducer', function () {
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
        const store = createStore();
        function getField() {
          return store.getState().fields[field];
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
      const store = createStore();
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
        return store.getState().fields[field];
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
      const store = createStore();
      store.dispatch(setQuery({ filter: { _id: '123' }, limit: 10 }));
      const appliedQuery = store.dispatch(applyQuery() as any);
      expect(appliedQuery).to.deep.eq({
        ...DEFAULT_QUERY_VALUES,
        filter: { _id: '123' },
        limit: 10,
      });
      expect(store.getState())
        .to.have.property('lastAppliedQuery')
        .deep.eq(appliedQuery);
    });

    it('should not "apply" query if query is invalid', function () {
      const store = createStore();
      store.dispatch(changeField('filter', '{ _id'));
      const appliedQuery = store.dispatch(applyQuery() as any);
      expect(appliedQuery).to.eq(false);
      expect(store.getState()).to.have.property('lastAppliedQuery', null);
    });
  });

  describe('resetQuery', function () {
    it('should reset query form if last applied query is different from the default query', function () {
      const store = createStore();
      const query = { filter: { _id: 1 } };
      store.dispatch(setQuery(query));
      store.dispatch(applyQuery());
      expect(store.getState())
        .to.have.property('lastAppliedQuery')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
          ...query,
        });
      const wasReset = store.dispatch(resetQuery());
      expect(wasReset).to.deep.eq(DEFAULT_QUERY_VALUES);
      expect(store.getState()).to.have.property('lastAppliedQuery', null);
    });

    it('should not reset query if last applied query is default query', function () {
      const store = createStore();
      // Resetting without applying at all first
      let wasReset = store.dispatch(resetQuery());
      expect(store.getState()).to.have.property('lastAppliedQuery', null);
      expect(wasReset).to.eq(false);
      // Now apply default query and try to reset again
      store.dispatch(applyQuery());
      wasReset = store.dispatch(resetQuery());
      expect(wasReset).to.eq(false);
      expect(store.getState())
        .to.have.property('lastAppliedQuery')
        .deep.eq({
          ...DEFAULT_QUERY_VALUES,
        });
    });
  });

  describe('changeSchemaFields', function () {
    it('should save fields in the store', function () {
      const store = createStore();
      expect(store.getState()).to.have.property('schemaFields').deep.eq([]);
      const fields = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
      store.dispatch(changeSchemaFields(fields));
      expect(store.getState()).to.have.property('schemaFields').deep.eq(fields);
    });
  });

  describe('applyFromHistory', function () {
    it('should reset query to whatever was passed in the action', function () {
      const store = createStore();
      const newQuery = {
        filter: { _id: 2 },
        sort: { _id: -1 },
      };

      store.dispatch(applyFromHistory(newQuery));

      expect(store.getState())
        .to.have.nested.property('fields.filter.value')
        .deep.eq(newQuery.filter);
      expect(store.getState()).to.have.nested.property(
        'fields.filter.string',
        '{_id: 2}'
      );

      expect(store.getState())
        .to.have.nested.property('fields.sort.value')
        .deep.eq(newQuery.sort);
      expect(store.getState()).to.have.nested.property(
        'fields.sort.string',
        '{_id: -1}'
      );
    });
  });
});
