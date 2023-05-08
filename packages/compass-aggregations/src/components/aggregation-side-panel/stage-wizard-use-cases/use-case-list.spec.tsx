import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sinon from 'sinon';
import { expect } from 'chai';
import UseCaseList from './use-case-list';
import { STAGE_WIZARD_USE_CASES } from '.';

describe('UseCaseList', function () {
  afterEach(cleanup);

  it('should render a list of provided usecases', function () {
    render(
      <UseCaseList useCases={STAGE_WIZARD_USE_CASES} onSelect={Sinon.spy()} />
    );
    STAGE_WIZARD_USE_CASES.forEach(({ id }) => {
      expect(screen.getByTestId(`use-case-${id}`)).to.not.throw;
    });
  });

  it('should call onSelect with the use case id when a usecase is selected', function () {
    const onSelectSpy = Sinon.spy();
    render(
      <UseCaseList useCases={STAGE_WIZARD_USE_CASES} onSelect={onSelectSpy} />
    );
    const { id } = STAGE_WIZARD_USE_CASES[1];
    userEvent.click(screen.getByTestId(`use-case-${id}`));
    expect(onSelectSpy).to.be.calledWithExactly(id);
  });
});
