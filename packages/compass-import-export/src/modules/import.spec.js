import reducer, {
  // STARTED,
  // CANCELED,
  // PROGRESS,
  // FINISHED,
  // FAILED,
  FILE_TYPE_SELECTED,
  selectImportFileType,
  // FILE_SELECTED,
  selectImportFileName,
  // OPEN,
  // CLOSE,
  // SET_PREVIEW,
  // SET_DELIMITER,
  // SET_GUESSTIMATED_TOTAL,
  // SET_STOP_ON_ERRORS,
  // SET_IGNORE_BLANKS,
  // TOGGLE_INCLUDE_FIELD,
  // SET_FIELD_TYPE,
  INITIAL_STATE
} from './import';

// import PROCESS_STATUS from '../constants/process-status';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import path from 'path';
import { expect } from 'chai';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

/**
 * Sets up a fresh store using 'redux-mock-store'
 * providing a shortcut that does not use block scoped variables.
 *
 * @param {Object} test `this` inside an `it()` block.
 */
function setupMockStore(test) {
  const state = {
    importData: {
      ...INITIAL_STATE
    }
  };
  const store = mockStore(state);
  test.store = store;
}

/**
 * Boiler plate that I can set file types.
 *
 * @param {Object} test `this` inside an `it()` block.
 * @param {String} fileType json or csv.
 * @returns {Promise}
 */
function testSetFileType(test, fileType) {
  return new Promise(function(resolve) {
    // See https://github.com/dmitry-zaets/redux-mock-store/issues/71#issuecomment-369546064
    // redux-mock-store does not update state automatically.
    test.store.subscribe(() => {
      const expected = {
        fileType: fileType,
        type: FILE_TYPE_SELECTED
      };

      expect(reducer(test.state, expected).fileType).to.be.deep.equal(fileType);
    });
    test.store.dispatch(selectImportFileType(fileType));

    expect(test.store.getActions()).to.deep.equal([
      {
        fileType: fileType,
        type: FILE_TYPE_SELECTED
      }
    ]);
    resolve(test);
  });
}

describe('import [module]', function() {
  describe('selectImportFileType', function() {
    beforeEach(function() {
      setupMockStore(this);
    });

    it('dispatch a FILE_TYPE_SELECTED action and the reducer should update fileType to csv', function() {
      return testSetFileType(this, 'csv');
    });
    it('dispatch a FILE_TYPE_SELECTED action and the reducer should update fileType to json', function() {
      return testSetFileType(this, 'JSON');
    });

    afterEach(function() {
      this.store.clearActions();
    });
  });

  describe('#selectImportFileName', function() {
    beforeEach(function() {
      setupMockStore(this);
    });

    it('dispatch a FILE_SELECTED action', function() {
      const test = this;
      const fileName = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'test',
        'docs.json'
      );
      return new Promise(function(resolve) {
        // See https://github.com/dmitry-zaets/redux-mock-store/issues/71#issuecomment-369546064
        // redux-mock-store does not update state automatically.
        test.store.subscribe(() => {
          // const expected = {
          //   fileName: fileName,
          //   fileIsMultilineJSON: false,
          //   fileType: 'json',
          //   status: PROCESS_STATUS.UNSPECIFIED,
          //   progress: 0,
          //   docsWritten: 0,
          //   source: undefined,
          //   dest: undefined
          // };
          // console.log('subscribe touched', { args: arguments, actions: test.store.getActions()});
          const expected = {
            isOpen: false,
            progress: 0,
            error: null,
            fileName: '',
            fileIsMultilineJSON: false,
            useHeaderLines: true,
            status: 'UNSPECIFIED',
            fileStats: null,
            docsWritten: 0,
            guesstimatedDocsTotal: 0,
            delimiter: ',',
            stopOnErrors: false,
            ignoreBlanks: true,
            fields: [],
            values: [],
            previewLoaded: false,
            exclude: [],
            transform: [],
            fileType: ''
          };

          const result = reducer(test.state, expected);

          expect(result).to.be.deep.equal({
            isOpen: false,
            errors: [],
            fileName: '',
            fileIsMultilineJSON: false,
            useHeaderLines: true,
            status: 'UNSPECIFIED',
            fileStats: null,
            docsTotal: -1,
            docsProcessed: 0,
            docsWritten: 0,
            guesstimatedDocsTotal: 0,
            guesstimatedDocsProcessed: 0,
            delimiter: ',',
            stopOnErrors: false,
            ignoreBlanks: true,
            fields: [],
            values: [],
            previewLoaded: false,
            exclude: [],
            transform: [],
            fileType: ''
          });

          resolve(test);
        });

        test.store.dispatch(selectImportFileName(fileName));

        expect(test.store.getActions()).to.deep.equal([
          // {
          //   fileName: fileName,
          //   fileType: 'json',
          //   fileStats: {},
          //   fileIsMultilineJSON: false,
          //   type: FILE_SELECTED
          // }
        ]);
      });
    });

    afterEach(function() {
      this.store.clearActions();
    });
  });

  // describe('#reducer', () => {
  //   context('when the action type is FINISHED', () => {
  //     context('when the state has an error', () => {
  //       it('returns the new state and stays open', () => {
  //         expect(reducer({ error: true, isOpen: false }, action)).to.deep.equal({
  //           isOpen: true,
  //           progress: 100,
  //           error: true,
  //           status: undefined
  //         });
  //       });
  //     });

  //     context('when the state has no error', () => {
  //       const action = actions.onFinished();

  //       it('returns the new state and closes', () => {
  //         expect(reducer({ isOpen: true }, action)).to.deep.equal({
  //           isOpen: false,
  //           progress: 100,
  //           status: undefined
  //         });
  //       });
  //     });

  //     context('when the status is started', () => {
  //       const action = actions.onFinished();

  //       it('sets the status to completed', () => {
  //         expect(reducer({ status: PROCESS_STATUS.STARTED }, action)).to.deep.equal({
  //           isOpen: false,
  //           progress: 100,
  //           status: PROCESS_STATUS.COMPLETED
  //         });
  //       });
  //     });

  //     context('when the status is canceled', () => {
  //       const action = actions.onFinished();

  //       it('keeps the same status', () => {
  //         expect(reducer({ status: PROCESS_STATUS.CANCELED }, action)).to.deep.equal({
  //           isOpen: true,
  //           progress: 100,
  //           status: PROCESS_STATUS.CANCELED
  //         });
  //       });
  //     });

  //     context('when the status is failed', () => {
  //       const action = actions.onFinished();

  //       it('keeps the same status', () => {
  //         expect(reducer({ status: PROCESS_STATUS.FAILED }, action)).to.deep.equal({
  //           isOpen: true,
  //           progress: 100,
  //           status: PROCESS_STATUS.FAILED
  //         });
  //       });
  //     });
  //   });

  //   context('when the action type is PROGRESS', () => {
  //     const action = actions.onProgress(55);

  //     it('returns the new state', () => {
  //       expect(reducer(undefined, action)).to.deep.equal({
  //         isOpen: false,
  //         progress: 55,
  //         error: null,
  //         fileName: '',
  //         fileType: 'json',
  //         status: 'UNSPECIFIED'
  //       });
  //     });
  //   });

  //   context('when the action type is SELECT_FILE_TYPE', () => {
  //     const action = actions.selectImportFileType('csv');

  //     it('returns the new state', () => {
  //       expect(reducer(undefined, action)).to.deep.equal({
  //         isOpen: false,
  //         progress: 0,
  //         error: null,
  //         fileName: '',
  //         fileType: 'csv',
  //         status: 'UNSPECIFIED'
  //       });
  //     });
  //   });

  //   context('when the action type is SELECT_FILE_NAME', () => {
  //     const action = actions.selectImportFileName('test.json');

  //     it('returns the new state', () => {
  //       expect(reducer(undefined, action)).to.deep.equal({
  //         isOpen: false,
  //         progress: 0,
  //         error: null,
  //         fileName: 'test.json',
  //         fileType: 'json',
  //         status: 'UNSPECIFIED'
  //       });
  //     });
  //   });

  //   context('when the action type is OPEN', () => {
  //     const action = actions.openImport();

  //     it('returns the new state', () => {
  //       expect(reducer(undefined, action)).to.deep.equal({
  //         isOpen: true,
  //         progress: 0,
  //         error: null,
  //         fileName: '',
  //         fileType: 'json',
  //         status: 'UNSPECIFIED'
  //       });
  //     });
  //   });

  //   context('when the action type is CLOSE', () => {
  //     const action = actions.closeImport();

  //     it('returns the new state', () => {
  //       expect(reducer({}, action)).to.deep.equal({ isOpen: false });
  //     });
  //   });

  //   context('when the action type is FAILED', () => {
  //     const error = new Error('failed');
  //     const action = actions.onError(error);

  //     it('returns the new state', () => {
  //       expect(reducer(undefined, action)).to.deep.equal({
  //         isOpen: false,
  //         progress: 100,
  //         error: error,
  //         fileName: '',
  //         fileType: 'json',
  //         status: 'FAILED'
  //       });
  //     });
  //   });

  //   context('when the action type is not defined', () => {
  //     it('returns the initial state', () => {
  //       expect(reducer('', {})).to.equal('');
  //     });
  //   });
  // });

  // describe('#openImport', () => {
  //   it('returns the action', () => {
  //     expect(actions.openImport()).to.deep.equal({
  //       type: actions.OPEN
  //     });
  //   });
  // });

  // describe('#closeImport', () => {
  //   it('returns the action', () => {
  //     expect(actions.closeImport()).to.deep.equal({
  //       type: actions.CLOSE
  //     });
  //   });
  // });

  // describe('#onError', () => {
  //   const error = new Error('failed');

  //   it('returns the action', () => {
  //     expect(actions.onError(error)).to.deep.equal({
  //       type: actions.FAILED,
  //       error: error
  //     });
  //   });
  // });

  // describe('#onFinished', () => {
  //   it('returns the action', () => {
  //     expect(actions.onFinished()).to.deep.equal({
  //       type: actions.FINISHED
  //     });
  //   });
  // });

  // describe('#onProgress', () => {
  //   it('returns the action', () => {
  //     expect(actions.onProgress(34)).to.deep.equal({
  //       type: actions.PROGRESS,
  //       progress: 34,
  //       error: null
  //     });
  //   });
  // });

  // describe('#selectImportFileName', () => {
  //   it('returns the action', () => {
  //     expect(actions.selectImportFileName('test.json')).to.deep.equal({
  //       type: actions.SELECT_FILE_NAME,
  //       fileName: 'test.json'
  //     });
  //   });
  // });
});
