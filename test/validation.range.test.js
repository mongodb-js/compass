/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const _ = require('lodash');

const shallow = require('enzyme').shallow;
const mount = require('enzyme').mount;
const bootstrap = require('react-bootstrap');
const ControlLabel = bootstrap.ControlLabel;
const FormControl = bootstrap.FormControl;
const RangeInput = require('../src/internal-packages/validation/lib/components/common/range-input');
const RuleCategoryRange = require('../src/internal-packages/validation/lib/components/rule-categories/range');

const debug = require('debug')('mongodb-compass:test:validation');

chai.use(chaiEnzyme());

describe('<RangeInput />', () => {
  context('when rendering the default control', () => {
    it('has placeholder text of `lower bound`', () => {
      const component = shallow(<RangeInput />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('lower bound');
    });
    it('accepts a scientific decimal -9.001e+2', function() {
      const value = '-9.0001e+2';
      const component = shallow(<RangeInput value={value}/>);
      const props = component.find(FormControl).dive().props();
      expect(props.value).to.equal(value);
    });
    // https://github.com/mongodb/mongo/blob/eb9810a/jstests/decimal/decimal128_test1.js
    it('accepts tiniest Decimal128 9.999999999999999999999999999999999E-6143', function() {
      const tiniest = '9.999999999999999999999999999999999E-6143';
      const component = shallow(<RangeInput value={tiniest}/>);
      const props = component.find(FormControl).dive().props();
      expect(props.value).to.equal(tiniest);
    });
    it('accepts largest Decimal128 9.999999999999999999999999999999999E+6144', function() {
      const largest = '9.999999999999999999999999999999999E+6144';
      const component = shallow(<RangeInput value={largest}/>);
      const props = component.find(FormControl).dive().props();
      expect(props.value).to.equal(largest);
    });
  });

  context('when rendering an upperBound control', () => {
    it('has placeholder text of `upper bound`', () => {
      const component = shallow(<RangeInput upperBound />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('upper bound');
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
      lowerBoundValue: '-5',
      upperBoundValue: '5'
    },
    nullable: false,
    serverVersion: '3.4.0',
    isWritable: true,
    validate: function() {}
  };

  it('has two child <RangeInput /> components', function() {
    const props = _.assign(propsTemplate, {});
    component = shallow(<RuleCategoryRange {...props} />);
    const ranges = component.dive().find(RangeInput);
    expect(ranges).to.have.length(2);
  });

  it('accepts empty range 5 < x < 5 initially', function() {
    const props = _.assign(propsTemplate, {
      parameters: {
        lowerBoundType: '$gt',
        lowerBoundValue: '5',
        upperBoundType: '$lt',
        upperBoundValue: '5'
      }
    });
    component = shallow(<RuleCategoryRange {...props} />);
    const ranges = component.dive().find(RangeInput);
    expect(ranges).to.have.length(2);
    ranges.forEach(range => {
      expect(range.props().validationState).to.be.null;
    });
  });

  it('rejects empty range 5 < x < 3 after calling validate()', function() {
    const props = _.assign(propsTemplate, {
      parameters: {
        lowerBoundType: '$gt',
        lowerBoundValue: '5',
        upperBoundType: '$lt',
        upperBoundValue: '3'
      }
    });
    component = mount(<RuleCategoryRange {...props} />);
    const result = component.instance().validate();
    expect(result).to.be.false;
  });

  it('rejects empty both range values being "none" after calling validate()', function() {
    const props = _.assign(propsTemplate, {
      parameters: {
        lowerBoundType: null,
        lowerBoundValue: '5',
        upperBoundType: null,
        upperBoundValue: '3'
      }
    });
    component = mount(<RuleCategoryRange {...props} />);
    const result = component.instance().validate();
    expect(result).to.be.false;
  });
});
