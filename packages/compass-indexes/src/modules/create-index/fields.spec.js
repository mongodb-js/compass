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
  CHANGE_FIELDS
} from 'modules/create-index/fields';
import { HANDLE_ERROR } from 'modules/error';
import { CHANGE_SCHEMA_FIELDS } from 'modules/create-index/schema-fields';

describe('create index fields module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state for addField', () => {
        expect(
          reducer(undefined, addField())
        ).to.deep.equal([{name: '', type: ''}, {name: '', type: ''}]);
      });
      it('returns the new state for removeField', () => {
        expect(
          reducer(undefined, removeField(0))
        ).to.deep.equal([]);
      });
      it('returns the new state for updateFieldType', () => {
        expect(
          reducer(undefined, updateFieldType(0, 'Int32'))
        ).to.deep.equal([{name: '', type: 'Int32'}]);
      });
      it('returns the new state for changeFields', () => {
        expect(
          reducer(undefined, changeFields([{name: 'Other', type: 'test'}]))
        ).to.deep.equal([{name: 'Other', type: 'test'}]);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#addField', () => {
    it('returns the action', () => {
      expect(addField()).to.deep.equal({
        type: ADD_FIELD
      });
    });
  });
  describe('#removeField', () => {
    it('returns the action', () => {
      expect(removeField(9)).to.deep.equal({
        type: REMOVE_FIELD,
        idx: 9
      });
    });
  });
  describe('#updateFieldTypeField', () => {
    it('returns the action', () => {
      expect(updateFieldType(8, 'Int64')).to.deep.equal({
        type: UPDATE_FIELD_TYPE,
        idx: 8,
        fType: 'Int64'
      });
    });
  });
  describe('#changeFields', () => {
    it('returns the action', () => {
      expect(changeFields([{name: 'abc', type: 'def'}])).to.deep.equal({
        type: CHANGE_FIELDS,
        fields: [{name: 'abc', type: 'def'}]
      });
    });
  });
  describe('#updateFieldName', () => {
    let actionSpy;
    beforeEach(() => {
      actionSpy = sinon.spy();
    });
    afterEach(() => {
      actionSpy = null;
    });
    it('returns updateFieldName action with valid name change index 0 and no schemaField change', () => {
      const dispatch = (res) => {
        expect(res).to.deep.equal(
          {
            type: CHANGE_FIELDS,
            fields: [
              { name: 'abc', type: '' },
              { name: '', type: '' }
            ]
          }
        );
        actionSpy();
      };
      const state = () => ({
        fields: [ { name: '', type: '' }, { name: '', type: ''} ],
        schemaFields: ['abc']
      });
      updateFieldName(0, 'abc')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('returns updateFieldName action with valid name change index 1 and no schemaField change', () => {
      const dispatch = (res) => {
        expect(res).to.deep.equal(
          {
            type: CHANGE_FIELDS,
            fields: [
              { name: '', type: '' },
              { name: 'abc', type: '' }
            ]
          }
        );
        actionSpy();
      };
      const state = () => ({
        fields: [ { name: '', type: '' }, { name: '', type: ''} ],
        schemaFields: ['abc']
      });
      updateFieldName(1, 'abc')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('ignores invalid name change i = -1', () => {
      const dispatch = () => {
        expect(true).to.be(false, 'Error: dispatch should not be called');
      };
      const state = () => ({
        fields: [ { name: '', type: '' }, { name: '', type: ''} ],
        schemaFields: ['abc']
      });
      updateFieldName(-1, 'abc')(dispatch, state);
    });
    it('ignores invalid name change i > length', () => {
      const dispatch = () => {
        expect(true).to.be(false, 'Error: dispatch should not be called');
      };
      const state = () => ({
        fields: [ { name: '', type: '' }, { name: '', type: ''} ],
        schemaFields: ['abc']
      });
      updateFieldName(3, 'abc')(dispatch, state);
    });
    it('returns handleError action with duplicate name', () => {
      const dispatch = (res) => {
        expect(res).to.deep.equal(
          {
            type: HANDLE_ERROR,
            error: 'Index keys must be unique'
          }
        );
        actionSpy();
      };
      const state = () => ({
        fields: [ { name: 'test', type: '' }, { name: '', type: ''} ],
        schemaFields: ['abc']
      });
      updateFieldName(1, 'test')(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
    it('returns updateFieldName action with valid name change and schemaField change', () => {
      const dispatch = (res) => {
        if (res.type === CHANGE_FIELDS) {
          expect(res).to.deep.equal(
            {
              type: CHANGE_FIELDS,
              fields: [
                {name: 'def', type: ''},
                {name: 'abc', type: ''}
              ]
            }
          );
          actionSpy();
        } else if (res.type === CHANGE_SCHEMA_FIELDS) {
          expect(res).to.deep.equal(
            {
              type: CHANGE_SCHEMA_FIELDS,
              schemaFields: ['def', 'abc']
            }
          );
          actionSpy();
        } else {
          expect(true).to.be(false, 'Error: dispatch should not be called');
        }
      };
      const state = () => ({
        fields: [ { name: 'def', type: '' }, { name: '', type: ''} ],
        schemaFields: ['def']
      });
      updateFieldName(1, 'abc')(dispatch, state);
      expect(actionSpy.calledTwice).to.equal(true);
    });
  });
});
