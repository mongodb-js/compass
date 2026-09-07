import { expect } from 'chai';

import { setupStore } from '../../test/setup-store';
import { waitFor } from '@mongodb-js/testing-library-compass';

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
import type { OptionNames } from './create-index';
import type { IndexesStore } from '../stores/store';
import { EJSON, ObjectId } from 'bson';
import Sinon from 'sinon';

describe('create-index module', function () {
  let store: IndexesStore;
  beforeEach(function () {
    store = setupStore();
  });

  describe('#createIndexFormSubmitted', function () {
    let createIndexSpy: Sinon.SinonSpy;

    const setOption = (name: OptionNames, value: string) => {
      Object.assign(store.getState(), {
        createIndex: {
          ...store.getState().createIndex,
          options: {
            ...store.getState().createIndex.options,
            [name]: {
              ...store.getState().createIndex.options[name],
              enabled: true,
              value,
            },
          },
        },
      });
    };

    beforeEach(function () {
      createIndexSpy = Sinon.spy(() => Promise.resolve('ok'));
      store = setupStore({}, { createIndex: createIndexSpy as any });
      store.dispatch(updateFieldName(0, 'foo'));
      store.dispatch(fieldTypeUpdated(0, 'text (full text search)'));
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
      setOption('wildcardProjection', 'not a wildcard projection');
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.match(
        /^Bad WildcardProjection: SyntaxError/
      );
    });

    it('validates columnstore projection', function () {
      setOption('columnstoreProjection', 'not a columnstore projection');
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.match(
        /^Bad ColumnstoreProjection: SyntaxError/
      );
    });

    it('validates partial filter expression', function () {
      setOption('partialFilterExpression', ''); // no partial filter expression
      store.dispatch(createIndexFormSubmitted());

      expect(store.getState().createIndex.error).to.match(
        /^Bad PartialFilterExpression: SyntaxError/
      );
    });

    describe('shell syntax options', function () {
      it('parses wildcard projection written in shell syntax', async function () {
        setOption('wildcardProjection', '{ fieldA: 1, fieldB: 1, }');
        store.dispatch(createIndexFormSubmitted());
        await waitFor(() => {
          expect(createIndexSpy).to.have.been.calledOnce;
        });

        expect(store.getState().createIndex.error).to.equal(null);
        expect(createIndexSpy.firstCall.args[2]).to.have.property(
          'wildcardProjection'
        );
        expect(
          createIndexSpy.firstCall.args[2].wildcardProjection
        ).to.deep.equal({ fieldA: 1, fieldB: 1 });
      });

      it('parses columnstore projection written in shell syntax', async function () {
        setOption('columnstoreProjection', "{ 'address.city': 1 }");
        store.dispatch(createIndexFormSubmitted());
        await waitFor(() => {
          expect(createIndexSpy).to.have.been.calledOnce;
        });

        expect(store.getState().createIndex.error).to.equal(null);
        expect(
          createIndexSpy.firstCall.args[2].columnstoreProjection
        ).to.deep.equal({ 'address.city': 1 });
      });

      it('parses partial filter expression written in shell syntax', async function () {
        setOption(
          'partialFilterExpression',
          "{ _id: ObjectId('642d766b7300158b1f22e972'), age: { $gt: 5 } }"
        );
        store.dispatch(createIndexFormSubmitted());
        await waitFor(() => {
          expect(createIndexSpy).to.have.been.calledOnce;
        });

        expect(store.getState().createIndex.error).to.equal(null);
        const { partialFilterExpression } = createIndexSpy.firstCall.args[2];
        expect(partialFilterExpression._id).to.be.instanceOf(ObjectId);
        expect(partialFilterExpression._id.toHexString()).to.equal(
          '642d766b7300158b1f22e972'
        );
        expect(partialFilterExpression.age).to.deep.equal({ $gt: 5 });
      });

      it('does not interpret extended JSON ($oid) as a bson type anymore', async function () {
        setOption(
          'partialFilterExpression',
          '{ "_id": { "$oid": "642d766b7300158b1f22e972" } }'
        );
        store.dispatch(createIndexFormSubmitted());
        await waitFor(() => {
          expect(createIndexSpy).to.have.been.calledOnce;
        });

        expect(store.getState().createIndex.error).to.equal(null);
        const { partialFilterExpression } = createIndexSpy.firstCall.args[2];
        expect(partialFilterExpression._id).to.not.be.instanceOf(ObjectId);
        expect(partialFilterExpression._id).to.deep.equal({
          $oid: '642d766b7300158b1f22e972',
        });
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
    const query = EJSON.serialize({});
    it('sets isVisible=true', function () {
      void store.dispatch(createIndexOpened());

      expect(store.getState().createIndex.isVisible).to.equal(true);
    });

    it('sets isVisible=true with a query', function () {
      void store.dispatch(createIndexOpened({ query }));

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
