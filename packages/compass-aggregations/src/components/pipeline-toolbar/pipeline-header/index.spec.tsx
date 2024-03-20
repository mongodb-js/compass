import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';

import configureStore from '../../../../test/configure-store';
import { PipelineHeader } from '.';
import { PipelineStorageProvider } from '@mongodb-js/my-queries-storage/provider';
import { CompassPipelineStorage } from '@mongodb-js/my-queries-storage';

describe('PipelineHeader', function () {
  let container: HTMLElement;
  let onToggleOptionsSpy: SinonSpy;
  beforeEach(function () {
    onToggleOptionsSpy = spy();
    render(
      <PipelineStorageProvider value={new CompassPipelineStorage()}>
        <Provider store={configureStore()}>
          <PipelineHeader
            isOpenPipelineVisible
            isOptionsVisible
            showRunButton
            showExportButton
            showExplainButton
            onToggleOptions={onToggleOptionsSpy}
          />
        </Provider>
      </PipelineStorageProvider>
    );
    container = screen.getByTestId('pipeline-header');
  });

  it('open saved pipelines button', async function () {
    const button = within(container).getByTestId(
      'pipeline-toolbar-open-pipelines-button'
    );
    expect(button).to.exist;

    userEvent.click(button);

    expect(await screen.findByTestId('saved-pipelines')).to.exist;
  });
});
