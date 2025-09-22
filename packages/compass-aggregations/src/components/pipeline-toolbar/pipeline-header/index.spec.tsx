import React from 'react';
import { screen, within, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { renderWithStore } from '../../../../test/configure-store';
import { PipelineHeader } from '.';
import { createElectronPipelineStorage } from '@mongodb-js/my-queries-storage/electron';

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
      {
        pipelineStorage: {
          getStorage: () =>
            createElectronPipelineStorage({ basepath: '/tmp/test' }),
        },
      }
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
