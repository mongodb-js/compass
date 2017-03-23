/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const mount = require('enzyme').mount;

const AppRegistry = require('hadron-app-registry');
const ResetButton = require('../../src/internal-packages/chart/lib/components/reset-button');

// const debug = require('debug')('mongodb-compass:test:chart');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<ResetButton />', function() {
  context('when pressing the "Reset Chart" button', function() {
    const clearChartAction = sinon.spy();

    it('clears the chart', function() {
      const component = mount(
        <ResetButton action={clearChartAction} />
      );
      expect(component).to.have.className('chart-builder-reset-button');
      component.simulate('click');
      expect(clearChartAction.callCount).to.be.equal(1);
    });
  });
});
