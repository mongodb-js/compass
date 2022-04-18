import { expect } from 'chai';
import sinon from 'sinon';

import { createIndex, createName } from '../create-index';
import { HANDLE_ERROR, CLEAR_ERROR } from '../error';
import { TOGGLE_IN_PROGRESS } from '../in-progress';
import { TOGGLE_IS_VISIBLE } from '../is-visible';
import { RESET } from '../reset';

describe('create index is background module', function() {
  let errorSpy;
  let progressSpy;
  let visibleSpy;
  let resetSpy;
  let clearErrorSpy;
  let emitSpy;
  describe('#createIndex', function() {
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
    it('errors if fields are undefined', function() {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: HANDLE_ERROR,
          error: 'You must select a field name and type'
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{name: '', type: ''}]
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('errors if TTL is not number', function() {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: HANDLE_ERROR,
          error: 'Bad TTL: "abc"'
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{name: 'abc', type: 'def'}],
        isTtl: true,
        ttl: 'abc'
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('errors if PFE is not JSON', function() {
      const dispatch = (res) => {
        expect(res).to.deep.equal({
          type: HANDLE_ERROR,
          error: 'Bad PartialFilterExpression: SyntaxError: Unexpected token a in JSON at position 0'
        });
        errorSpy();
      };
      const state = () => ({
        fields: [{name: 'abc', type: 'def'}],
        isPartialFilterExpression: true,
        partialFilterExpression: 'abc'
      });
      createIndex()(dispatch, state);
      expect(errorSpy.calledOnce).to.equal(true);
    });
    it('calls createIndex with correct options', function() {
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
            case Function:
              break;
            default:
              expect(true).to.equal(false, `Unexpected action called ${res.type}`);
          }
        }
      };
      const state = () => ({
        fields: [{name: 'abc', type: '1 (asc)'}],
        isPartialFilterExpression: true,
        partialFilterExpression: '{"a": 1}',
        isBackground: true,
        isUnique: true,
        name: 'test name',
        isCustomCollation: true,
        collation: 'coll',
        isTtl: true,
        ttl: 100,
        appRegistry: {
          emit: emitSpy
        },
        namespace: 'db.coll',
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({abc: 1});
            expect(options).to.deep.equal({
              background: true,
              collation: 'coll',
              expireAfterSeconds: 100,
              name: 'test name',
              partialFilterExpression: {a: 1},
              unique: true
            });
            cb(null);
          }
        }

      });
      createIndex()(dispatch, state);
      expect(resetSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(progressSpy.calledTwice).to.equal(true, 'toggleInProgress not called');
      expect(visibleSpy.calledOnce).to.equal(true, 'toggleIsVisible not called');
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('generates name if empty', function() {
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
        fields: [{name: 'abc', type: '1 (asc)'}],
        isPartialFilterExpression: true,
        partialFilterExpression: '{"a": 1}',
        isBackground: true,
        isUnique: true,
        name: '',
        isCustomCollation: true,
        collation: 'coll',
        isTtl: true,
        ttl: 100,
        namespace: 'db.coll',
        appRegistry: {
          emit: emitSpy
        },
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({abc: 1});
            expect(options).to.deep.equal({
              background: true,
              collation: 'coll',
              expireAfterSeconds: 100,
              name: 'abc_1',
              partialFilterExpression: {a: 1},
              unique: true
            });
            cb(null);
          }
        }

      });
      createIndex()(dispatch, state);
      expect(resetSpy.calledOnce).to.equal(true, 'reset not called');
      expect(clearErrorSpy.calledOnce).to.equal(true, 'clearError not called');
      expect(progressSpy.calledTwice).to.equal(true, 'toggleInProgress not called');
      expect(visibleSpy.calledOnce).to.equal(true, 'toggleIsVisible not called');
      expect(errorSpy.calledOnce).to.equal(false, 'error should not be called');
    });
    it('handles error in createIndex', function() {
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
        fields: [{name: 'abc', type: '1 (asc)'}],
        isPartialFilterExpression: false,
        isTtl: false,
        isUnique: false,
        isBackground: false,
        name: 'test name',
        namespace: 'db.coll',
        appRegistry: {
        },
        dataService: {
          createIndex: (ns, spec, options, cb) => {
            expect(ns).to.equal('db.coll');
            expect(spec).to.deep.equal({abc: 1});
            expect(options).to.deep.equal({
              background: false,
              name: 'test name',
              unique: false
            });
            cb({message: 'test err'});
          }
        }
      });
      createIndex()(dispatch, state);
      expect(progressSpy.calledTwice).to.equal(true, 'toggleInProgress not called');
      expect(errorSpy.calledOnce).to.equal(true, 'error should be called');
    });
  });

  describe('#createName', function() {
    context('when the index is not a wildcard index', function() {
      const fields = [ { name: 'name' }, { name: 'age' }];
      const spec = { name: 1, age: -1 };
      it('generates a name with all fields and directions', function() {
        expect(createName(fields, spec)).to.equal('name_1_age_-1');
      });
    });

    context('when the index is a wildcard', function() {
      const fields = [ { name: 'name' }, { name: 'age' }];
      const spec = { name: '$**name.first', age: '$**age.years' };
      it('generates a name with all fields and wilcard replacement', function() {
        expect(createName(fields, spec)).to.equal('name_wildcardname.first_age_wildcardage.years');
      });
    });
  });
});
