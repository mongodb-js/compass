import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { StageOperatorSelect } from './stage-operator-select';
import Sinon from 'sinon';

const stages = [
  {name: '$stage1', description: 'stage1 description', env: []},
  {name: '$stage2', description: 'stage2 description', env: ['atlas']}
];

describe('StageOperatorSelect', function () {
  let onChangeSpy;
  beforeEach(function () {
    onChangeSpy = Sinon.spy();
    render(<StageOperatorSelect index={0} stages={stages} onChange={onChangeSpy} />);
  });

  afterEach(cleanup);

  it('should render a combobox', function () {
    expect(screen.getByTestId('stage-operator-combobox')).to.exist;
  });
});
