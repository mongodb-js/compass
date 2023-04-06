import React from 'react';
import type { ComponentProps } from 'react';
import { AggregationSidePanel } from './index';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from '../../../test/configure-store';
import { Provider } from 'react-redux';
import sinon from 'sinon';

const renderAggregationSidePanel = (
  props: Partial<ComponentProps<typeof AggregationSidePanel>> = {}
) => {
  return render(
    <Provider store={configureStore()}>
      <AggregationSidePanel onCloseSidePanel={() => {}} {...props} />
    </Provider>
  );
};

describe('aggregation side panel', function () {
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
});
