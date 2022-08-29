import { expect } from 'chai';
import sinon from 'sinon';

import { createIndex } from '../create-index';
import { ActionTypes as ErrorActionTypes } from '../error';
import { TOGGLE_IN_PROGRESS } from '../in-progress';
import { TOGGLE_IS_VISIBLE } from '../is-visible';
import { RESET_FORM } from '../reset-form';

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
        useTtl: true,
        ttl: 'abc',
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('errors if PFE is not JSON', function () {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: ErrorActionTypes.HandleError,
          error:
            'Bad PartialFilterExpression: SyntaxError: Unexpected token a in JSON at position 0',
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{ name: 'abc', type: 'def' }],
        usePartialFilterExpression: true,
        partialFilterExpression: 'abc',
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
        usePartialFilterExpression: true,
        partialFilterExpression: '{"a": 1}',
        isUnique: true,
        isSparse: true,
        name: 'test name',
        useCustomCollation: true,
        collationString: "{locale: 'en'}",
        useTtl: true,
        ttl: 100,
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
        usePartialFilterExpression: true,
        partialFilterExpression: '{"a": 1}',
        isUnique: true,
        isSparse: false,
        name: '',
        useCustomCollation: true,
        collationString: "{locale: 'en'}",
        useTtl: true,
        ttl: 100,
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
              sparse: false,
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
        usePartialFilterExpression: false,
        useTtl: false,
        isUnique: false,
        isSparse: false,
        name: 'test name',
        namespace: 'db.coll',
        appRegistry: {},
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({ abc: 1 });
            expect(options).to.deep.equal({
              name: 'test name',
              unique: false,
              sparse: false,
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
