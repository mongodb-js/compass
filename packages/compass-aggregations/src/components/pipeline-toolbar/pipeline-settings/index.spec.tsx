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
  let onCreateNewPipelineSpy: SinonSpy;
  beforeEach(async function () {
    onExportToLanguageSpy = spy();
    onCreateNewPipelineSpy = spy();
    await renderWithStore(
      <PipelineSettings
        isExportToLanguageEnabled={true}
        onExportToLanguage={onExportToLanguageSpy}
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

  it('calls onExportToLanguage callback when export to language button is clicked', function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-export-button'
    );
    expect(button).to.exist;

    userEvent.click(button);

    expect(onExportToLanguageSpy.calledOnce).to.be.true;
  });
});
