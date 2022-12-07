import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import type { SinonSandbox } from 'sinon';
import { spy, createSandbox } from 'sinon';

import { PipelineExtraSettings } from './pipeline-extra-settings';
import preferences from 'compass-preferences-model';

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
      {...props}
    />
  );
};

describe('PipelineExtraSettings', function () {
  let sandbox: SinonSandbox
  beforeEach(function() {
    sandbox = createSandbox();
  })

  afterEach(function() {
    sandbox.restore();
  })

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

  it('does not show pipeline builder mode when feature flag is not enabled', function () {
    renderPipelineExtraSettings();
    expect(() => {
      screen.getByTestId('pipeline-builder-toggle');
    }).to.throw;
  });
  it('shows pipeline builder mode when feature flag is enabled', function () {
    sandbox.stub(preferences, 'getPreferences').returns({ enableTextAsPipeline: true } as any);
    renderPipelineExtraSettings();
    const container = screen.getByTestId('pipeline-toolbar-extra-settings');
    expect(within(container).getByTestId('pipeline-builder-toggle')).to.exist;
  });
});
