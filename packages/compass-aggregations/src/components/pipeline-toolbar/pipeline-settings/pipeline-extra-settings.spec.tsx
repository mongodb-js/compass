import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import type { SinonSandbox } from 'sinon';
import { spy, createSandbox } from 'sinon';

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
      {...props}
    />
  );
};

describe('PipelineExtraSettings', function () {
  let sandbox: SinonSandbox;
  beforeEach(function () {
    sandbox = createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

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
});
