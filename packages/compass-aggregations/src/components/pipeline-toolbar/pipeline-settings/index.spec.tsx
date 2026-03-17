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
  describe('basic functionality', function () {
    let container: HTMLElement;
    let onCreateNewPipelineSpy: SinonSpy;
    beforeEach(async function () {
      onCreateNewPipelineSpy = spy();
      await renderWithStore(
        <PipelineSettings onCreateNewPipeline={onCreateNewPipelineSpy} />
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

    it('renders the export pipeline actions', function () {
      expect(screen.getByText('Export Data')).to.be.visible;
      expect(screen.getByText('Export Code')).to.be.visible;
    });
  });
});
