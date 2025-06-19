import { expect } from 'chai';

import { setupStore } from '../../test/setup-store';

import {
  createIndexClosed,
  createIndexFormSubmitted,
  createIndexOpened,
  errorCleared,
  fieldAdded,
  fieldRemoved,
  fieldTypeUpdated,
  optionChanged,
  optionToggled,
  updateFieldName,
} from './create-index';
import type { IndexesStore } from '../stores/store';
import { EJSON } from 'bson';

describe('create-index module', function () {
  let store: IndexesStore;
  beforeEach(function () {
    store = setupStore();
  });

  describe('#createIndexFormSubmitted', function () {
    beforeEach(function () {
      store.dispatch(updateFieldName(0, 'foo'));
      store.dispatch(fieldTypeUpdated(0, 'text'));
    });

    it('validates collation', function () {
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
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.equal(
        'You must provide a valid collation object'
      );
    });

    it('validates TTL', function () {
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
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.equal(
        'Bad TTL: "not a ttl"'
      );
    });

    it('validates wildcard projection', function () {
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
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.equal(
        'Bad WildcardProjection: SyntaxError: Unexpected token \'o\', "not a wildc"... is not valid JSON'
      );
    });

    it('validates columnstore projection', function () {
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
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.equal(
        'Bad ColumnstoreProjection: SyntaxError: Unexpected token \'o\', "not a colum"... is not valid JSON'
      );
    });

    it('validates partial filter expression', function () {
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
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.equal(
        'Bad PartialFilterExpression: SyntaxError: Unexpected end of JSON input'
      );
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
    const query = EJSON.serialize({});
    it('sets isVisible=true', function () {
      void store.dispatch(createIndexOpened());

      expect(store.getState().createIndex.isVisible).to.equal(true);
    });

    it('sets isVisible=true with a query', function () {
      void store.dispatch(createIndexOpened({ query }));

      expect(store.getState().createIndex.isVisible).to.equal(true);
    });

    it('sets currentTab=IndexFlow if no query is provided', function () {
      void store.dispatch(createIndexOpened());

      expect(store.getState().createIndex.currentTab).to.equal('IndexFlow');
    });

    it('sets currentTab=QueryFlow if a query is provided', function () {
      void store.dispatch(createIndexOpened({ query }));

      expect(store.getState().createIndex.currentTab).to.equal('QueryFlow');
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
