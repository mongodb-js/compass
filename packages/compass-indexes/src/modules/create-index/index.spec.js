import { expect } from 'chai';
import sinon from 'sinon';

import { createIndex } from '../create-index';
import { ActionTypes as ErrorActionTypes } from '../error';
import { TOGGLE_IN_PROGRESS } from '../in-progress';
import { TOGGLE_IS_VISIBLE } from '../is-visible';
import { RESET_FORM } from '../reset-form';
import { INITIAL_STATE as OPTIONS_INITIAL_STATE } from './options';

function createOptions(options) {
  return {
    ...OPTIONS_INITIAL_STATE,
    ...Object.fromEntries(
      Object.keys(options).map((name) => {
        return [name, { enabled: true, value: options[name] }];
      })
    ),
  };
}

describe('create index module', function () {
  let errorSpy;
  let inProgressSpy;
  let toggleIsvisibleSpy;
  let resetFormSpy;
  let clearErrorSpy;
  let emitSpy;
  describe('#createIndex', function () {
    beforeEach(function () {
      errorSpy = sinon.spy();
      inProgressSpy = sinon.spy();
      toggleIsvisibleSpy = sinon.spy();
      resetFormSpy = sinon.spy();
      clearErrorSpy = sinon.spy();
      emitSpy = sinon.spy();
    });
    afterEach(function () {
      errorSpy = null;
      inProgressSpy = null;
      toggleIsvisibleSpy = null;
      resetFormSpy = null;
      clearErrorSpy = null;
      emitSpy = null;
    });
    it('errors if fields are undefined', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: ErrorActionTypes.HandleError,
          error: 'You must select a field name and type',
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{ name: '', type: '' }],
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('errors if TTL is not number', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: ErrorActionTypes.HandleError,
          error: 'Bad TTL: "abc"',
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{ name: 'abc', type: 'def' }],
        options: createOptions({ expireAfterSeconds: 'abc' }),
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('errors if PFE is not JSON', function () {
      const dispatch = (res) => {
        expect(res).to.have.property('type', ErrorActionTypes.HandleError);
        expect(res)
          .to.have.property('error')
          .match(/Bad PartialFilterExpression: SyntaxError/);
        errorSpy();
      };
      const state = () => ({
        fields: [{ name: 'abc', type: 'def' }],
        options: createOptions({ partialFilterExpression: 'abc' }),
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('calls createIndex with correct options', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          switch (res.type) {
            case TOGGLE_IN_PROGRESS:
              inProgressSpy();
              break;
            case RESET_FORM:
              resetFormSpy();
              break;
            case ErrorActionTypes.ClearError:
              clearErrorSpy();
              break;
            case TOGGLE_IS_VISIBLE:
              toggleIsvisibleSpy();
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
        fields: [{ name: 'abc', type: '1 (asc)' }],
        options: createOptions({
          partialFilterExpression: '{"a": 1}',
          unique: true,
          sparse: true,
          name: 'test name',
          collation: "{locale: 'en'}",
          expireAfterSeconds: 100,
        }),
        appRegistry: {
          emit: emitSpy,
        },
        namespace: 'db.coll',
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({ abc: 1 });
            expect(options).to.deep.equal({
              collation: {
                locale: 'en',
              },
              expireAfterSeconds: 100,
              name: 'test name',
              partialFilterExpression: { a: 1 },
              unique: true,
              sparse: true,
            });
            cb(null);
          },
        },
      });
      createIndex()(dispatch, state);
      expect(resetFormSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(inProgressSpy.calledTwice).to.equal(
        true,
        'toggleInProgress not called'
      );
      expect(toggleIsvisibleSpy.calledOnce).to.equal(
        true,
        'toggleIsVisible not called'
      );
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('does not generate name if empty', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          switch (res.type) {
            case TOGGLE_IN_PROGRESS:
              inProgressSpy();
              break;
            case RESET_FORM:
              resetFormSpy();
              break;
            case ErrorActionTypes.ClearError:
              clearErrorSpy();
              break;
            case TOGGLE_IS_VISIBLE:
              toggleIsvisibleSpy();
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
        fields: [{ name: 'abc', type: '1 (asc)' }],
        options: createOptions({
          partialFilterExpression: '{"a": 1}',
          unique: true,
          collation: "{locale: 'en'}",
          expireAfterSeconds: 100,
        }),
        namespace: 'db.coll',
        appRegistry: {
          emit: emitSpy,
        },
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({ abc: 1 });
            expect(options).to.deep.equal({
              collation: {
                locale: 'en',
              },
              expireAfterSeconds: 100,
              partialFilterExpression: { a: 1 },
              unique: true,
            });
            cb(null);
          },
        },
      });
      createIndex()(dispatch, state);
      expect(resetFormSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(inProgressSpy.calledTwice).to.equal(
        true,
        'toggleInProgress not called'
      );
      expect(toggleIsvisibleSpy.calledOnce).to.equal(
        true,
        'toggleIsVisible not called'
      );
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('handles error in createIndex', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          switch (res.type) {
            case TOGGLE_IN_PROGRESS:
              inProgressSpy();
              break;
            case ErrorActionTypes.ClearError:
              clearErrorSpy();
              break;
            case ErrorActionTypes.HandleError:
              expect(res).to.deep.equal({
                type: ErrorActionTypes.HandleError,
                error: { message: 'test err' },
              });
              errorSpy();
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
        fields: [{ name: 'abc', type: '1 (asc)' }],
        options: createOptions({
          name: 'test name',
          unique: false,
          sparse: false,
        }),
        namespace: 'db.coll',
        appRegistry: {},
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({ abc: 1 });
            expect(options).to.deep.equal({
              name: 'test name',
            });
            cb({ message: 'test err' });
          },
        },
      });
      createIndex()(dispatch, state);
      expect(inProgressSpy.calledTwice).to.equal(
        true,
        'toggleInProgress not called'
      );
      expect(errorSpy.calledOnce).to.equal(true, 'error should be called');
    });
  });
});
