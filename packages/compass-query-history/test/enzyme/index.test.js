/* eslint no-unused-expressions: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const mount = require('enzyme').mount;

const { StoreConnector } = require('hadron-react-components');
const ConnectedQueryHistoryComponent = require('../../lib/components');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<QueryHistoryComponent />', function() {
  let component;

  beforeEach(function() {
    component = mount(<ConnectedQueryHistoryComponent />);
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
