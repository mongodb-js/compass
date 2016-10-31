/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const _ = require('lodash');

const shallow = require('enzyme').shallow;
const bootstrap = require('react-bootstrap');
const ControlLabel = bootstrap.ControlLabel;
const FormControl = bootstrap.FormControl;
const RangeInput = require('../src/internal-packages/validation/lib/components/common/range-input');
const RuleCategoryRange = require('../src/internal-packages/validation/lib/components/rule-categories/range');

chai.use(chaiEnzyme());

describe('<RangeInput />', () => {
  context('when rendering the default control', () => {
    it('has label `LOWER BOUND`', () => {
      const component = shallow(<RangeInput value={5} />);
      const labelText = component.find(ControlLabel).dive().text();
      expect(labelText).to.be.equal('LOWER BOUND');
    });
    it('has placeholder text of `enter lower bound`', () => {
      const component = shallow(<RangeInput value={5} />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('enter lower bound');
    });
  });

  context('when rendering an upperBound control', () => {
    it('has label `UPPER BOUND`', () => {
      const component = shallow(<RangeInput upperBound value={5} />);
      const labelText = component.find(ControlLabel).dive().text();
      expect(labelText).to.be.equal('UPPER BOUND');
    });
    it('has placeholder text of `enter upper bound`', () => {
      const component = shallow(<RangeInput upperBound value={5} />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('enter upper bound');
    });
  });
});

describe('<RuleCategoryRange />', function() {
  let component;
  const propsTemplate = {
    id: 'my-new-rule',
    field: 'created_at',
    category: 'range',
    parameters: {
      lowerBoundValue: -5,
      upperBoundValue: 5
    },
    nullable: false
  };

  it('has two child <RangeInput /> components', function() {
    const props = _.assign(propsTemplate, {});
    component = shallow(<RuleCategoryRange {...props} />);
    const ranges = component.dive().find(RangeInput);
    expect(ranges).to.have.length(2);
  });
});
