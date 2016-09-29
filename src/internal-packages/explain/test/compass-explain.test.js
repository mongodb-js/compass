/* eslint no-unused-expressions: 0 */
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const React = require('react');

const shallow = require('enzyme').shallow;

const CompassExplain = require('../lib/components/compass-explain');
const ExplainHeader = require('../lib/components/explain-header');
const ExplainBody = require('../lib/components/explain-header');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<CompassExplain />', function() {
  let component;

  beforeEach(function() {
    component = shallow(<CompassExplain />);
  });

  it('should contain one <ExplainHeader />', function() {
    expect(component.find(ExplainHeader)).to.have.length(1);
  });
  it('should contain one <ExplainBody />', function() {
    expect(component.find(ExplainBody)).to.have.length(1);
  });
});
