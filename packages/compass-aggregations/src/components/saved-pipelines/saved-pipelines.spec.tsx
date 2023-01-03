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
      editor_view_type='stage'
      onDeletePipeline={() => {}}
      onOpenPipeline={() => {}}
      {...props}
    />
  );
};

describe('SavedPipelines', function() {
  it('renders the title and namespace text', function() {
    renderSavedPipelines({
      namespace: 'airbnb.users'
    });
    const titleNode = screen.getByTestId('saved-pipeline-header-title');
    expect(titleNode).to.exist;
    expect(titleNode.textContent).to.equal('Saved Pipelines in airbnb.users');
  });

  it('renders an empty state', function() {
    renderSavedPipelines();
    const emptyStateNode = screen.getByTestId('saved-pipelines-empty-state');
    expect(emptyStateNode).to.exist;
    expect(emptyStateNode.textContent).to.equal('No saved pipelines found.');
  });

  describe('renders saved pipeline cards', function() {
    
    const savedPipelines = [
      {
        name: 'test name 0',
        id: 'test id 0'
      },
      {
        name: 'test name 1',
        id: 'test id 1'
      }
    ];
    let savedPipelineCards: HTMLElement[];

    beforeEach(function() {
      renderSavedPipelines({
        savedPipelines,
      });
      savedPipelineCards = screen.getAllByTestId('saved-pipeline-card');
      expect(savedPipelineCards).to.exist;
      expect(savedPipelineCards.length).to.equal(2);
    });

    it('does not render empty state', function() {
      expect(() => screen.getByTestId('saved-pipelines-empty-state')).to.throw;
    });

    it('renders the pipeline names', function() {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(
            savedPipelineCards[index]
          )
          .getByTestId('saved-pipeline-card-name')
          .textContent
        ).to.equal(pipeline.name);
      });
    });

    it('renders open button', function() {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(
            savedPipelineCards[index]
          )
          .getByTestId('saved-pipeline-card-open-action')
        ).to.exist;
      });
    });

    it('renders delete button', function() {
      savedPipelines.forEach((pipeline, index) => {
        expect(
          within(
            savedPipelineCards[index]
          )
          .getByTestId('saved-pipeline-card-delete-action')
        ).to.exist;
      });
    });
  });

  describe('when pipeline is opened', function() {

    const openPipelineModalTestId = "restore-pipeline-modal";
    let onOpenPipelineSpy: Sinon.SinonSpy;

    beforeEach(function() {
      onOpenPipelineSpy = Sinon.spy();
      renderSavedPipelines({
        savedPipelines: [
          {
            name: 'test name 1',
            id: 'test id 1'
          }
        ],
        onOpenPipeline: onOpenPipelineSpy,
      });
      // Open the pipeline open modal
      userEvent.click(screen.getByTestId('saved-pipeline-card-open-action'));
      expect(screen.getByTestId(openPipelineModalTestId)).to.exist;
    });

    it('closes when cancel is clicked', function() {
      userEvent.click(
        screen.getByRole('button', {
          name: /cancel/i
        })
      );
      expect(onOpenPipelineSpy.calledOnce).to.be.false;
      expect(() => {
        screen.getByTestId(openPipelineModalTestId)
      }).to.throw;
    });

    it('closes when open pipeline is clicked and calls onOpenPipeline', function() {
      expect(onOpenPipelineSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /open pipeline/i
        })
      );
      expect(onOpenPipelineSpy.calledOnce).to.be.true;
      expect(() => {
        screen.getByTestId(openPipelineModalTestId)
      }).to.throw;
    });
  });

  describe('when pipeline is deleted', function() {

    const deletePipelineModalTestId = "delete-pipeline-modal";
    let onDeletePipelineSpy: Sinon.SinonSpy;

    beforeEach(function() {
      onDeletePipelineSpy = Sinon.spy();
      renderSavedPipelines({
        savedPipelines: [
          {
            name: 'test name 1',
            id: 'test id 1'
          }
        ],
        onDeletePipeline: onDeletePipelineSpy,
      });
      // Open the pipeline delete modal
      userEvent.click(screen.getByTestId('saved-pipeline-card-delete-action'));
      expect(screen.getByTestId(deletePipelineModalTestId)).to.exist;
    });

    it('closes when cancel is clicked', function() {
      userEvent.click(
        screen.getByRole('button', {
          name: /cancel/i
        })
      );
      expect(onDeletePipelineSpy.calledOnce).to.be.false;
      expect(() => {
        screen.getByTestId(deletePipelineModalTestId)
      }).to.throw;
    });

    it('closes when delete pipeline is clicked and calls onDeletePipeline', function() {
      expect(onDeletePipelineSpy.calledOnce).to.be.false;
      userEvent.click(
        screen.getByRole('button', {
          name: /delete pipeline/i
        })
      );
      expect(onDeletePipelineSpy.calledOnce).to.be.true;
      expect(() => {
        screen.getByTestId(deletePipelineModalTestId)
      }).to.throw;
    });
  });
});
