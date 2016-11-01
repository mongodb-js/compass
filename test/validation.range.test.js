/* eslint no-unused-expressions: 0 */
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
      const component = shallow(<RangeInput />);
      const labelText = component.find(ControlLabel).dive().text();
      expect(labelText).to.be.equal('LOWER BOUND');
    });
    it('has placeholder text of `enter lower bound`', () => {
      const component = shallow(<RangeInput />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('enter lower bound');
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
    it('has label `UPPER BOUND`', () => {
      const component = shallow(<RangeInput upperBound />);
      const labelText = component.find(ControlLabel).dive().text();
      expect(labelText).to.be.equal('UPPER BOUND');
    });
    it('has placeholder text of `enter upper bound`', () => {
      const component = shallow(<RangeInput upperBound />);
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
      lowerBoundValue: '-5',
      upperBoundValue: '5'
    },
    nullable: false
  };

  it('has two child <RangeInput /> components', function() {
    const props = _.assign(propsTemplate, {});
    component = shallow(<RuleCategoryRange {...props} />);
    const ranges = component.dive().find(RangeInput);
    expect(ranges).to.have.length(2);
  });

  it('accepts empty range 5 < x < 5 with getComboValidationState error', function() {
    const props = _.assign(propsTemplate, {
      parameters: {
        comboValidationState: 'error',
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
      expect(range.props().validationState).to.be.equal('error');
    });
  });

  context('for some different numeric types', function() {
    const someInt32 = '32';
    const someLong = '9007199254740991'; // 2^53-1, higher nums => Decimal128
    const someDouble = '0.1';
    const someDecimal128 = '9.999999999999999999999999999999999E+6144';

    context('when server version is 3.2.10', function() {
      const serverVersion = '3.2.10';
      it('accepts Int32', function() {
        const result = RuleCategoryRange.typeCastNumeric(someInt32, serverVersion);
        expect(result._bsontype).to.be.equal('Int32');
      });
      it('accepts Long', function() {
        const result = RuleCategoryRange.typeCastNumeric(someLong, serverVersion);
        expect(result._bsontype).to.be.equal('Long');
      });
      it('accepts Double', function() {
        const result = RuleCategoryRange.typeCastNumeric(someDouble, serverVersion);
        expect(result._bsontype).to.be.equal('Double');
      });
      it('rejects Decimal128', function() {
        const result = RuleCategoryRange.typeCastNumeric(someDecimal128, serverVersion);
        expect(result._bsontype).to.be.undefined;
      });
    });
    context('when server version is 3.4.0', function() {
      const serverVersion = '3.4.0';
      it('accepts Int32', function() {
        const result = RuleCategoryRange.typeCastNumeric(someInt32, serverVersion);
        expect(result._bsontype).to.be.equal('Int32');
      });
      it('accepts Long', function() {
        const result = RuleCategoryRange.typeCastNumeric(someLong, serverVersion);
        expect(result._bsontype).to.be.equal('Long');
      });
      it('accepts Double', function() {
        const result = RuleCategoryRange.typeCastNumeric(someDouble, serverVersion);
        expect(result._bsontype).to.be.equal('Double');
      });
      it('accepts Decimal128', function() {
        const result = RuleCategoryRange.typeCastNumeric(someDecimal128, serverVersion);
        expect(result._bsontype).to.be.equal('Decimal128');
      });
    });
  });
});
