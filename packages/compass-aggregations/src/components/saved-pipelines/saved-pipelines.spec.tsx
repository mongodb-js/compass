import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sinon from 'sinon';

import { SavedPipelines } from './saved-pipelines';

const renderSavedPipelines = (
  props: Partial<ComponentProps<typeof SavedPipelines>> = {}
) => {
  render(
    <SavedPipelines
      savedPipelines={[]}
      namespace="test.test123"
      onOpenPipeline={() => {}}
      onCancelOpenPipeline={() => {}}
      onConfirmOpen={() => {}}
      onDeletePipeline={() => {}}
      onCancelDeletePipeline={() => {}}
      onConfirmDelete={() => {}}
      {...props}
    />
  );
};

const openPipelineModalTestId = 'restore-pipeline-modal';
const deletePipelineModalTestId = 'delete-pipeline-modal';

describe('SavedPipelines', function () {
  it('renders the title and namespace text', function () {
    renderSavedPipelines({
      namespace: 'airbnb.users',
    });
    const titleNode = screen.getByTestId('saved-pipeline-header-title');
    expect(titleNode).to.exist;
    expect(titleNode.textContent).to.equal('Saved Pipelines in airbnb.users');
  });

  it('renders an empty state', function () {
    renderSavedPipelines();
    const emptyStateNode = screen.getByTestId('saved-pipelines-empty-state');
    expect(emptyStateNode).to.exist;
    expect(emptyStateNode.textContent).to.equal('No saved pipelines found.');
  });

  describe('renders saved pipeline cards', function () {
    const savedPipelines = [
      {
        name: 'test name 0',
        id: 'test id 0',
      },
      {
        name: 'test name 1',
        id: 'test id 1',
      },
    ];
    let savedPipelineCards: HTMLElement[];

    beforeEach(function () {
      renderSavedPipelines({
        savedPipelines,
      });
      savedPipelineCards = screen.getAllByTestId('saved-pipeline-card');
      expect(savedPipelineCards).to.exist;
      expect(savedPipelineCards.length).to.equal(2);
    });

    it('does not render empty state', function () {
      expect(() => screen.getByTestId('saved-pipelines-empty-state')).to.throw;
    });

    it('renders the pipeline names', function () {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(savedPipelineCards[index]).getByTestId(
            'saved-pipeline-card-name'
          ).textContent
        ).to.equal(pipeline.name);
      });
    });

    it('renders open button', function () {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(savedPipelineCards[index]).getByTestId(
            'saved-pipeline-card-open-action'
          )
        ).to.exist;
      });
    });

    it('renders delete button', function () {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(savedPipelineCards[index]).getByTestId(
            'saved-pipeline-card-delete-action'
          )
        ).to.exist;
      });
    });

    it('renders open pipeline confirmation when openPipelineId is set', function () {
      renderSavedPipelines({
        savedPipelines,
        openPipelineId: 'test id 0',
      });
      expect(screen.getByTestId(openPipelineModalTestId)).to.exist;
    });

    it('renders delete pipeline confirmation when deletePipelineId is set', function () {
      renderSavedPipelines({
        savedPipelines,
        deletePipelineId: 'test id 0',
      });
      expect(screen.getByTestId(deletePipelineModalTestId)).to.exist;
    });
  });

  describe('when pipeline is opened', function () {
    let onCancelOpenPipelineSpy: Sinon.SinonSpy;
    let onConfirmOpenSpy: Sinon.SinonSpy;

    beforeEach(function () {
      onCancelOpenPipelineSpy = Sinon.spy();
      onConfirmOpenSpy = Sinon.spy();
      renderSavedPipelines({
        savedPipelines: [
          {
            name: 'test name 1',
            id: 'test id 1',
          },
        ],
        openPipelineId: 'test id 1',
        onCancelOpenPipeline: onCancelOpenPipelineSpy,
        onConfirmOpen: onConfirmOpenSpy,
      });
      expect(screen.getByTestId(openPipelineModalTestId)).to.exist;
    });

    it('calls onCancelOpenPipeline when cancel is clicked', function () {
      expect(onCancelOpenPipelineSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /cancel/i,
        })
      );
      expect(onCancelOpenPipelineSpy.calledOnce).to.be.true;
    });

    it('calls onConfirmOpen when open is clicked', function () {
      expect(onConfirmOpenSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /open pipeline/i,
        })
      );
      expect(onConfirmOpenSpy.calledOnce).to.be.true;
    });
  });

  describe('when pipeline is deleted', function () {
    let onCancelDeletePipelineSpy: Sinon.SinonSpy;
    let onConfirmDeleteSpy: Sinon.SinonSpy;

    beforeEach(function () {
      onCancelDeletePipelineSpy = Sinon.spy();
      onConfirmDeleteSpy = Sinon.spy();

      renderSavedPipelines({
        savedPipelines: [
          {
            name: 'test name 1',
            id: 'test id 1',
          },
        ],
        deletePipelineId: 'test id 1',
        onCancelDeletePipeline: onCancelDeletePipelineSpy,
        onConfirmDelete: onConfirmDeleteSpy,
      });
      // Open the pipeline delete modal
      expect(screen.getByTestId(deletePipelineModalTestId)).to.exist;
    });

    it('closes when cancel is clicked', function () {
      expect(onCancelDeletePipelineSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /cancel/i,
        })
      );
      expect(onCancelDeletePipelineSpy.calledOnce).to.be.true;
    });

    it('closes when delete pipeline is clicked and calls onDeletePipeline', function () {
      expect(onConfirmDeleteSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /delete pipeline/i,
        })
      );
      expect(onConfirmDeleteSpy.calledOnce).to.be.true;
    });
  });
});
