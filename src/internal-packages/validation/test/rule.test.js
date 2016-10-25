/* eslint no-unused-expressions: 0 */
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');

const mount = require('enzyme').mount;
const Rule = require('../lib/components/rule');
const _ = require('lodash');

// const debug = require('debug')('compass:validation:test');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<Rule />', function() {
  let component;
  const ruleTemplate = {
    id: 'my-new-rule',
    field: 'created_at',
    category: 'type',
    parameters: {type: 9},  // type "date"
    nullable: false
  };

  it('has an input field with value "created_at"', function() {
    const rule = _.assign(ruleTemplate, {});
    component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
    expect(component.find('input#my-new-rule')).to.have.value('created_at');
  });

  context('when nullable prop is false', function() {
    beforeEach(function() {
      const rule = _.assign(ruleTemplate, {nullable: false});
      component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
    });
    // nullable checkbox should be off
    it('has the "Nullable" checkbox unchecked', function() {
      expect(component.find('input.nullable')).to.be.not.checked();
    });

    it('changes the nullable prop to `true` when clicking the checkbox', function() {
      component.find('input.nullable').simulate('click');
      // the action has to go through the store, therefore we have to wait
      // until the call stack has cleared before testing the checkbox again.
      _.defer(function() {
        expect(component.find('input.nullable')).to.be.checked();
      });
    });

    context('when category is "exists"', function() {
      it('the checkbox "Nullable" is disabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'exists'});
        component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.be.disabled();
      });
    });

    context('when category is "mustNotExist"', function() {
      it('the checkbox "Nullable" is disabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'mustNotExist'});
        component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.be.disabled();
      });
    });

    context('when category is "regex"', function() {
      it('the checkbox "Nullable" is enabled.', function() {
        const rule = _.assign(ruleTemplate, {category: 'regex'});
        component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
        expect(component.find('input.nullable')).to.not.be.disabled();
      });
    });
  });

  context('when nullable prop is true', function() {
    beforeEach(function() {
      const rule = _.assign(ruleTemplate, {nullable: true});
      component = mount(<table><tbody><Rule {...rule} /></tbody></table>);
    });
    // nullable checkbox should be off
    it('has the "Nullable" checkbox checked', function() {
      expect(component.find('input.nullable')).to.be.checked();
    });
  });
});
