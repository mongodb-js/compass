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
  let onCreateNewPipelineSpy: SinonSpy;

  afterEach(cleanup);

  describe('when the pipeline is already a new one', function () {
    beforeEach(async function () {
      onCreateNewPipelineSpy = spy();
      await renderWithStore(
        <PipelineSettings
          isCreateNewPipelineDisabled={true}
          onCreateNewPipeline={onCreateNewPipelineSpy}
        />
      );
      container = screen.getByTestId('pipeline-settings');
    });

    it('renders the create new button disabled', function () {
      const button = within(container).getByTestId(
        'pipeline-toolbar-create-new-button'
      );
      expect(button).to.exist;
      expect(button.getAttribute('aria-disabled')).to.equal('true');
    });

    it('does not invoke onCreateNewPipeline when the create new button is disabled', function () {
      const button = within(container).getByTestId(
        'pipeline-toolbar-create-new-button'
      );
      userEvent.click(button);
      expect(onCreateNewPipelineSpy.called).to.be.false;
    });
  });

  describe('when the pipeline has content to clear', function () {
    beforeEach(async function () {
      onCreateNewPipelineSpy = spy();
      await renderWithStore(
        <PipelineSettings
          isCreateNewPipelineDisabled={false}
          onCreateNewPipeline={onCreateNewPipelineSpy}
        />
      );
      container = screen.getByTestId('pipeline-settings');
    });

    it('renders the create new button enabled', function () {
      const button = within(container).getByTestId(
        'pipeline-toolbar-create-new-button'
      );
      expect(button.getAttribute('aria-disabled')).to.not.equal('true');
    });

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
