import React from 'react';
import {
  cleanup,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { renderWithStore } from '../../../../test/configure-store';
import { PipelineSettings } from '.';

describe('PipelineSettings', function () {
  let container: HTMLElement;
  let onExportToLanguageSpy: SinonSpy;
  let onExportDataSpy: SinonSpy;
  let onCreateNewPipelineSpy: SinonSpy;
  beforeEach(async function () {
    onExportToLanguageSpy = spy();
    onExportDataSpy = spy();
    onCreateNewPipelineSpy = spy();
    await renderWithStore(
      <PipelineSettings
        isExportToLanguageEnabled={true}
        isExportDataEnabled={true}
        onExportToLanguage={onExportToLanguageSpy}
        onExportData={onExportDataSpy}
        onCreateNewPipeline={onCreateNewPipelineSpy}
      />
    );
    container = screen.getByTestId('pipeline-settings');
  });

  afterEach(cleanup);

  it('calls onCreateNewPipeline callback when create new button is clicked', function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-create-new-button'
    );
    expect(button).to.exist;
    expect(onCreateNewPipelineSpy.calledOnce).to.be.false;
    userEvent.click(button);
    expect(onCreateNewPipelineSpy.calledOnce).to.be.true;
  });

  it('calls onExportToLanguage callback when export code button is clicked', function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-export-code-button'
    );
    expect(button).to.exist;

    userEvent.click(button);

    expect(onExportToLanguageSpy.calledOnce).to.be.true;
  });
});
