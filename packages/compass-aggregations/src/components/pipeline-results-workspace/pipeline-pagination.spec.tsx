import React from 'react';
import { screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import { renderWithStore } from '../../../test/configure-store';

import {
  PipelinePagination,
  calculateShowingFrom,
  calculateShowingTo,
} from './pipeline-pagination';

const renderPipelinePagination = (props: Record<string, unknown> = {}) => {
  return renderWithStore(
    <PipelinePagination
      showingFrom={1}
      showingTo={20}
      isCountDisabled={false}
      isPrevDisabled={false}
      isNextDisabled={false}
      onPrev={() => {}}
      onNext={() => {}}
      {...props}
    />
  );
};

describe('PipelinePagination', function () {
  describe('PipelinePagination Component', function () {
    it('renders correctly', async function () {
      await renderPipelinePagination();
      const container = screen.getByTestId('pipeline-pagination');
      expect(
        within(container).getByTestId('pipeline-pagination-desc').textContent
      ).to.equal('Showing 1 – 20');
      expect(within(container).getByTestId('pipeline-pagination-count')).to
        .exist;
      expect(within(container).getByTestId('pipeline-pagination-prev-action'))
        .to.exist;
      expect(within(container).getByTestId('pipeline-pagination-next-action'))
        .to.exist;
    });
    it('does not render desc when disabled', async function () {
      await renderPipelinePagination({ isCountDisabled: true });
      const container = screen.getByTestId('pipeline-pagination');
      expect(() => {
        within(container).getByTestId('pipeline-pagination-desc');
      }).to.throw;
    });
    it('renders paginate buttons as disabled when disabled', async function () {
      await renderPipelinePagination({
        isPrevDisabled: true,
        isNextDisabled: true,
      });
      const container = screen.getByTestId('pipeline-pagination');
      expect(
        within(container)
          .getByTestId('pipeline-pagination-prev-action')
          .getAttribute('aria-disabled')
      ).to.equal('true');
      expect(
        within(container)
          .getByTestId('pipeline-pagination-next-action')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });
    it('calls onPrev when clicked', async function () {
      const onPrev = spy();
      await renderPipelinePagination({ onPrev });
      const container = screen.getByTestId('pipeline-pagination');
      userEvent.click(
        within(container).getByTestId('pipeline-pagination-prev-action')
      );
      expect(onPrev.calledOnce).to.be.true;
    });
    it('calls onNext when clicked', async function () {
      const onNext = spy();
      await renderPipelinePagination({ onNext });
      const container = screen.getByTestId('pipeline-pagination');
      userEvent.click(
        within(container).getByTestId('pipeline-pagination-next-action')
      );
      expect(onNext.calledOnce).to.be.true;
    });
  });

  describe('PipelinePagination utils', function () {
    it('calculates correct showingFrom', function () {
      expect(
        calculateShowingFrom({
          limit: 20,
          page: 1,
        }),
        'calculateShowingFrom(20, 1)'
      ).to.equal(1);

      expect(
        calculateShowingFrom({
          limit: 20,
          page: 2,
        }),
        'calculateShowingFrom(20, 2)'
      ).to.equal(21);
    });
    it('calculates correct showingTo', function () {
      expect(
        calculateShowingTo({
          documentCount: 20,
          limit: 20,
          page: 1,
        }),
        'calculateShowingTo(20, 20, 1)'
      ).to.equal(20);

      expect(
        calculateShowingTo({
          documentCount: 20,
          limit: 20,
          page: 3,
        }),
        'calculateShowingTo(20, 20, 3)'
      ).to.equal(60);

      expect(
        calculateShowingTo({
          documentCount: 10,
          limit: 20,
          page: 3,
        }),
        'calculateShowingTo(20, 20, 3)'
      ).to.equal(50);
    });
  });
});
