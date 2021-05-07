import { dataServiceDisconnected } from 'modules/index';
import AppRegistry from 'hadron-app-registry';
import { RESET } from 'modules/reset';
import UI_STATES from 'constants/ui-states';

describe('dataServiceDisconnected', () => {
  let resetSpy;
  let doneSpy;
  let appRegistry;
  beforeEach(() => {
    resetSpy = sinon.spy();
    doneSpy = sinon.spy();
    appRegistry = new AppRegistry();
    appRegistry.getAction = () => ({done: doneSpy});
  });
  afterEach(() => {
    resetSpy = null;
    doneSpy = null;
    appRegistry = null;
  });

  it('ui status is complete', () => {
    const dispatch = (res) => {
      expect(res).to.deep.equal({
        type: RESET
      });
      resetSpy();
    };
    const state = () => ({
      uiStatus: UI_STATES.COMPLETE
    });
    dataServiceDisconnected(appRegistry)(dispatch, state);
    expect(resetSpy.calledOnce).to.equal(true);
    expect(doneSpy.calledOnce).to.equal(true);
  });
  it('ui status is initial', () => {
    const dispatch = (res) => {
      expect(res).to.deep.equal({
        type: RESET
      });
      resetSpy();
    };
    const state = () => ({
      uiStatus: UI_STATES.INITIAL
    });
    dataServiceDisconnected(appRegistry)(dispatch, state);
    expect(resetSpy.calledOnce).to.equal(true);
    expect(doneSpy.calledOnce).to.equal(true);
  });
  it('ui status is error', () => {
    const dispatch = (res) => {
      expect(res).to.deep.equal({
        type: RESET
      });
      resetSpy();
    };
    const state = () => ({
      uiStatus: UI_STATES.ERROR
    });
    dataServiceDisconnected(appRegistry)(dispatch, state);
    expect(resetSpy.calledOnce).to.equal(false);
    expect(doneSpy.calledOnce).to.equal(false);
  });
  it('ui status is loading', () => {
    const dispatch = (res) => {
      expect(res).to.deep.equal({
        type: RESET
      });
      resetSpy();
    };
    const state = () => ({
      uiStatus: UI_STATES.LOADING
    });
    dataServiceDisconnected(appRegistry)(dispatch, state);
    expect(resetSpy.calledOnce).to.equal(false);
    expect(doneSpy.calledOnce).to.equal(false);
  });
});
