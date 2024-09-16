import { expect } from 'chai';
import sinon from 'sinon';

import { setupStore } from '../../test/setup-store';

import {
  createIndex,
  updateFieldName,
  fieldAdded,
  fieldRemoved,
  fieldTypeUpdated,
  optionChanged,
  optionToggled,
  createIndexOpened,
  createIndexClosed,
  errorCleared,
  INITIAL_STATE,
} from './create-index';
import type { IndexesStore } from '../stores/store';

describe('create-index module', function () {
  let store: IndexesStore;
  beforeEach(function () {
    store = setupStore();
  });

  describe('#createIndex', function () {
    beforeEach(function () {
      store.dispatch(updateFieldName(0, 'foo'));
      store.dispatch(fieldTypeUpdated(0, 'text'));
    });

    it('validates field name & type', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          fields: [
            {
              name: '',
              type: '',
            },
          ],
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'You must select a field name and type'
      );
    });

    it('validates collation', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            collation: {
              ...store.getState().createIndex.options.collation,
              enabled: true,
              value: 'not a collation',
            },
          },
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'You must provide a valid collation object'
      );
    });

    it('validates TTL', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            expireAfterSeconds: {
              ...store.getState().createIndex.options.expireAfterSeconds,
              enabled: true,
              value: 'not a ttl',
            },
          },
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'Bad TTL: "not a ttl"'
      );
    });

    it('validates wildcard projection', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            wildcardProjection: {
              ...store.getState().createIndex.options.wildcardProjection,
              enabled: true,
              value: 'not a wildcard projection',
            },
          },
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'Bad WildcardProjection: SyntaxError: Unexpected token \'o\', "not a wildc"... is not valid JSON'
      );
    });

    it('validates columnstore projection', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            columnstoreProjection: {
              ...store.getState().createIndex.options.columnstoreProjection,
              enabled: true,
              value: 'not a columnstore projection',
            },
          },
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'Bad ColumnstoreProjection: SyntaxError: Unexpected token \'o\', "not a colum"... is not valid JSON'
      );
    });

    it('validates partial filter expression', async function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            partialFilterExpression: {
              ...store.getState().createIndex.options.partialFilterExpression,
              enabled: true,
              value: '', // no partial filter expression
            },
          },
        },
      });
      await store.dispatch(createIndex());

      expect(store.getState().createIndex.error).to.equal(
        'Bad PartialFilterExpression: SyntaxError: Unexpected end of JSON input'
      );
    });

    it('succeeds if dataService.createIndex() resolves', async function () {
      let stateBeforeCreateIndex;

      const createIndexStub = sinon
        .stub()
        .callsFake(async (): Promise<string> => {
          // store it so we can assert on the in-between state
          stateBeforeCreateIndex = { ...store.getState().createIndex };
          return Promise.resolve('ok');
        });

      store = setupStore(
        {},
        {
          createIndex: createIndexStub,
        }
      );

      store.dispatch(updateFieldName(0, 'foo'));
      store.dispatch(fieldTypeUpdated(0, '1 (asc)'));

      store.dispatch(optionToggled('unique', true));
      store.dispatch(optionToggled('name', true));
      store.dispatch(optionChanged('name', 'my-index'));
      store.dispatch(optionToggled('expireAfterSeconds', true));
      store.dispatch(optionChanged('expireAfterSeconds', '60'));
      store.dispatch(optionToggled('partialFilterExpression', true));
      store.dispatch(
        optionChanged('partialFilterExpression', '{ "rating": { "$gt": 5 } }')
      );

      await store.dispatch(createIndex());

      // make sure it got to insert
      expect(createIndexStub.callCount).to.equal(1);

      // it should have set it to be in progress before calling dataService.createIndex
      expect(stateBeforeCreateIndex).to.deep.equal({
        inProgress: true,
        isVisible: false,
        error: null,
        fields: [{ name: 'foo', type: '1 (asc)' }],
        options: {
          unique: { value: false, enabled: true },
          name: { value: 'my-index', enabled: true },
          expireAfterSeconds: { value: '60', enabled: true },
          partialFilterExpression: {
            value: '{ "rating": { "$gt": 5 } }',
            enabled: true,
          },
          wildcardProjection: { value: '', enabled: false },
          collation: { value: '', enabled: false },
          columnstoreProjection: { value: '', enabled: false },
          sparse: { value: false, enabled: false },
        },
      });

      const [ns, spec, options] = createIndexStub.args[0];
      expect(ns).to.equal('citibike.trips');
      expect(spec).to.deep.equal({ foo: 1 });
      expect(options).to.deep.equal({
        expireAfterSeconds: 60,
        name: 'my-index',
        partialFilterExpression: {
          rating: {
            $gt: 5,
          },
        },
      });

      expect(store.getState().createIndex).to.deep.equal(INITIAL_STATE);
    });

    it('fails if dataService.createIndex() rejects', async function () {
      const createIndexStub = sinon
        .stub()
        .rejects(new Error('This is an error'));

      store = setupStore(
        {},
        {
          createIndex: createIndexStub,
        }
      );

      store.dispatch(updateFieldName(0, 'foo'));
      store.dispatch(fieldTypeUpdated(0, 'text'));

      await store.dispatch(createIndex());

      // make sure it got to insert
      expect(createIndexStub.callCount).to.equal(1);

      // state should be there with an error, not inProgress anymore
      expect(store.getState().createIndex).to.deep.equal({
        inProgress: false,
        isVisible: false,
        error: 'This is an error',
        fields: [{ name: 'foo', type: 'text' }],
        options: {
          unique: { value: false, enabled: false },
          name: { value: '', enabled: false },
          expireAfterSeconds: { value: '', enabled: false },
          partialFilterExpression: { value: '', enabled: false },
          wildcardProjection: { value: '', enabled: false },
          collation: { value: '', enabled: false },
          columnstoreProjection: { value: '', enabled: false },
          sparse: { value: false, enabled: false },
        },
      });
    });
  });

  describe('fieldAdded', function () {
    it('adds another field', function () {
      store.dispatch(fieldAdded());

      expect(store.getState().createIndex.fields).to.deep.equal([
        { name: '', type: '' },
        { name: '', type: '' },
      ]);
    });
  });

  describe('fieldRemoved', function () {
    it('removes a field', function () {
      store.dispatch(fieldAdded());
      store.dispatch(fieldRemoved(1));

      expect(store.getState().createIndex.fields).to.deep.equal([
        { name: '', type: '' },
      ]);
    });
  });

  describe('updateFieldName', function () {
    it('updates a field name', function () {
      store.dispatch(updateFieldName(0, 'foo'));

      expect(store.getState().createIndex.fields).to.deep.equal([
        { name: 'foo', type: '' },
      ]);
    });
  });

  describe('fieldTypeUpdated', function () {
    it('updates a field type', function () {
      store.dispatch(fieldTypeUpdated(0, 'text'));

      expect(store.getState().createIndex.fields).to.deep.equal([
        { name: '', type: 'text' },
      ]);
    });
  });

  describe('optionChanged', function () {
    it('changes the option', function () {
      store.dispatch(optionChanged('name', 'foo'));

      expect(store.getState().createIndex.options.name).to.deep.equal({
        enabled: false,
        value: 'foo',
      });
    });
  });

  describe('optionToggled', function () {
    it('toggles changes the option', function () {
      store.dispatch(optionToggled('name', true));

      expect(store.getState().createIndex.options.name).to.deep.equal({
        enabled: true,
        value: '',
      });

      store.dispatch(optionToggled('name', false));

      expect(store.getState().createIndex.options.name).to.deep.equal({
        enabled: false,
        value: '',
      });
    });
  });

  describe('createIndexOpened', function () {
    it('sets isVisible=true', function () {
      store.dispatch(createIndexOpened());

      expect(store.getState().createIndex.isVisible).to.equal(true);
    });
  });

  describe('createIndexClosed', function () {
    it('sets isVisible=false', function () {
      store.dispatch(createIndexClosed());

      expect(store.getState().createIndex.isVisible).to.equal(false);
    });
  });

  describe('errorCleared', function () {
    it('clears the error', function () {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          error: 'This is an error',
        },
      });
      store.dispatch(errorCleared());

      expect(store.getState().createIndex.error).to.equal(null);
    });
  });
});
