import { expect } from 'chai';
import HadronDocument, { Document } from 'hadron-document';
import {
  INITIAL_INSERT_STATE,
  InsertActionTypes,
  insertReducer,
  type InsertState,
} from './insert';

describe('insertReducer', function () {
  describe('INSERT_DOCUMENT_ERROR', function () {
    it('preserves the existing doc, jsonDoc and jsonView when the action does not override them', function () {
      const doc = new HadronDocument({ status: 'testing' });
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc,
        jsonDoc: '{"status":"testing"}',
        jsonView: false,
        isOpen: true,
      };

      const nextState = insertReducer(state, {
        type: InsertActionTypes.INSERT_DOCUMENT_ERROR,
        error: { message: 'failed validation' },
      });

      expect(nextState.doc).to.equal(doc);
      expect(nextState.jsonDoc).to.equal('{"status":"testing"}');
      expect(nextState.jsonView).to.equal(false);
      expect(nextState.isOpen).to.equal(true);
      expect(nextState.mode).to.equal('error');
      expect(nextState.error).to.deep.equal({ message: 'failed validation' });
    });

    it('overrides doc, jsonDoc and jsonView when the action provides them', function () {
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc: new HadronDocument({ status: 'testing' }),
        jsonDoc: '{"status":"testing"}',
        jsonView: false,
      };

      const overrideDoc = new Document({});
      const nextState = insertReducer(state, {
        type: InsertActionTypes.INSERT_DOCUMENT_ERROR,
        error: { message: 'invalid bson' },
        doc: overrideDoc,
        jsonDoc: '{}',
        jsonView: true,
      });

      expect(nextState.doc).to.equal(overrideDoc);
      expect(nextState.jsonDoc).to.equal('{}');
      expect(nextState.jsonView).to.equal(true);
    });
  });

  describe('TOGGLE_INSERT_DOCUMENT', function () {
    it('switching to List parses the current jsonDoc into a doc', function () {
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc: new Document({}),
        jsonDoc: '{"status":"testing"}',
        jsonView: true,
      };

      const nextState = insertReducer(state, {
        type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT,
        view: 'List',
      });

      expect(nextState.jsonView).to.equal(false);
      expect(nextState.doc?.generateObject()).to.deep.equal({
        status: 'testing',
      });
      expect(nextState.jsonDoc).to.equal('{"status":"testing"}');
    });

    it('switching to List keeps the existing doc when jsonDoc is empty', function () {
      const doc = new HadronDocument({ status: 'testing' });
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc,
        jsonDoc: '',
        jsonView: true,
      };

      const nextState = insertReducer(state, {
        type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT,
        view: 'List',
      });

      expect(nextState.doc).to.equal(doc);
      expect(nextState.jsonView).to.equal(false);
    });

    it('switching to JSON serializes the current doc', function () {
      const doc = new HadronDocument({ status: 'testing' });
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc,
        jsonDoc: null,
        jsonView: false,
      };

      const nextState = insertReducer(state, {
        type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT,
        view: 'JSON',
      });

      expect(nextState.jsonView).to.equal(true);
      expect(nextState.jsonDoc).to.equal(doc.toEJSON());
    });
  });

  describe('UPDATE_JSON_DOC', function () {
    it('sets the jsonDoc and resets doc to an empty document', function () {
      const state: InsertState = {
        ...INITIAL_INSERT_STATE,
        doc: new HadronDocument({ status: 'testing' }),
        jsonDoc: null,
        jsonView: false,
      };

      const nextState = insertReducer(state, {
        type: InsertActionTypes.UPDATE_JSON_DOC,
        jsonDoc: '{"foo":"bar"}',
      });

      expect(nextState.jsonDoc).to.equal('{"foo":"bar"}');
      expect(nextState.jsonView).to.equal(true);
      expect(nextState.doc?.generateObject()).to.deep.equal({});
    });
  });
});
