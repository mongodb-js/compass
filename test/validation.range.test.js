// @todo: Not sure how to move this test into a sub-directory and
// @todo: ... have it run via `npm run test-unit` or `npm run ci`
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
// https://github.com/babel/babel-eslint/issues/6
const React = require('react');  // eslint-disable-line no-unused-vars
// const _ = require('lodash');

const shallow = require('enzyme').shallow;
const bootstrap = require('react-bootstrap');
const ControlLabel = bootstrap.ControlLabel;
const FormControl = bootstrap.FormControl;
// const Rule = require('../src/internal-packages/validation/lib/components/rule');
// const RuleCategorySelector = require('../src/internal-packages/validation/lib/components/rule-category-selector');
const RangeInput = require('../src/internal-packages/validation/lib/components/common/range-input');  // eslint-disable-line no-unused-vars

// const debug = require('debug')('compass:validation:test');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());


describe('<RangeInput />', () => {
  context('when rendering the default control', () => {
    it('has label `LOWER BOUND`', () => {
      const component = shallow(<RangeInput />);
      // console.log(component.debug());
      const labelText = component.find(ControlLabel).dive().text();
      expect(labelText).to.be.equal('LOWER BOUND');
    });
    it('has placeholder text of `enter lower bound`', () => {
      const component = shallow(<RangeInput />);
      const placeholderText = component.find(FormControl).props().placeholder;
      expect(placeholderText).to.be.equal('enter lower bound');
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


// @todo: Might be useful for COMPASS-156
// describe('<Rule />', function() {
//   let component;
//   const ruleTemplate = {
//     id: 'my-new-rule',
//     field: 'created_at',
//     category: 'range',
//     parameters: {type: 9},  // type "date"
//     nullable: false
//   };
//
//   it('has a category of "range" if category "range" is supplied', function() {
//     const rule = _.assign(ruleTemplate, {});
//     component = shallow(<table><tbody><Rule {...rule} /></tbody></table>);
//     const ruleCategory = component.find(Rule).dive().find(RuleCategorySelector);
//     expect(ruleCategory.props().category).to.be.equal("range");
//   });
//
//   it('has a lower bound rendered')
// });
