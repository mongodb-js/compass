import React from 'react';
import type { ComponentProps } from 'react';
import { AggregationSidePanel } from './index';
import {
  cleanup,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { DndContext } from '@dnd-kit/core';
import { expect } from 'chai';
import { renderWithStore } from '../../../test/configure-store';
import sinon from 'sinon';
import { STAGE_WIZARD_USE_CASES } from './stage-wizard-use-cases';

const renderAggregationSidePanel = (
  props: Partial<ComponentProps<typeof AggregationSidePanel>> = {}
) => {
  return renderWithStore(
    <DndContext>
      <AggregationSidePanel
        onSelectUseCase={() => {}}
        onCloseSidePanel={() => {}}
        {...props}
      />
    </DndContext>
  );
};

describe('aggregation side panel', function () {
  afterEach(cleanup);

  describe('header', function () {
    it('renders title', async function () {
      await renderAggregationSidePanel();
      expect(screen.getByText('Stage Wizard')).to.exist;
    });

    it('renders close button', async function () {
      await renderAggregationSidePanel();
      expect(screen.getByLabelText('Hide Stage Wizard')).to.exist;
    });

    it('calls onCloseSidePanel when close button is clicked', async function () {
      const onCloseSidePanel = sinon.spy();
      await renderAggregationSidePanel({ onCloseSidePanel });
      screen.getByLabelText('Hide Stage Wizard').click();
      expect(onCloseSidePanel).to.have.been.calledOnce;
    });
  });

  it('renders a search input', async function () {
    await renderAggregationSidePanel();
    expect(() => {
      screen.getByRole('search');
    }).to.not.throw();
  });

  it('renders all the usecases', async function () {
    await renderAggregationSidePanel();
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(STAGE_WIZARD_USE_CASES.length);
  });

  it('renders usecases filtered by search text matching the title of the usecases', async function () {
    await renderAggregationSidePanel();
    const searchBox = screen.getByPlaceholderText(/Search for a Stage/i);
    userEvent.type(searchBox, 'Sort');
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(1);
    expect(() => {
      screen.getByTestId('use-case-sort');
    }).to.not.throw();
  });

  it('renders usecases filtered by search text matching the stage operator of the usecases', async function () {
    await renderAggregationSidePanel();
    const searchBox = screen.getByPlaceholderText(/Search for a Stage/i);
    userEvent.type(searchBox, 'lookup');
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(1);
    expect(() => {
      screen.getByTestId('use-case-lookup');
    }).to.not.throw();

    userEvent.clear(searchBox);
    userEvent.type(searchBox, '$lookup');
    expect(
      screen
        .getByTestId('side-panel-content')
        .querySelectorAll('[data-testid^="use-case-"]')
    ).to.have.lengthOf(1);
    expect(() => {
      screen.getByTestId('use-case-lookup');
    }).to.not.throw();
  });

  it('calls onSelectUseCase when a use case is clicked', async function () {
    const onSelectUseCase = sinon.spy();
    await renderAggregationSidePanel({ onSelectUseCase });
    screen.getByTestId('use-case-sort').click();
    expect(onSelectUseCase).to.have.been.calledOnceWith('sort', '$sort');
  });
});
