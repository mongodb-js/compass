import React from 'react';
import { expect } from 'chai';
import d3 from 'd3';
import { render } from '@mongodb-js/testing-library-compass';
import ChartComponent from '../../src/components/chart-component';
import OpCountersStore from '../../src/stores/opcounters-store';

describe('<ChartComponent />', function () {
  context('when rendering the chart component', function () {
    it('renders the chart container', function () {
      const dispatcher = d3.dispatch('mouseover');
      const { container } = render(
        <ChartComponent store={OpCountersStore} dispatcher={dispatcher} />
      );
      // The component renders a div with class "chart"
      expect(container.querySelector('.chart')).to.exist;
    });

    it('renders without data', function () {
      const dispatcher = d3.dispatch('mouseover');
      const { container } = render(
        <ChartComponent store={OpCountersStore} dispatcher={dispatcher} />
      );
      // Component should render even with empty data
      expect(container.querySelector('.chart > div')).to.exist;
    });
  });
});
