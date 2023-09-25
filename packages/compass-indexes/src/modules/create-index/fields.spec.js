import { expect } from 'chai';
import sinon from 'sinon';

import reducer, {
  INITIAL_STATE,
  addField,
  ADD_FIELD,
  removeField,
  REMOVE_FIELD,
  updateFieldType,
  UPDATE_FIELD_TYPE,
  updateFieldName,
  changeFields,
  CHANGE_FIELDS,
} from './fields';
import { ActionTypes as ErrorActionTypes } from './error';

describe('create index fields module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state for addField', function () {
        expect(reducer(undefined, addField())).to.deep.equal([
          { name: '', type: '' },
          { name: '', type: '' },
        ]);
      });
      it('returns the new state for removeField', function () {
        expect(reducer(undefined, removeField(0))).to.deep.equal([]);
      });
      it('returns the new state for updateFieldType', function () {
        expect(reducer(undefined, updateFieldType(0, 'Int32'))).to.deep.equal([
          { name: '', type: 'Int32' },
        ]);
      });
      it('returns the new state for changeFields', function () {
        expect(
          reducer(undefined, changeFields([{ name: 'Other', type: 'test' }]))
        ).to.deep.equal([{ name: 'Other', type: 'test' }]);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#addField', function () {
    it('returns the action', function () {
      expect(addField()).to.deep.equal({
        type: ADD_FIELD,
      });
    });
  });
  describe('#removeField', function () {
    it('returns the action', function () {
      expect(removeField(9)).to.deep.equal({
        type: REMOVE_FIELD,
        idx: 9,
      });
    });
  });
  describe('#updateFieldTypeField', function () {
    it('returns the action', function () {
      expect(updateFieldType(8, 'Int64')).to.deep.equal({
        type: UPDATE_FIELD_TYPE,
        idx: 8,
        fType: 'Int64',
      });
    });
  });
  describe('#changeFields', function () {
    it('returns the action', function () {
      expect(changeFields([{ name: 'abc', type: 'def' }])).to.deep.equal({
        type: CHANGE_FIELDS,
        fields: [{ name: 'abc', type: 'def' }],
      });
    });
  });
  describe('#updateFieldName', function () {
    let actionSpy;
    beforeEach(function () {
      actionSpy = sinon.spy();
    });
    afterEach(function () {
      actionSpy = null;
    });
    it('returns updateFieldName action with valid name change index 0 and no schemaField change', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: CHANGE_FIELDS,
          fields: [
            { name: 'abc', type: '' },
            { name: '', type: '' },
          ],
        });
        actionSpy();
      };
      const state = () => ({
        fields: [
          { name: '', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['abc'],
      });
      updateFieldName(0, 'abc')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('returns updateFieldName action with valid name change index 1 and no schemaField change', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: CHANGE_FIELDS,
          fields: [
            { name: '', type: '' },
            { name: 'abc', type: '' },
          ],
        });
        actionSpy();
      };
      const state = () => ({
        fields: [
          { name: '', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['abc'],
      });
      updateFieldName(1, 'abc')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('ignores invalid name change i = -1', function () {
      const dispatch = () => {
        expect(true).to.be(false, 'Error: dispatch should not be called');
      };
      const state = () => ({
        fields: [
          { name: '', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['abc'],
      });
      updateFieldName(-1, 'abc')(dispatch, state);
    });
    it('ignores invalid name change i > length', function () {
      const dispatch = () => {
        expect(true).to.be(false, 'Error: dispatch should not be called');
      };
      const state = () => ({
        fields: [
          { name: '', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['abc'],
      });
      updateFieldName(3, 'abc')(dispatch, state);
    });
    it('returns handleError action with duplicate name', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: ErrorActionTypes.HandleError,
          error: 'Index keys must be unique',
        });
        actionSpy();
      };
      const state = () => ({
        fields: [
          { name: 'test', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['abc'],
      });
      updateFieldName(1, 'test')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('returns updateFieldName action with valid name change and schemaField change', function () {
      const dispatch = (res) => {
        if (res.type === CHANGE_FIELDS) {
          expect(res).to.deep.equal({
            type: CHANGE_FIELDS,
            fields: [
              { name: 'def', type: '' },
              { name: 'abc', type: '' },
            ],
          });
          actionSpy();
        } else {
          expect(true).to.be(false, 'Error: dispatch should not be called');
        }
      };
      const state = () => ({
        fields: [
          { name: 'def', type: '' },
          { name: '', type: '' },
        ],
        schemaFields: ['def'],
      });
      updateFieldName(1, 'abc')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
  });
});
