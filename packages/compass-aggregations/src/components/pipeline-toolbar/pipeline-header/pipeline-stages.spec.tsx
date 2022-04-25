import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { PipelineStages } from './pipeline-stages';

describe('PipelineStages', function () {
  describe('No stage', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      render(
        <PipelineStages
          isEditing={false}
          stages={[]}
          onStageAdded={onStageAddedSpy}
          onChangeWorkspace={onChangeWorkspaceSpy}
        />
      );
      container = screen.getByTestId('toolbar-pipeline-stages');
    });

    it('renders text to show no stages are in pipeline', function () {
      expect(
        within(container).findByText(
          'Your pipeline is currently empty. To get started select the first stage.'
        )
      ).to.exist;
    });

    it('renders button to add first stage - when pipeline is empty', function () {
      expect(within(container).getByTestId('pipeline-toolbar-add-stage-button'))
        .to.exist;
    });

    it('calls onStageAdded when user clicks on add first stage button', function () {
      userEvent.click(
        within(container).getByTestId('pipeline-toolbar-add-stage-button')
      );
      expect(onStageAddedSpy.calledOnce).to.be.true;
      expect(onStageAddedSpy.firstCall.args).to.be.empty;
    });
  });

  describe('Invalid stages', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      render(
        <PipelineStages
          isEditing={false}
          stages={['', '', '']}
          onStageAdded={onStageAddedSpy}
          onChangeWorkspace={onChangeWorkspaceSpy}
        />
      );
      container = screen.getByTestId('toolbar-pipeline-stages');
    });
    it('renders text to show no stages are in pipeline', function () {
      expect(within(container).findByText('Your pipeline is currently empty.'))
        .to.exist;
    });

    it('does not render button to add first stage - when pipeline is not empty', function () {
      expect(() => {
        within(container).getByTestId('pipeline-toolbar-add-stage-button');
      }).to.throw;
    });
  });

  describe('Proper stages in builder state', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      render(
        <PipelineStages
          isEditing={false} // Corresponds to builder state
          stages={['$match', '', '$project']}
          onStageAdded={onStageAddedSpy}
          onChangeWorkspace={onChangeWorkspaceSpy}
        />
      );
      container = screen.getByTestId('toolbar-pipeline-stages');
    });
    it('renders stages', function () {
      expect(within(container).findByText('$match')).to.exist;
      expect(within(container).findByText('$project')).to.exist;
    });
  });

  describe('Proper stages in results state', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      render(
        <PipelineStages
          isEditing={true} // Corresponds to results state
          stages={['$match', '', '$project']}
          onStageAdded={onStageAddedSpy}
          onChangeWorkspace={onChangeWorkspaceSpy}
        />
      );
      container = screen.getByTestId('toolbar-pipeline-stages');
    });
    it('renders stages', function () {
      expect(within(container).findByText('$match')).to.exist;
      expect(within(container).findByText('$project')).to.exist;
    });
    it('renders edit button', function () {
      expect(within(container).getByTestId('pipeline-toolbar-edit-button')).to
        .exist;
    });
    it('calls onChangeWorkspace when user clicks on edit button', function () {
      userEvent.click(
        within(container).getByTestId('pipeline-toolbar-edit-button')
      );
      expect(onChangeWorkspaceSpy.calledOnce).to.be.true;
      expect(onChangeWorkspaceSpy.firstCall.args).to.deep.equal(['builder']);
    });
  });
});
