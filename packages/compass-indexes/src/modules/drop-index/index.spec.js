import { expect } from 'chai';
import sinon from 'sinon';

import { dropIndex } from '../drop-index';
import { HANDLE_ERROR, CLEAR_ERROR } from '../error';
import { TOGGLE_IN_PROGRESS } from '../in-progress';
import { TOGGLE_IS_VISIBLE } from '../is-visible';
import { RESET } from '../reset';

describe('drop index is background module', function() {
  let errorSpy;
  let progressSpy;
  let visibleSpy;
  let resetSpy;
  let clearErrorSpy;
  let emitSpy;
  describe('#dropIndex', function() {
    beforeEach(function() {
      errorSpy = sinon.spy();
      progressSpy = sinon.spy();
      visibleSpy = sinon.spy();
      resetSpy = sinon.spy();
      clearErrorSpy = sinon.spy();
      emitSpy = sinon.spy();
    });
    afterEach(function() {
      errorSpy = null;
      progressSpy = null;
      visibleSpy = null;
      resetSpy = null;
      clearErrorSpy = null;
      emitSpy = null;
    });
    it('calls dropIndex with correct options', function() {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          switch (res.type) {
            case TOGGLE_IN_PROGRESS:
              progressSpy();
              break;
            case RESET:
              resetSpy();
              break;
            case CLEAR_ERROR:
              clearErrorSpy();
              break;
            case TOGGLE_IS_VISIBLE:
              visibleSpy();
              break;
            default:
              expect(true).to.equal(false, `Unexpected action called ${res.type}`);
          }
        }
      };
      const state = () => ({
        appRegistry: {
          getStore: () => ({ns: 'db.coll'}),
          emit: emitSpy
        },
        namespace: 'db.coll',
        dataService: {
          dropIndex: (ns, indexName, cb) => {
            expect(ns).to.equal('db.coll');
            expect(indexName).to.equal('index name');
            cb(null);
          }
        }

      });
      dropIndex('index name')(dispatch, state);
      expect(resetSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(progressSpy.calledTwice).to.equal(true, 'toggleInProgress not called');
      expect(visibleSpy.calledOnce).to.equal(true, 'toggleIsVisible not called');
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('handles error in dropIndex', function() {
      const dispatch = (res) => {
        switch (res.type) {
          case TOGGLE_IN_PROGRESS:
            progressSpy();
            break;
          case HANDLE_ERROR:
            expect(res).to.deep.equal({
              type: HANDLE_ERROR,
              error: 'test err'
            });
            errorSpy();
            break;
          default:
            expect(true).to.equal(false, `Unexpected action called ${res.type}`);
        }
      };
      const state = () => ({
        appRegistry: {
          getStore: () => ({ns: 'db.coll'})
        },
        namespace: 'db.coll',
        dataService: {
          dropIndex: (ns, indexName, cb) => {
            expect(ns).to.equal('db.coll');
            expect(indexName).to.equal('index name');
            cb({message: 'test err'});
          }
        }
      });
      dropIndex('index name')(dispatch, state);
      expect(progressSpy.calledTwice).to.equal(true, 'toggleInProgress not called');
      expect(errorSpy.calledOnce).to.equal(true, 'error should be called');
    });
  });
});
