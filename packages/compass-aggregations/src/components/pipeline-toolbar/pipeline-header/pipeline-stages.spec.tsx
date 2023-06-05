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
      onAddStageClick={() => {}}
      onEditPipelineClick={() => {}}
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
    const content = container.textContent?.trim().replace(/\u00a0/g, ' ');
    expect(content).to.equal(
      `Your pipeline is currently empty. To get started add the first stage.`
    );
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
        onAddStageClick: onStageAddedSpy,
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
        onAddStageClick: onStageAddedSpy,
        onEditPipelineClick: onChangeWorkspaceSpy,
      });
    });
    it('renders stages in builder mode', async function () {
      expect(await within(container).findByText('$group')).to.exist;
      expect(await within(container).findByText('$sort')).to.exist;
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
        onAddStageClick: onStageAddedSpy,
        onEditPipelineClick: onChangeWorkspaceSpy,
      });
    });

    it('renders stages', async function () {
      expect(await within(container).findByText('$match')).to.exist;
      expect(await within(container).findByText('$project')).to.exist;
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
