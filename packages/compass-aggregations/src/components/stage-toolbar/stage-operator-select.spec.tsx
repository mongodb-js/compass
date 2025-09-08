import React from 'react';
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

describe('StageOperatorSelect', () => {
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
    props: Partial<React.ComponentProps<typeof StageOperatorSelect>> = {}
  ) => {
    return render(<StageOperatorSelect {...defaultMockProps} {...props} />);
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
});
