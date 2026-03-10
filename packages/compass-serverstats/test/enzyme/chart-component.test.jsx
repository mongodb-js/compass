import React from 'react';
import { expect } from 'chai';
import d3 from 'd3';
import { render, screen } from '@mongodb-js/testing-library-compass';
import ChartComponent from '../../src/components/chart-component';
import OpCountersStore from '../../src/stores/opcounters-store';

describe('<ChartComponent />', function () {
  context('when rendering the chart component', function () {
    it('renders the chart container', function () {
      const dispatcher = d3.dispatch('mouseover');
      render(
        <ChartComponent store={OpCountersStore} dispatcher={dispatcher} />
      );
      expect(screen.getByTestId('chart-component')).to.exist;
    });
  });
});
