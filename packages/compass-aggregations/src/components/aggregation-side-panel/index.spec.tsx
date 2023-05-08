import React from 'react';
import type { ComponentProps } from 'react';
import { AggregationSidePanel } from './index';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import configureStore from '../../../test/configure-store';
import { Provider } from 'react-redux';
import sinon from 'sinon';
import { STAGE_WIZARD_USE_CASES } from './stage-wizard-use-cases';

const renderAggregationSidePanel = (
  props: Partial<ComponentProps<typeof AggregationSidePanel>> = {}
) => {
  return render(
    <Provider store={configureStore()}>
      <AggregationSidePanel
        onSelectUseCase={() => {}}
        onCloseSidePanel={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('aggregation side panel', function () {
  afterEach(cleanup);

  describe('header', function () {
    it('renders title', function () {
      renderAggregationSidePanel();
      expect(screen.getByText('Stage Wizard')).to.exist;
    });

    it('renders close button', function () {
      renderAggregationSidePanel();
      expect(screen.getByLabelText('Hide Side Panel')).to.exist;
    });

    it('calls onCloseSidePanel when close button is clicked', function () {
      const onCloseSidePanel = sinon.spy();
      renderAggregationSidePanel({ onCloseSidePanel });
      screen.getByLabelText('Hide Side Panel').click();
      expect(onCloseSidePanel).to.have.been.calledOnce;
    });
  });

  it('renders a search input', function () {
    renderAggregationSidePanel();
    expect(screen.getByRole('search')).to.not.throw;
  });

  it('renders all the usecases', function () {
    renderAggregationSidePanel();
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(STAGE_WIZARD_USE_CASES.length);
  });

  it('renders usecases filtered by search text matching the title of the usecases', function () {
    renderAggregationSidePanel();
    const searchBox = screen.getByPlaceholderText(/How can we help\?/i);
    userEvent.type(searchBox, 'Sort');
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(1);
    expect(screen.getByTestId('use-case-sort')).to.not.throw;
  });

  it('renders usecases filtered by search text matching the stage operator of the usecases', function () {
    renderAggregationSidePanel();
    const searchBox = screen.getByPlaceholderText(/How can we help\?/i);
    userEvent.type(searchBox, 'lookup');
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(1);
    expect(screen.getByTestId('use-case-lookup')).to.not.throw;
  });

  it('calls onSelectUseCase when a use case is clicked', function () {
    const onSelectUseCase = sinon.spy();
    renderAggregationSidePanel({ onSelectUseCase });
    screen.getByTestId('use-case-sort').click();
    expect(onSelectUseCase).to.have.been.calledOnceWith('sort', '$sort');
  });
});
