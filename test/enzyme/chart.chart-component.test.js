/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const mount = require('enzyme').mount;

const Chart = require('../../src/internal-packages/app/lib/components/chart');

// const debug = require('debug')('mongodb-compass:test:chart');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

const data = {
  values: [
    {'a': 'A', 'b': 20}, {'a': 'B', 'b': 34}, {'a': 'C', 'b': 55},
    {'a': 'D', 'b': 19}, {'a': 'E', 'b': 40}, {'a': 'F', 'b': 34},
    {'a': 'G', 'b': 91}, {'a': 'H', 'b': 78}, {'a': 'I', 'b': 25}
  ]
};

const liteSpec = {
  mark: 'bar',
  encoding: {
    x: {field: 'a', type: 'ordinal'},
    y: {field: 'b', type: 'quantitative'}
  }
};

describe('<Chart />', function() {
  context('when in vega-lite mode', function() {
    it('renders a chart with class name `chart`', function() {
      const component = mount(
        <Chart renderer="svg" data={data} specType="vega-lite" spec={liteSpec}
          width={300} height={300} />
      );
      expect(component).to.have.className('chart');
    });
  });
});
