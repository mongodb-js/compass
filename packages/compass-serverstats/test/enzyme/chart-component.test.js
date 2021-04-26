/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const d3 = require('d3');
const React = require('react');
const { mount } = require('enzyme');
const ChartComponent = require('../../src/components/chart-component');
const OpCountersStore = require('../../src/stores/opcounters-store');

chai.use(chaiEnzyme());

describe('<ChartComponent />', () => {
  context('when rendering the chart component', () => {
    let component = null;

    beforeEach(() => {
      const dispatcher = d3.dispatch('mouseover');
      component = mount(
        <ChartComponent
          store={OpCountersStore}
          dispatcher={dispatcher}
        />
      );
    });

    it('checks redraw() of the component', () => {
      component.setState({data: {localTime: [], xLength: 1}});
      expect(component).to.exist;
    });
  });
});
