import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { PipelineExtraSettings } from './pipeline-extra-settings';

describe('PipelineExtraSettings', function () {
  let container: HTMLElement;
  let onToggleAutoPreviewSpy: SinonSpy;
  let onToggleSettingsSpy: SinonSpy;
  beforeEach(function () {
    onToggleAutoPreviewSpy = spy();
    onToggleSettingsSpy = spy();
    render(
      <PipelineExtraSettings
        isAutoPreview={true}
        onToggleAutoPreview={onToggleAutoPreviewSpy}
        onToggleSettings={onToggleSettingsSpy}
      />
    );
    container = screen.getByTestId('pipeline-toolbar-extra-settings');
  });

  it('auto-preview', function () {
    const toggle = within(container).getByTestId(
      'pipeline-toolbar-preview-toggle'
    );
    expect(toggle).to.exist;
    userEvent.click(toggle);

    expect(onToggleAutoPreviewSpy.calledOnce).to.be.true;
    expect(onToggleAutoPreviewSpy.firstCall.args).to.be.empty;
  });

  it('settings', function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-settings-button'
    );
    expect(button).to.exist;
    userEvent.click(button);

    expect(onToggleSettingsSpy.calledOnce).to.be.true;
    expect(onToggleSettingsSpy.firstCall.args).to.be.empty;
  });
});
