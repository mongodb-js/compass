import reducer, {
  CHANGE_DATABASES,
  INITIAL_STATE,
  changeDatabases,
  changeActiveNamespace,
  filterDatabases
} from './databases';

import { createInstance } from '../../test/helpers';

describe('sidebar databases', () => {
  describe('#reducer', () => {
    context('when change databases action is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changeDatabases('dbs', 'expandedDblist', 'activeNamespace'))
        ).to.deep.equal({
          databases: 'dbs',
          expandedDblist: 'expandedDblist',
          activeNamespace: 'activeNamespace'
        });
      });
    });

    context('when the change namespace is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changeActiveNamespace('newActiveNamespace'))
        ).to.deep.equal({
          ...INITIAL_STATE,
          activeNamespace: 'newActiveNamespace'
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDatabases', () => {
    it('returns the action', () => {
      expect(changeDatabases('dbs', 'dblist', 'activeNS')).to.deep.equal({
        type: CHANGE_DATABASES,
        databases: 'dbs',
        expandedDblist: 'dblist',
        activeNamespace: 'activeNS'
      });
    });
  });

  describe('#updateDatabases', () => {
    let actionSpy;
    beforeEach(() => {
      actionSpy = sinon.spy();
    });
    afterEach(() => {
      actionSpy = null;
    });
    describe('with only filter set', () => {
      it('filters dbs', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: 'def', collections: []}
              ],
              expandedDblist: {abc: true, def: true},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: []},
            {_id: 'def', collections: []}
          ]).toJSON()
        });
        filterDatabases(/^([^0-9]*)$/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('filters collections', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: [{_id: '123.hij', name: 'hij', capped: false, database: '123', power_of_two: false, readonly: false}]},
                {_id: 'def', collections: []}
              ],
              expandedDblist: {abc: true, def: true, '123': true},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['hij']},
            {_id: 'def', collections: []},
            {_id: '123', collections: ['321']}
          ]).toJSON()
        });
        filterDatabases(/^([^0-9]*)$/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('filters with exact match', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal({
            type: CHANGE_DATABASES,
            databases: [
              { _id: 'abc', collections: [] },
              {
                _id: '123',
                collections: [
                  {
                    _id: '123.abc',
                    name: 'abc',
                    capped: false,
                    database: '123',
                    power_of_two: false,
                    readonly: false,
                  },
                ],
              },
            ],
            expandedDblist: { abc: true, 123: true },
            activeNamespace: '',
          });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['abc']},
            {_id: 'def', collections: []}
          ]).toJSON()
        });
        filterDatabases(/abc/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('does not filter when regex blank', () => {
        const instance = createInstance([
          {_id: 'abc', collections: []},
          {_id: '123', collections: ['abc']},
          {_id: 'def', collections: []}
        ]);
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: instance.databases.toJSON(),
              expandedDblist: {abc: false, '123': false, def: false},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: instance.toJSON()
        });
        filterDatabases(/(?:)/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('includes active namespace in state', () => {
        const instance = createInstance([
          {_id: 'abc', collections: []},
          {_id: '123', collections: ['abc']},
          {_id: 'def', collections: []}
        ]);
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: instance.databases.toJSON(),
              expandedDblist: {abc: false, '123': false, def: true},
              activeNamespace: 'def'
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: 'def', expandedDblist: {} },
          filterRegex: '',
          instance: instance.toJSON()
        });
        filterDatabases(/(?:)/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });
    });

    describe('with filter and active namespace set', () => {
      describe('just db', () => {
        it('includes active namespace', () => {
          const instance = createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['abc']},
            {_id: 'def', collections: []}
          ]);
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: instance.databases.toJSON(),
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: '',
            instance: instance.toJSON()
          });
          filterDatabases(/(?:)/, null, 'def')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
      describe('db and collection', () => {
        it('includes active namespace', () => {
          const instance = createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['abc']},
            {_id: 'def', collections: ['coll', 'other']}
          ]);
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: instance.databases.toJSON(),
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def.coll'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: '',
            instance: instance.toJSON()
          });
          filterDatabases(/(?:)/, null, 'def.coll')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
    });
    describe('with only active namespace set with action', () => {
      describe('just db', () => {
        it('includes active namespace', () => {
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: [
                  {_id: 'abc', collections: []},
                  {_id: '123', collections: [{_id: '123.abc', name: 'abc', capped: false, database: '123', power_of_two: false, readonly: false}]},
                  {_id: 'def', collections: []}
                ],
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: /(?:)/,
            instance: createInstance([
              {_id: 'abc', collections: []},
              {_id: '123', collections: ['abc']},
              {_id: 'def', collections: []}
            ]).toJSON()
          });
          filterDatabases(null, null, 'def')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
      describe('db and collection', () => {
        it('includes active namespace', () => {
          const instance = createInstance([
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['abc']},
            {_id: 'def', collections: ['coll', 'other']}
          ]);
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: instance.databases.toJSON(),
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def.coll'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: /(?:)/,
            instance: instance.toJSON()
          });
          filterDatabases(null, null, 'def.coll')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
    });
    describe('with databases set by action', () => {
      it('sets dbs', () => {
        const instance = createInstance([
          { _id: 'abc', collections: [] },
          { _id: '123', collections: ['abc'] },
          { _id: 'def', collections: ['coll', 'other'] },
        ]);

        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: instance.databases.toJSON(),
              expandedDblist: {abc: false, def: false, 123: false},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: /(?:)/,
          instance: {
            databases: []
          }
        });
        filterDatabases(
          null,
          instance.databases.toJSON(),
          null
        )(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });
    });
  });
});
