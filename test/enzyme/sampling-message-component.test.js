/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const {shallow} = require('enzyme');
const AppRegistry = require('hadron-app-registry');

chai.use(chaiEnzyme());

describe('<SamplingMessage />', () => {
  const appRegistry = app.appRegistry;
  const appInstance = app.instance;

  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    app.appRegistry.registerAction('CRUD.Actions', sinon.spy());
    app.appRegistry.registerStore('CRUD.ResetDocumentListStore', sinon.spy());

    this.SamplingMessage = require('../../src/internal-packages/query/lib/component/sampling-message');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.instance = appInstance;
  });

  context('when collection is not writable', () => {
    beforeEach(() => {
      this.component = shallow(<this.SamplingMessage isWritable={false} insertHandler={() => {}} />);
    });

    it('disables the INSERT DOCUMENT button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs.open-insert');
      expect(state).to.be.disabled();
    });
  });

  context('when collection is writable', () => {
    beforeEach(() => {
      this.component = shallow(<this.SamplingMessage isWritable={true} insertHandler={() => {}} />);
    });

    it('disables the INSERT DOCUMENT button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs.open-insert');
      expect(state).to.not.be.disabled();
    });
  });
});
