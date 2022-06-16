import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { PipelineStages } from './pipeline-stages';

const renderPipelineStages = (
  props: Partial<ComponentProps<typeof PipelineStages>> = {}
) => {
  render(
    <PipelineStages
      isResultsMode={false}
      stages={[]}
      showAddNewStage={true}
      onStageAdded={() => {}}
      onChangeWorkspace={() => {}}
      {...props}
    />
  );
  return screen.getByTestId('toolbar-pipeline-stages');
};

describe('PipelineStages', function () {
  it('renders text to show no stages are in pipeline', function () {
    const container = renderPipelineStages({
      isResultsMode: false,
      stages: [],
      showAddNewStage: true,
    });
    expect(
      within(container).findByText(
        'Your pipeline is currently empty. To get started select the first stage.'
      )
    ).to.exist;
  });

  describe('add stage button', function () {
    it('does not render add stage button', function () {
      const container = renderPipelineStages({ showAddNewStage: false });
      expect(() => {
        within(container).getByTestId('pipeline-toolbar-add-stage-button');
      }).to.throw;
    });
    it('renders add stage button', function () {
      const onStageAddedSpy = spy();
      const container = renderPipelineStages({
        showAddNewStage: true,
        onStageAdded: onStageAddedSpy,
      });
      expect(within(container).getByTestId('pipeline-toolbar-add-stage-button'))
        .to.exist;

      expect(onStageAddedSpy.calledOnce).to.be.false;
      userEvent.click(
        within(container).getByTestId('pipeline-toolbar-add-stage-button')
      );
      expect(onStageAddedSpy.calledOnce).to.be.true;
      expect(onStageAddedSpy.firstCall.args).to.be.empty;
    });
  });

  describe('builder mode', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      container = renderPipelineStages({
        isResultsMode: false,
        stages: ['$group', '$sort'],
        onStageAdded: onStageAddedSpy,
        onChangeWorkspace: onChangeWorkspaceSpy,
      });
    });
    it('renders stages in builder mode', function () {
      expect(within(container).findByText('$match')).to.exist;
      expect(within(container).findByText('$project')).to.exist;
    });
  });

  describe('results mode', function () {
    let container: HTMLElement;
    let onStageAddedSpy: SinonSpy;
    let onChangeWorkspaceSpy: SinonSpy;
    beforeEach(function () {
      onStageAddedSpy = spy();
      onChangeWorkspaceSpy = spy();
      container = renderPipelineStages({
        isResultsMode: true,
        stages: ['$match', '$project'],
        onStageAdded: onStageAddedSpy,
        onChangeWorkspace: onChangeWorkspaceSpy,
      });
    });

    it('renders stages', function () {
      expect(within(container).findByText('$match')).to.exist;
      expect(within(container).findByText('$project')).to.exist;
    });
    it('renders edit button', function () {
      expect(within(container).getByTestId('pipeline-toolbar-edit-button')).to
        .exist;
      expect(onChangeWorkspaceSpy.calledOnce).to.be.false;
      userEvent.click(
        within(container).getByTestId('pipeline-toolbar-edit-button')
      );
      expect(onChangeWorkspaceSpy.calledOnce).to.be.true;
      expect(onChangeWorkspaceSpy.firstCall.args).to.deep.equal(['builder']);
    });
  });
});
