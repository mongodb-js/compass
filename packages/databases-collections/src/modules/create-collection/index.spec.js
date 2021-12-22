import { expect } from 'chai';
import sinon from 'sinon';
import reducer, { createCollection as makeCreateCollection } from './index';
import { reset } from '../reset';

import {
  CLEAR_ERROR,
  HANDLE_ERROR
} from '../error';

import {
  TOGGLE_IS_RUNNING
} from '../is-running';

import {
  RESET
} from '../reset';

describe('create collection module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is reset', () => {
        const dataService = 'data-service';

        it('returns the reset state', () => {
          expect(reducer(
            { dataService },
            reset()
          )).to.deep.equal({
            databaseName: '',
            dataService: 'data-service',
            error: null,
            isRunning: false,
            isVisible: false
          });
        });
      });
    });
  });

  describe('#createCollection', () => {
    let appRegistryEmitSpy;
    const hadronAppBkp = global.hadronApp;

    beforeEach(() => {
      appRegistryEmitSpy = sinon.spy();
      global.hadronApp = {
        appRegistry: {emit: appRegistryEmitSpy}
      };
    });

    afterEach(() => {
      global.hadronApp = hadronAppBkp;
    });

    const testCreateCollection = (createCollectionSpy, state, data) => {
      const dispatched = [];
      makeCreateCollection(data)(
        (evt) => { dispatched.push(evt); },
        () => ({
          dataService: {
            dataService: {
              createCollection: createCollectionSpy
            }
          },
          ...state
        })
      );

      return dispatched;
    };

    it('creates a simple collection', () => {
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(null, {})
      );

      const dispatched = testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        { collection: 'coll1', options: {} }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {});
      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: RESET }
        ]
      );
    });

    it('creates a capped collection', () => {
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(null, {})
      );

      const dispatched = testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            capped: true,
            size: 123
          }
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        capped: true,
        size: 123
      });

      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: RESET }
        ]
      );
    });

    it('creates a time-series collection', () => {
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(null, {})
      );

      const dispatched = testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            timeseries: { timeField: 't' }
          }
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        timeseries: { timeField: 't' }
      });

      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: RESET }
        ]
      );
    });

    it('creates a time-series collection with collation', () => {
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(null, {})
      );

      const dispatched = testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            timeseries: {
              timeField: 'timeFieldName'
            },
            collation: { locale: 'es' }
          }
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        timeseries: {
          timeField: 'timeFieldName'
        },
        collation: { locale: 'es' }
      });

      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: RESET }
        ]
      );
    });

    it('creates a collection with collation', () => {
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(null, {})
      );

      const dispatched = testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            collation: { locale: 'es' }
          }
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        collation: { locale: 'es' }
      });

      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: RESET }
        ]
      );
    });

    it('handles errors from data service', () => {
      const err = new Error('error');
      const createCollectionSpy = sinon.spy(
        (ns, options, cb) => cb(err)
      );

      const dispatched = testCreateCollection(createCollectionSpy, {}, {});


      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: TOGGLE_IS_RUNNING, isRunning: false },
          { type: HANDLE_ERROR, error: err }
        ]
      );
    });

    it('handles synchronous exceptions', () => {
      const err = new Error('error');
      const createCollectionSpy = sinon.spy(
        () => { throw err; }
      );

      const dispatched = testCreateCollection(createCollectionSpy, {}, {});


      expect(dispatched).to.deep.equal(
        [
          { type: CLEAR_ERROR },
          { type: TOGGLE_IS_RUNNING, isRunning: true },
          { type: TOGGLE_IS_RUNNING, isRunning: false },
          { type: HANDLE_ERROR, error: err }
        ]
      );
    });
  });
});
