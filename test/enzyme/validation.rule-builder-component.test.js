/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const {mount, shallow} = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { OptionSelector } = require('hadron-react-components');

chai.use(chaiEnzyme());

describe('<RuleBuilder />', () => {
  const appRegistry = app.appRegistry;
  const appInstance = app.instance;

  const template = {
    editState: 'unmodified',
    validationAction: 'warn',
    validationLevel: 'moderate',
    validationRules: [],
    serverVersion: '3.4.0',
    validate: function() {}
  };

  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();

    this.RuleBuilder = require('../../src/internal-packages/validation/lib/components/rule-builder');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.instance = appInstance;
  });

  context('when collection is not writable', () => {
    beforeEach(() => {
      const props = Object.assign({isWritable: false}, template);
      this.component = mount(<this.RuleBuilder {... props} />);
    });

    it('disables the ADD RULE button', () => {
      const state = this.component.find('.btn.btn-xs.btn-primary');
      expect(state).to.be.disabled();
    });

    it('shows tooltip indicating why button is disabled', () => {
      expect(this.component.find('.tooltip-button-wrapper'))
        .to.have.data('tip', 'This action is not available on a secondary node');
    });
  });

  context('when collection is writable', () => {
    beforeEach(() => {
      const props = Object.assign({isWritable: true}, template);
      this.component = mount(<this.RuleBuilder {... props} />);
    });

    it('disables the ADD RULE button', () => {
      const state = this.component.find('.btn.btn-xs.btn-primary');
      expect(state).to.not.be.disabled();
    });
  });
});
