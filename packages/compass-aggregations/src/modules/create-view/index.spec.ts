import reducer, {
  INITIAL_STATE,
  reset,
  open,
  close,
  toggleIsRunning,
  handleError,
  clearError,
  changeViewName,
} from './';
import { expect } from 'chai';

describe('create view module', function () {
  it('handles the open and close actions', function () {
    const stateAfterOpen = reducer(
      INITIAL_STATE,
      open({
        connectionId: 'TEST',
        sourceNs: 'test.coll',
        sourcePipeline: [],
        duplicate: true,
      })
    );
    expect(stateAfterOpen).to.deep.equal({
      ...INITIAL_STATE,
      connectionId: 'TEST',
      isRunning: false,
      isVisible: true,
      isDuplicating: true,
      name: '',
      source: 'test.coll',
      pipeline: [],
    });

    expect(reducer(stateAfterOpen, close())).to.deep.equal(INITIAL_STATE);
  });

  it('handles the reset action', function () {
    const isRunningState = reducer(INITIAL_STATE, toggleIsRunning(true));
    expect(reducer(isRunningState, reset())).to.deep.equal({
      ...INITIAL_STATE,
    });
  });

  it('handles the toggleIsRunning action', function () {
    const isRunningState = reducer(INITIAL_STATE, toggleIsRunning(true));
    expect(isRunningState).to.deep.equal({
      ...INITIAL_STATE,
      isRunning: true,
    });
    expect(reducer(isRunningState, toggleIsRunning(false))).to.deep.equal({
      ...isRunningState,
      isRunning: false,
    });
  });

  it('handles the handleError and clearError actions', function () {
    const err = new Error('Oops!');
    const erroredState = reducer(INITIAL_STATE, handleError(err));
    expect(erroredState).to.deep.equal({
      ...INITIAL_STATE,
      error: err,
    });

    expect(reducer(erroredState, clearError())).to.deep.equal({
      ...erroredState,
      error: null,
    });
  });

  it('handles the changeViewName action', function () {
    expect(reducer(INITIAL_STATE, changeViewName('Yikes'))).to.deep.equal({
      ...INITIAL_STATE,
      name: 'Yikes',
    });
  });
});
