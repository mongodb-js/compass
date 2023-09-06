import { expect } from 'chai';
import sinon from 'sinon';

import { dropIndex } from '../drop-index';
import { ActionTypes as ErrorActionTypes } from './error';
import { TOGGLE_IN_PROGRESS } from '../in-progress';
import { TOGGLE_IS_VISIBLE } from '../is-visible';
import { RESET_FORM } from '../reset-form';

describe('drop index module', function () {
  let errorSpy;
  let progressSpy;
  let visibleSpy;
  let resetFormSpy;
  let clearErrorSpy;
  let emitSpy;
  describe('#dropIndex', function () {
    beforeEach(function () {
      errorSpy = sinon.spy();
      progressSpy = sinon.spy();
      visibleSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      clearErrorSpy = sinon.spy();
      emitSpy = sinon.spy();
    });
    afterEach(function () {
      errorSpy = null;
      progressSpy = null;
      visibleSpy = null;
      resetFormSpy = null;
      clearErrorSpy = null;
      emitSpy = null;
    });
    it('calls dropIndex with correct options', async function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          switch (res.type) {
            case TOGGLE_IN_PROGRESS:
              progressSpy();
              break;
            case RESET_FORM:
              resetFormSpy();
              break;
            case ErrorActionTypes.ClearError:
              clearErrorSpy();
              break;
            case TOGGLE_IS_VISIBLE:
              visibleSpy();
              break;
            default:
              expect(true).to.equal(
                false,
                `Unexpected action called ${res.type}`
              );
          }
        }
      };
      const state = () => ({
        appRegistry: {
          getStore: () => ({ ns: 'db.coll' }),
          emit: emitSpy,
        },
        namespace: 'db.coll',
        dataService: {
          dropIndex: (ns, indexName) => {
            expect(ns).to.equal('db.coll');
            expect(indexName).to.equal('index name');
            return Promise.resolve();
          },
        },
      });
      await dropIndex('index name')(dispatch, state);
      expect(resetFormSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(progressSpy.calledTwice).to.equal(
        true,
        'toggleInProgress not called'
      );
      expect(visibleSpy.calledOnce).to.equal(
        true,
        'toggleIsVisible not called'
      );
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('handles error in dropIndex', async function () {
      const dispatch = (res) => {
        switch (res.type) {
          case TOGGLE_IN_PROGRESS:
            progressSpy();
            break;
          case ErrorActionTypes.HandleError:
            expect(res).to.deep.equal({
              type: ErrorActionTypes.HandleError,
              error: 'test err',
            });
            errorSpy();
            break;
          default:
            expect(true).to.equal(
              false,
              `Unexpected action called ${res.type}`
            );
        }
      };
      const state = () => ({
        appRegistry: {
          getStore: () => ({ ns: 'db.coll' }),
        },
        namespace: 'db.coll',
        dataService: {
          dropIndex: (ns, indexName) => {
            expect(ns).to.equal('db.coll');
            expect(indexName).to.equal('index name');
            return Promise.reject({ message: 'test err' });
          },
        },
      });
      await dropIndex('index name')(dispatch, state);
      expect(progressSpy.calledTwice).to.equal(
        true,
        'toggleInProgress not called'
      );
      expect(errorSpy.calledOnce).to.equal(true, 'error should be called');
    });
  });
});
