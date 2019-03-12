import React from 'react';
import { mount } from 'enzyme';

import Settings from './settings.jsx';
import { INITIAL_STATE } from 'modules/settings';

import styles from './settings.less';

describe('Settings [Component]', () => {
  let state;
  let component;
  let applySettingsSpy;
  let toggleSettingsIsExpandedSpy;
  let toggleSettingsIsCommentModeSpy;
  let setSettingsSampleSizeSpy;
  let setSettingsMaxTimeMSSpy;
  let setSettingsLimitSpy;
  let toggleCommentsSpy;
  let runStageSpy;

  beforeEach(() => {
    applySettingsSpy = sinon.spy();
    toggleSettingsIsExpandedSpy = sinon.spy();
    toggleSettingsIsCommentModeSpy = sinon.spy();
    setSettingsSampleSizeSpy = sinon.spy();
    setSettingsMaxTimeMSSpy = sinon.spy();
    setSettingsLimitSpy = sinon.spy();
    runStageSpy = sinon.spy();

    state = {
      ...INITIAL_STATE,
      applySettings: applySettingsSpy,
      toggleSettingsIsExpanded: toggleSettingsIsExpandedSpy,
      toggleSettingsIsCommentMode: toggleSettingsIsCommentModeSpy,
      setSettingsSampleSize: setSettingsSampleSizeSpy,
      setSettingsMaxTimeMS: setSettingsMaxTimeMSSpy,
      setSettingsLimit: setSettingsLimitSpy,
      isCommenting: true,
      toggleComments: toggleCommentsSpy,
      limit: INITIAL_STATE.sampleSize,
      largeLimit: INITIAL_STATE.limit,
      maxTimeMS: INITIAL_STATE.maxTimeMS,
      runStage: runStageSpy,
      settings: INITIAL_STATE
    };
  });

  afterEach(() => {
    component = null;
    state = null;
    toggleSettingsIsExpandedSpy = null;
    toggleSettingsIsCommentModeSpy = null;
    setSettingsSampleSizeSpy = null;
    setSettingsMaxTimeMSSpy = null;
    setSettingsLimitSpy = null;
    toggleCommentsSpy = null;
    runStageSpy = null;
  });

  it('is hidden by default', () => {
    component = mount(<Settings {...state} />);
    expect(Object.keys(component).length).to.equal(0);
  });

  it('is rendered when isExpanded=true', () => {
    const props = { ...state, isExpanded: true };
    component = mount(<Settings {...props} />);
    expect(component.find(`.${styles.container}`)).to.be.present();
  });

  describe('When opened', () => {
    it('should close when Cancel is clicked', () => {
      const props = { ...state, isExpanded: true };
      component = mount(<Settings {...props} />);
      component
        .find('#aggregations-settings-cancel')
        .hostNodes()
        .simulate('click');
      expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
    });

    it('should update the settings, re-run the pipeline, and Close', () => {
      const props = { ...state, isExpanded: true };

      component = mount(<Settings {...props} />);
      component
        .find('#aggregation-settings-apply')
        .hostNodes()
        .simulate('click');

      expect(applySettingsSpy.calledOnce).to.equal(true);
      expect(runStageSpy.calledOnce).to.equal(true);
      expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
    });
  });
});
