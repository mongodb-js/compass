import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import Sinon from 'sinon';
import * as stageSlice from '../../utils/stage';
import { StageOperatorSelect } from './stage-operator-select';

describe('StageOperatorSelect', () => {
  const mockStages = [
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
    onChange: () => {},
    selectedStage: null,
    isDisabled: false,
    stages: mockStages,
    serverVersion: '8.1.0',
    isReadonlyView: false,
    collectionStats: {
      pipeline: [{ $addFields: { field: 'value' } }],
    },
  };
  let filterStageOperatorsStub;
  beforeEach(() => {
    filterStageOperatorsStub = Sinon.stub(
      stageSlice,
      'filterStageOperators'
    ).returns(mockStages);
  });

  afterEach(() => {
    filterStageOperatorsStub.restore();
  });

  const renderCombobox = (props) => render(<StageOperatorSelect {...props} />);

  it('renders the correct descriptions if not in readonly view', () => {
    const mockProps = {
      ...defaultMockProps,
      isReadonlyView: false,
    };

    renderCombobox(mockProps);
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(within(listbox).getByText('Atlas only. searchStage description.')).to
      .exist;
  });

  it('renders the correct descriptions if in readonly view with non queryable pipeline', () => {
    const mockProps = {
      ...defaultMockProps,
      isReadonlyView: true,
      collectionStats: {
        pipeline: [
          { $addFields: { field: 'value' } },
          { project: { newField: 1 } },
        ],
      },
    };

    renderCombobox(mockProps);
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox'); // Target the dropdown

    expect(within(listbox).getByText('basicStage description.')).to.exist;
    expect(within(listbox).getByText('Atlas only. atlasOnlyStage description.'))
      .to.exist;
    expect(
      within(listbox).getByText(
        'Atlas only. Only views containing $addFields, $set or $match stages with the $expr operator are compatible with search indexes. searchStage description.'
      )
    ).to.exist;
  });

  it('renders the correct descriptions for $search stage in readonly view with incompatible version', () => {
    const mockProps = {
      ...defaultMockProps,
      serverVersion: '7.0.0',
      isReadonlyView: true,
    };

    renderCombobox(mockProps);
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
