/* eslint no-unused-expressions: 0 */
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const React = require('react');

const shallow = require('enzyme').shallow;

const { StoreConnector } = require('hadron-react-components');
const ConnectedCompassExplain = require('../lib/components');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<ConnectedCompassExplain />', function() {
  let component;

  beforeEach(function() {
    component = shallow(<ConnectedCompassExplain />);
  });

  it('should contain a <StoreConnector /> with a store prop', function() {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
