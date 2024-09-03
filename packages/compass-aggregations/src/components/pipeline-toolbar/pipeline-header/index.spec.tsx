import React from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { renderWithStore } from '../../../../test/configure-store';
import { PipelineHeader } from '.';
import { CompassPipelineStorage } from '@mongodb-js/my-queries-storage';

describe('PipelineHeader', function () {
  let container: HTMLElement;
  let onToggleOptionsSpy: SinonSpy;
  beforeEach(async function () {
    onToggleOptionsSpy = spy();
    await renderWithStore(
      <PipelineHeader
        isOpenPipelineVisible
        isOptionsVisible
        showRunButton
        showExportButton
        showExplainButton
        onToggleOptions={onToggleOptionsSpy}
      />,
      undefined,
      undefined,
      { pipelineStorage: new CompassPipelineStorage() }
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
