import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import Settings from './settings';
import { INITIAL_STATE } from '../../modules/settings';

describe('Settings [Component]', function () {
  let state: any;
  let component: ReturnType<typeof mount>;
  let applySettingsSpy: sinon.SinonSpy;
  let toggleSettingsIsExpandedSpy: sinon.SinonSpy;
  let toggleSettingsIsCommentModeSpy: sinon.SinonSpy;
  let setSettingsSampleSizeSpy: sinon.SinonSpy;
  let setSettingsLimitSpy: sinon.SinonSpy;
  let runStageSpy: sinon.SinonSpy;

  context('when the component is not atlas deployed', function () {
    beforeEach(function () {
      applySettingsSpy = sinon.spy();
      toggleSettingsIsExpandedSpy = sinon.spy();
      toggleSettingsIsCommentModeSpy = sinon.spy();
      setSettingsSampleSizeSpy = sinon.spy();
      setSettingsLimitSpy = sinon.spy();
      runStageSpy = sinon.spy();

      state = {
        ...INITIAL_STATE,
        applySettings: applySettingsSpy,
        toggleSettingsIsExpanded: toggleSettingsIsExpandedSpy,
        toggleSettingsIsCommentMode: toggleSettingsIsCommentModeSpy,
        setSettingsSampleSize: setSettingsSampleSizeSpy,
        setSettingsLimit: setSettingsLimitSpy,
        isCommenting: true,
        limit: INITIAL_STATE.sampleSize,
        largeLimit: INITIAL_STATE.limit,
        runStage: runStageSpy,
        settings: INITIAL_STATE,
      };
    });

    it('is hidden by default', function () {
      component = mount(<Settings {...state} />);
      expect(Object.keys(component).length).to.equal(0);
    });

    it('is rendered when isExpanded=true', function () {
      const props = { ...state, isExpanded: true };
      component = mount(<Settings {...props} />);
      expect(component.text()).to.contain('Settings');
    });

    describe('When opened', function () {
      it('should close when Cancel is clicked', function () {
        const props = { ...state, isExpanded: true };
        component = mount(<Settings {...props} />);
        component
          .find('#aggregations-settings-cancel')
          .hostNodes()
          .simulate('click');
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });

      it('should update the settings, re-run the pipeline, and Close', function () {
        const props = { ...state, isExpanded: true };

        component = mount(<Settings {...props} />);
        component
          .find('#aggregation-settings-apply')
          .hostNodes()
          .simulate('click');

        expect(applySettingsSpy.calledOnce).to.equal(true);
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });
    });
  });

  context('when the component is atlas deployed', function () {
    beforeEach(function () {
      applySettingsSpy = sinon.spy();
      toggleSettingsIsExpandedSpy = sinon.spy();
      toggleSettingsIsCommentModeSpy = sinon.spy();
      setSettingsSampleSizeSpy = sinon.spy();
      setSettingsLimitSpy = sinon.spy();
      runStageSpy = sinon.spy();

      state = {
        ...INITIAL_STATE,
        applySettings: applySettingsSpy,
        toggleSettingsIsExpanded: toggleSettingsIsExpandedSpy,
        toggleSettingsIsCommentMode: toggleSettingsIsCommentModeSpy,
        setSettingsSampleSize: setSettingsSampleSizeSpy,
        setSettingsLimit: setSettingsLimitSpy,
        isCommenting: true,
        limit: INITIAL_STATE.sampleSize,
        largeLimit: INITIAL_STATE.limit,
        runStage: runStageSpy,
        settings: INITIAL_STATE,
      };
    });

    it('hides the large limit option', function () {
      const props = { ...state };
      component = mount(<Settings {...props} />);
      expect(component.find('label[innerText="Limit"]')).to.not.exist;
    });
  });
});
