import reducer, * as actions from 'modules/import';
import PROCESS_STATUS from 'constants/process-status';

describe('import [module]', () => {
  describe('#reducer', () => {
    context('when the action type is IMPORT_FINISHED', () => {
      context('when the state has an error', () => {
        const action = actions.importFinished();

        it('returns the new state and stays open', () => {
          expect(reducer({ error: true, isOpen: false }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            error: true,
            status: undefined
          });
        });
      });

      context('when the state has no error', () => {
        const action = actions.importFinished();

        it('returns the new state and closes', () => {
          expect(reducer({ isOpen: true }, action)).to.deep.equal({
            isOpen: false,
            progress: 100,
            status: undefined
          });
        });
      });

      context('when the status is started', () => {
        const action = actions.importFinished();

        it('sets the status to completed', () => {
          expect(reducer({ status: PROCESS_STATUS.STARTED }, action)).to.deep.equal({
            isOpen: false,
            progress: 100,
            status: PROCESS_STATUS.COMPLETED
          });
        });
      });

      context('when the status is canceled', () => {
        const action = actions.importFinished();

        it('keeps the same status', () => {
          expect(reducer({ status: PROCESS_STATUS.CANCELED }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            status: PROCESS_STATUS.CANCELED
          });
        });
      });

      context('when the status is failed', () => {
        const action = actions.importFinished();

        it('keeps the same status', () => {
          expect(reducer({ status: PROCESS_STATUS.FAILED }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            status: PROCESS_STATUS.FAILED
          });
        });
      });
    });

    context('when the action type is IMPORT_PROGRESS', () => {
      const action = actions.importProgress(55);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 55,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is SELECT_IMPORT_FILE_TYPE', () => {
      const action = actions.selectImportFileType('csv');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'csv',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is SELECT_IMPORT_FILE_NAME', () => {
      const action = actions.selectImportFileName('test.json');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          error: null,
          fileName: 'test.json',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is OPEN_IMPORT', () => {
      const action = actions.openImport();

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: true,
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is CLOSE_IMPORT', () => {
      const action = actions.closeImport();

      it('returns the new state', () => {
        expect(reducer({}, action)).to.deep.equal({ isOpen: false });
      });
    });

    context('when the action type is IMPORT_FAILED', () => {
      const error = new Error('failed');
      const action = actions.importFailed(error);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 100,
          error: error,
          fileName: '',
          fileType: 'json',
          status: 'FAILED'
        });
      });
    });

    context('when the action type is not defined', () => {
      it('returns the initial state', () => {
        expect(reducer('', {})).to.equal('');
      });
    });
  });

  describe('#openImport', () => {
    it('returns the action', () => {
      expect(actions.openImport()).to.deep.equal({
        type: actions.OPEN_IMPORT
      });
    });
  });

  describe('#closeImport', () => {
    it('returns the action', () => {
      expect(actions.closeImport()).to.deep.equal({
        type: actions.CLOSE_IMPORT
      });
    });
  });

  describe('#importFailed', () => {
    const error = new Error('failed');

    it('returns the action', () => {
      expect(actions.importFailed(error)).to.deep.equal({
        type: actions.IMPORT_FAILED,
        error: error
      });
    });
  });

  describe('#importFinished', () => {
    it('returns the action', () => {
      expect(actions.importFinished()).to.deep.equal({
        type: actions.IMPORT_FINISHED
      });
    });
  });

  describe('#importProgress', () => {
    it('returns the action', () => {
      expect(actions.importProgress(34)).to.deep.equal({
        type: actions.IMPORT_PROGRESS,
        progress: 34,
        error: null
      });
    });
  });

  describe('#selectImportFileName', () => {
    it('returns the action', () => {
      expect(actions.selectImportFileName('test.json')).to.deep.equal({
        type: actions.SELECT_IMPORT_FILE_NAME,
        fileName: 'test.json'
      });
    });
  });

  describe('#selectImportFileType', () => {
    it('returns the action', () => {
      expect(actions.selectImportFileType('csv')).to.deep.equal({
        type: actions.SELECT_IMPORT_FILE_TYPE,
        fileType: 'csv'
      });
    });
  });
});
