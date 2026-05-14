import React from 'react';
import type { RenderConnectionsOptions } from '@mongodb-js/testing-library-compass';
import {
  fireEvent,
  render,
  screen,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import type { Stage } from './stage-operator-select';
import { StageOperatorSelect } from './stage-operator-select';
import Sinon from 'sinon';

describe('StageOperatorSelect', function () {
  const mockStages: Stage[] = [
    {
      name: 'basicStage',
      env: ['on-prem'],
      description: 'basicStage description.',
    },
    {
      name: 'atlasOnlyStage',
      env: ['atlas'],
      description: 'atlasOnlyStage description.',
    },
    {
      name: '$search',
      env: ['atlas'],
      description: 'searchStage description.',
    },
  ];

  const defaultMockProps = {
    index: 0,
    onChange: Sinon.stub(),
    selectedStage: null,
    isDisabled: false,
    stages: mockStages,
    serverVersion: '8.1.0',
    sourceName: 'sourceName',
    collectionStats: {
      pipeline: [{ $addFields: { field: 'value' } }],
    },
  };

  const renderCombobox = (
    props: Partial<React.ComponentProps<typeof StageOperatorSelect>> = {},
    renderOptions: Partial<RenderConnectionsOptions> = {}
  ) => {
    return render(
      <StageOperatorSelect {...defaultMockProps} {...props} />,
      renderOptions
    );
  };

  const rerankStage: Stage = {
    name: '$rerank',
    env: ['atlas'],
    description: '$rerank description.',
  };

  it('renders the correct descriptions if not in readonly view', () => {
    renderCombobox({ sourceName: null });
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(within(listbox).getByText('Atlas only. searchStage description.')).to
      .exist;
  });

  it('renders the correct descriptions if in readonly view with non queryable pipeline', () => {
    renderCombobox({
      collectionStats: {
        pipeline: [
          { $addFields: { field: 'value' } },
          { project: { newField: 1 } },
        ],
      },
    });
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(
      within(listbox).getByText(
        'Atlas only. Only views containing $match stages with the $expr operator, $addFields, or $set are compatible with search indexes. searchStage description.'
      )
    ).to.exist;
  });

  it('renders the correct descriptions for $search stage in readonly view with 8.0 version', () => {
    renderCombobox({ serverVersion: '8.0.0' });
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(
      within(listbox).getByText(
        'Atlas only. Requires MongoDB 8.1+ to run on a view. To use a search index on a view on MongoDB 8.0, query the view’s source collection sourceName. searchStage description.'
      )
    ).to.exist;
  });

  it('renders the correct descriptions for $search stage in readonly view with incompatible version', () => {
    renderCombobox({ serverVersion: '7.0.0' });
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(
      within(listbox).getByText(
        'Atlas only. Requires MongoDB 8.1+ to run on a view. searchStage description.'
      )
    ).to.exist;
  });

  context('$rerank stage', function () {
    it('does not show $rerank when enableRerank is false', function () {
      renderCombobox(
        { stages: [...mockStages, rerankStage] },
        { preferences: { enableRerank: false } }
      );
      fireEvent.click(screen.getByRole('combobox'));
      const listbox = screen.getByRole('listbox');
      expect(
        within(listbox).queryByTestId('combobox-option-stage-$rerank')
      ).to.not.exist;
    });

    it('shows $rerank when enableRerank is true', function () {
      renderCombobox(
        { stages: [...mockStages, rerankStage] },
        { preferences: { enableRerank: true } }
      );
      fireEvent.click(screen.getByRole('combobox'));
      const listbox = screen.getByRole('listbox');
      expect(
        within(listbox).getByTestId('combobox-option-stage-$rerank')
      ).to.exist;
    });

    it('sorts $rerank to the top when enableRerank is true', function () {
      renderCombobox(
        { stages: [...mockStages, rerankStage] },
        { preferences: { enableRerank: true } }
      );
      fireEvent.click(screen.getByRole('combobox'));
      const options = screen
        .getByRole('listbox')
        .querySelectorAll('[role="option"]');
      expect(options[0].getAttribute('data-testid')).to.equal(
        'combobox-option-stage-$rerank'
      );
    });

    it('shows Preview and Start Free badges for $rerank', function () {
      renderCombobox(
        { stages: [...mockStages, rerankStage] },
        { preferences: { enableRerank: true } }
      );
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByText('Preview')).to.exist;
      expect(screen.getByText('Start Free')).to.exist;
    });
  });
});
