import React from 'react';
import type { ComponentProps } from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';

import { PipelineExtraSettings } from './pipeline-extra-settings';

const renderPipelineExtraSettings = (
  props: Partial<ComponentProps<typeof PipelineExtraSettings>> = {}
) => {
  return render(
    <PipelineExtraSettings
      isAutoPreview={true}
      isPipelineModeDisabled={true}
      pipelineMode={'builder-ui'}
      onToggleAutoPreview={() => {}}
      onChangePipelineMode={() => {}}
      onToggleSettings={() => {}}
      onToggleSidePanel={() => {}}
      {...props}
    />
  );
};

describe('PipelineExtraSettings', function () {
  afterEach(cleanup);

  it('calls onToggleAutoPreview when clicked', function () {
    const onToggleAutoPreviewSpy = spy();
    renderPipelineExtraSettings({
      onToggleAutoPreview: onToggleAutoPreviewSpy,
    });
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    const toggle = within(container).getByTestId(
      'pipeline-toolbar-preview-toggle'
    );
    expect(toggle).to.exist;
    userEvent.click(toggle);
    expect(onToggleAutoPreviewSpy.calledOnce).to.be.true;
  });

  it('calls onToggleSettings when clicked', function () {
    const onToggleSettingsSpy = spy();
    renderPipelineExtraSettings({ onToggleSettings: onToggleSettingsSpy });
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    const button = within(container).getByTestId(
      'pipeline-toolbar-settings-button'
    );
    expect(button).to.exist;
    userEvent.click(button);
    expect(onToggleSettingsSpy.calledOnce).to.be.true;
  });

  it('shows pipeline builder toggle', function () {
    renderPipelineExtraSettings();
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    expect(within(container).getByTestId('pipeline-builder-toggle')).to.exist;
  });

  describe('stage wizard', function () {
    it('calls onToggleSidePanel when clicked', function () {
      const onToggleSidePanelSpy = spy();
      renderPipelineExtraSettings({ onToggleSidePanel: onToggleSidePanelSpy });
      const container = screen.getByTestId('pipeline-toolbar-extra-settings');
      const button = within(container).getByTestId(
        'pipeline-toolbar-side-panel-button'
      );
      expect(button).to.exist;
      expect(onToggleSidePanelSpy.calledOnce).to.be.false;
      userEvent.click(button);
      expect(onToggleSidePanelSpy.calledOnce).to.be.true;
    });

    it('disables toggle side panel button in text mode', function () {
      renderPipelineExtraSettings({
        pipelineMode: 'as-text',
      });
      expect(
        screen
          .getByTestId('pipeline-toolbar-side-panel-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });
  });
});
