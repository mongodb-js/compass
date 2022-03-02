import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import PipelinePreviewToolbar from './pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.module.less';

describe('PipelinePreviewToolbar [Component]', function() {
  let component;
  let toggleSampleSpy;
  let toggleAutoPreviewSpy;
  let toggleSettingsIsExpandedSpy;
  let toggleFullscreenSpy;

  beforeEach(function() {
    toggleSampleSpy = sinon.spy();
    toggleAutoPreviewSpy = sinon.spy();
    toggleSettingsIsExpandedSpy = sinon.spy();
    toggleFullscreenSpy = sinon.spy();

    component = mount(
      <PipelinePreviewToolbar
        isAtlasDeployed={false}
        toggleSample={toggleSampleSpy}
        toggleAutoPreview={toggleAutoPreviewSpy}
        toggleSettingsIsExpanded={toggleSettingsIsExpandedSpy}
        isModified
        isSampling
        isAutoPreviewing
        isFullscreenOn={false}
        toggleFullscreen={toggleFullscreenSpy}
      />
    );
  });

  afterEach(function() {
    component = null;
    toggleSampleSpy = null;
    toggleAutoPreviewSpy = null;
    toggleSettingsIsExpandedSpy = null;
    toggleFullscreenSpy = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['container-right']}`)).to.be.present();
  });
  describe('Sample Mode', function() {
    it('renders the sample mode text', function() {
      expect(
        component.find(`.${styles['toggle-sample-label']}`).hostNodes()
      ).to.have.text('Sample Mode');
    });
    it('renders the tooltip', function() {
      const toggleClassName = styles['toggle-sample'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
    describe('when toggling sampling', function() {
      it('calls the action', function() {
        component
          .find('#sampleModeToggle')
          .hostNodes()
          .simulate('click');
        expect(toggleSampleSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe('Auto-Preview', function() {
    it('renders the auto preview mode text', function() {
      expect(
        component.find(`.${styles['toggle-auto-preview-label']}`).hostNodes()
      ).to.have.text('Auto Preview');
    });
    it('renders the tooltip', function() {
      const toggleClassName = styles['toggle-auto-preview'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
    describe('when toggling auto previewing', function() {
      it('calls the action', function() {
        component
          .find('#autoPreviewToggle')
          .hostNodes()
          .simulate('click');
        expect(toggleAutoPreviewSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe('Settings', function() {
    it('renders the wrapper div', function() {
      expect(component.find(`.${styles.settings}`)).to.be.present();
    });
    describe('When the gear icon is clicked', function() {
      it('opens the settings sidebar', function() {
        component
          .find('.fa-gear')
          .hostNodes()
          .simulate('click');
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe.skip('Fullscreen', function() {
    it('renders the wrapper div', function() {
      expect(component.find(`.${styles.fullscreen}`)).to.be.present();
    });
    it('has the right icon', function() {
      expect(component.find(`.${styles.fullscreen} .fa-expand`)).to.be.present();
    });
    describe('When the fullscreen icon is clicked', function() {
      it('goes into fullscreen', function() {
        component
          .find('.fa-expand')
          .hostNodes()
          .simulate('click');
        expect(toggleFullscreenSpy.calledOnce).to.equal(true);
      });
    });
  });
});
