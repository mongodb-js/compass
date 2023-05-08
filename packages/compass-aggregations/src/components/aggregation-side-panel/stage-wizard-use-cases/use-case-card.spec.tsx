import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sinon from 'sinon';
import { expect } from 'chai';
import UseCaseCard from './use-case-card';
import { STAGE_WIZARD_USE_CASES } from '.';

describe('UseCaseCard', function () {
  afterEach(cleanup);

  it('should render a card for provided usecase', function () {
    const useCase = STAGE_WIZARD_USE_CASES[0];
    render(
      <UseCaseCard
        id={useCase.id}
        title={useCase.title}
        stageOperator={useCase.stageOperator}
        onSelect={Sinon.spy()}
      />
    );
    expect(screen.getByTestId(`use-case-${useCase.id}`)).to.not.throw;
  });

  it('should call onSelect when a usecase is selected', function () {
    const onSelectSpy = Sinon.spy();
    const useCase = STAGE_WIZARD_USE_CASES[0];
    render(
      <UseCaseCard
        id={useCase.id}
        title={useCase.title}
        stageOperator={useCase.stageOperator}
        onSelect={onSelectSpy}
      />
    );
    userEvent.click(screen.getByTestId(`use-case-${useCase.id}`));
    expect(onSelectSpy).to.be.called;
  });
});
