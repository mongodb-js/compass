/* eslint no-unused-vars: 0 */
const app = require('hadron-app');
const AppRegistry = require('hadron-app-registry');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const { OptionSelector } = require('hadron-react-components');

const mount = require('enzyme').mount;
const shallow = require('enzyme').shallow;
const _ = require('lodash');

// const debug = require('debug')('compass:validation:test');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

let component;
const ruleTemplate = {
  id: 'my-new-rule',
  field: 'created_at',
  category: 'type',
  parameters: {type: 9},  // type "date"
  nullable: false,
  serverVersion: '3.4.0',
  isWritable: true,
  validate: function() {}
};

const rangeRuleTemplate = {
  id: 'my-new-rule',
  field: 'created_at',
  category: 'range',
  parameters: {type: 9},  // type "date"
  nullable: false,
  serverVersion: '3.2.11',
  isWritable: true
};

describe('<Rule />', function() {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.Rule = require('../../src/internal-packages/validation/lib/components/rule');
    this.RuleCategoryRange = require('../../src/internal-packages/validation/lib/components/rule-categories/range');
    this.RuleCategorySelector = require('../../src/internal-packages/validation/lib/components/rule-category-selector');
  });
  it('has an input field with value "created_at"', function() {
    const rule = _.assign(ruleTemplate, {});
    component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
    expect(component.find('input#my-new-rule')).to.have.value('created_at');
  });

  context('when nullable prop is false', function() {
    beforeEach(function() {
      const rule = _.assign(ruleTemplate, {nullable: false});
      component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
    });
    // nullable checkbox should be off
    it('has the "Nullable" checkbox unchecked', function() {
      expect(component.find('input.nullable')).to.be.not.checked();
    });

    it.skip('changes the nullable prop to `true` when clicking the checkbox', function(done) {
      component.find('input.nullable').simulate('click');
      // the action has to go through the store, therefore we have to wait
      // until the call stack has cleared before testing the checkbox again.
      _.defer(function() {
        expect(component.find('input.nullable')).to.be.checked();
        done();
      });
    });

    context('when category is "exists"', function() {
      it('the checkbox "Nullable" is disabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'exists'});
        component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.be.disabled();
      });
    });

    context('when category is "mustNotExist"', function() {
      it('the checkbox "Nullable" is disabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'mustNotExist'});
        component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.be.disabled();
      });
    });

    context('when category is "regex"', function() {
      it('the checkbox "Nullable" is enabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'regex'});
        component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.not.be.disabled();
      });
    });
  });

  context('when nullable prop is true', function() {
    beforeEach(function() {
      const rule = _.assign(ruleTemplate, {nullable: true});
      component = mount(<table><tbody><this.Rule {...rule} /></tbody></table>);
    });
    // nullable checkbox should be off
    it('has the "Nullable" checkbox checked', function() {
      expect(component.find('input.nullable')).to.be.checked();
    });
  });

  context('when category "range" is supplied', function() {
    it('has a category of "range"', function() {
      const rule = _.assign(rangeRuleTemplate, {});
      component = shallow(<table><tbody><this.Rule {...rule} /></tbody></table>);
      const ruleCategory = component.find(this.Rule).dive().find(this.RuleCategorySelector);
      expect(ruleCategory.props().category).to.be.equal('range');
    });

    it('has a <RuleCategoryRange /> component with id my-new-rule', function() {
      const rule = _.assign(rangeRuleTemplate, {});
      component = shallow(<table><tbody><this.Rule {...rule} /></tbody></table>);
      const ruleCategory = component.find(this.Rule).dive().find(this.RuleCategoryRange);
      expect(ruleCategory.props().id).to.be.equal('my-new-rule');
    });
  });
});
