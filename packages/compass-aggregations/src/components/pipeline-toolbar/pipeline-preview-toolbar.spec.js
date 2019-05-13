import React from 'react';
import { mount } from 'enzyme';

import PipelinePreviewToolbar from './pipeline-preview-toolbar';
import styles from './pipeline-preview-toolbar.less';

describe('PipelinePreviewToolbar [Component]', () => {
  let component;
  let toggleSampleSpy;
  let toggleAutoPreviewSpy;
  let toggleSettingsIsExpandedSpy;
  let toggleFullscreenSpy;

  beforeEach(() => {
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

  afterEach(() => {
    component = null;
    toggleSampleSpy = null;
    toggleAutoPreviewSpy = null;
    toggleSettingsIsExpandedSpy = null;
    toggleFullscreenSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['container-right']}`)).to.be.present();
  });
  describe('Sample Mode', () => {
    it('renders the sample mode text', () => {
      expect(
        component.find(`.${styles['toggle-sample-label']}`).hostNodes()
      ).to.have.text('Sample Mode');
    });
    it('renders the tooltip', () => {
      const toggleClassName = styles['toggle-sample'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
    describe('when toggling sampling', () => {
      it('calls the action', () => {
        component
          .find(`.${styles['toggle-sample']} .${styles.switch}`)
          .hostNodes()
          .simulate('click');
        expect(toggleSampleSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe('Auto-Preview', () => {
    it('renders the auto preview mode text', () => {
      expect(
        component.find(`.${styles['toggle-auto-preview-label']}`).hostNodes()
      ).to.have.text('Auto Preview');
    });
    it('renders the tooltip', () => {
      const toggleClassName = styles['toggle-auto-preview'];
      expect(
        component.find(`.${toggleClassName} .hadron-tooltip`)
      ).to.be.present();
    });
    describe('when toggling auto previewing', () => {
      it('calls the action', () => {
        component
          .find(`.${styles['toggle-auto-preview']} .${styles.switch}`)
          .hostNodes()
          .simulate('click');
        expect(toggleAutoPreviewSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe('Settings', () => {
    it('renders the wrapper div', () => {
      expect(component.find(`.${styles.settings}`)).to.be.present();
    });
    describe('When the gear icon is clicked', () => {
      it('opens the settings sidebar', () => {
        component
          .find('.fa-gear')
          .hostNodes()
          .simulate('click');
        expect(toggleSettingsIsExpandedSpy.calledOnce).to.equal(true);
      });
    });
  });
  describe.skip('Fullscreen', () => {
    it('renders the wrapper div', () => {
      expect(component.find(`.${styles.fullscreen}`)).to.be.present();
    });
    it('has the right icon', () => {
      expect(component.find(`.${styles.fullscreen} .fa-expand`)).to.be.present();
    });
    describe('When the fullscreen icon is clicked', () => {
      it('goes into fullscreen', () => {
        component
          .find('.fa-expand')
          .hostNodes()
          .simulate('click');
        expect(toggleFullscreenSpy.calledOnce).to.equal(true);
      });
    });
  });
});
