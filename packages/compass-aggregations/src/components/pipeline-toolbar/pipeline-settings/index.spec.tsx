import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';

import configureStore from '../../../../test/configure-store';
import { PipelineSettings } from '.';

describe('PipelineSettings', function () {
  let container: HTMLElement;
  let onExportToLanguageSpy: SinonSpy;
  let onCreateNewPipelineSpy: SinonSpy;
  beforeEach(function () {
    onExportToLanguageSpy = spy();
    onCreateNewPipelineSpy = spy();
    render(
      <Provider store={configureStore()}>
        <PipelineSettings
          isExportToLanguageEnabled={true}
          onExportToLanguage={onExportToLanguageSpy}
          onCreateNewPipeline={onCreateNewPipelineSpy}
        />
      </Provider>
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
