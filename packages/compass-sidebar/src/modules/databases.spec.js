import reducer, {
  INITIAL_STATE,
  changeDatabases,
  CHANGE_DATABASES,
  filterDatabases
} from 'modules/databases';

import { makeModel } from '../../electron/renderer/stores/instance-store';

describe('sidebar databases', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
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
          instance: {
            databases: [
              {_id: 'abc', collections: []},
              {_id: '123', collections: []},
              {_id: 'def', collections: []}
            ].map((m) => (makeModel(m)))
          }
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
                {_id: '123', collections: [{_id: '123.hij', capped: false, database: '123', power_of_two: false, readonly: false}]},
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
          instance: {
            databases: [
              {_id: 'abc', collections: []},
              {_id: '123', collections: ['hij']},
              {_id: 'def', collections: []}
            ].map((m) => (makeModel(m)))
          }
        });
        filterDatabases(/^([^0-9]*)$/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('filters with exact match', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: [{_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}]}
              ],
              expandedDblist: {abc: true, '123': true},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: {
            databases: [
              {_id: 'abc', collections: []},
              {_id: '123', collections: ['abc']},
              {_id: 'def', collections: []}
            ].map((m) => (makeModel(m)))
          }
        });
        filterDatabases(/abc/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('does not filter when regex blank', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: [{_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}]},
                {_id: 'def', collections: []}
              ],
              expandedDblist: {abc: false, '123': false, def: false},
              activeNamespace: ''
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: '', expandedDblist: {} },
          filterRegex: '',
          instance: {
            databases: [
              {_id: 'abc', collections: []},
              {_id: '123', collections: ['abc']},
              {_id: 'def', collections: []}
            ].map((m) => (makeModel(m)))
          }
        });
        filterDatabases(/(?:)/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });

      it('includes active namespace in state', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: [{_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}]},
                {_id: 'def', collections: []}
              ],
              expandedDblist: {abc: false, '123': false, def: true},
              activeNamespace: 'def'
            });
          actionSpy();
        };
        const getState = () => ({
          databases: { databases: [], activeNamespace: 'def', expandedDblist: {} },
          filterRegex: '',
          instance: {
            databases: [
              {_id: 'abc', collections: []},
              {_id: '123', collections: ['abc']},
              {_id: 'def', collections: []}
            ].map((m) => (makeModel(m)))
          }
        });
        filterDatabases(/(?:)/, null, null)(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });
    });

    describe('with filter and active namespace set', () => {
      describe('just db', () => {
        it('includes active namespace', () => {
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: [
                  {_id: 'abc', collections: []},
                  {_id: '123', collections: [{_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}]},
                  {_id: 'def', collections: []}
                ],
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: '',
            instance: {
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: ['abc']},
                {_id: 'def', collections: []}
              ].map((m) => (makeModel(m)))
            }
          });
          filterDatabases(/(?:)/, null, 'def')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
      describe('db and collection', () => {
        it('includes active namespace', () => {
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: [
                  {_id: 'abc', collections: []},
                  {_id: '123', collections: [
                    {_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}
                  ]},
                  {_id: 'def', collections: [
                    {_id: 'def.coll', capped: false, database: 'def', power_of_two: false, readonly: false},
                    {_id: 'def.other', capped: false, database: 'def', power_of_two: false, readonly: false}
                  ]}
                ],
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def.coll'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: '',
            instance: {
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: ['abc']},
                {_id: 'def', collections: ['coll', 'other']}
              ].map((m) => (makeModel(m)))
            }
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
                  {_id: '123', collections: [{_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}]},
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
            instance: {
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: ['abc']},
                {_id: 'def', collections: []}
              ].map((m) => (makeModel(m)))
            }
          });
          filterDatabases(null, null, 'def')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
      describe('db and collection', () => {
        it('includes active namespace', () => {
          const dispatch = (res) => {
            expect(res).to.deep.equal(
              {
                type: CHANGE_DATABASES,
                databases: [
                  {_id: 'abc', collections: []},
                  {_id: '123', collections: [
                    {_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}
                  ]},
                  {_id: 'def', collections: [
                    {_id: 'def.coll', capped: false, database: 'def', power_of_two: false, readonly: false},
                    {_id: 'def.other', capped: false, database: 'def', power_of_two: false, readonly: false}
                  ]}
                ],
                expandedDblist: {abc: false, '123': false, def: true},
                activeNamespace: 'def.coll'
              });
            actionSpy();
          };
          const getState = () => ({
            databases: { databases: [], activeNamespace: '', expandedDblist: {} },
            filterRegex: /(?:)/,
            instance: {
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: ['abc']},
                {_id: 'def', collections: ['coll', 'other']}
              ].map((m) => (makeModel(m)))
            }
          });
          filterDatabases(null, null, 'def.coll')(dispatch, getState);
          expect(actionSpy.calledOnce).to.equal(true);
        });
      });
    });
    describe('with databases set by action', () => {
      it('sets dbs', () => {
        const dispatch = (res) => {
          expect(res).to.deep.equal(
            {
              type: CHANGE_DATABASES,
              databases: [
                {_id: 'abc', collections: []},
                {_id: '123', collections: [
                  {_id: '123.abc', capped: false, database: '123', power_of_two: false, readonly: false}
                ]},
                {_id: 'def', collections: [
                  {_id: 'def.coll', capped: false, database: 'def', power_of_two: false, readonly: false},
                  {_id: 'def.other', capped: false, database: 'def', power_of_two: false, readonly: false}
                ]}
              ],
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
          [
            {_id: 'abc', collections: []},
            {_id: '123', collections: ['abc']},
            {_id: 'def', collections: ['coll', 'other']}
          ].map((m) => (makeModel(m))),
          null
        )(dispatch, getState);
        expect(actionSpy.calledOnce).to.equal(true);
      });
    });
  });
});
