import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sinon from 'sinon';
import { SavedPipelines } from './saved-pipelines';
import type { StoredPipeline } from '../../utils/pipeline-storage';

const savedPipelines = [
  {
    name: 'test name 0',
    id: 'test id 0',
  },
  {
    name: 'test name 1',
    id: 'test id 1',
  },
] as StoredPipeline[];

const renderSavedPipelines = (
  props: Partial<ComponentProps<typeof SavedPipelines>> = {}
) => {
  render(
    <SavedPipelines
      savedPipelines={[]}
      namespace="test.test123"
      onDeletePipeline={() => {}}
      onOpenPipeline={() => {}}
      onMount={() => {}}
      {...props}
    />
  );
};

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
  });

  describe('calls card actions', function () {
    it('calls onOpenPipeline when open button is clicked', function () {
      const onOpenPipelineSpy = Sinon.spy();
      renderSavedPipelines({
        savedPipelines,
        onOpenPipeline: onOpenPipelineSpy,
      });
      const savedPipelineCard = screen.getAllByTestId('saved-pipeline-card')[0];
      userEvent.click(
        within(savedPipelineCard).getByTestId('saved-pipeline-card-open-action')
      );
      expect(onOpenPipelineSpy).to.be.calledOnceWith(savedPipelines[0]);
    });
    it('calls onDeletePipeline when delete button is clicked', function () {
      const onDeletePipelineSpy = Sinon.spy();
      renderSavedPipelines({
        savedPipelines,
        onDeletePipeline: onDeletePipelineSpy,
      });
      const savedPipelineCard = screen.getAllByTestId('saved-pipeline-card')[1];
      userEvent.click(
        within(savedPipelineCard).getByTestId(
          'saved-pipeline-card-delete-action'
        )
      );
      expect(onDeletePipelineSpy.calledOnce).to.be.true;
      expect(onDeletePipelineSpy.calledWith(savedPipelines[1].id)).to.be.true;
    });
  });
});
