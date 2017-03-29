/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const shallow = require('enzyme').shallow;
const AppRegistry = require('hadron-app-registry');
const { TabNavBar } = require('hadron-react-components');
const Collection = require('../../src/internal-packages/collection/lib/components/index');

// const debug = require('debug')('compass:collection:test');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<Collection />', function() {
  let appRegistry = app.appRegistry;
  let appInstance = app.instance;
  beforeEach(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();

    app.appRegistry.registerComponent('Schema.Schema', sinon.spy());
    app.appRegistry.registerComponent('CRUD.DocumentList', sinon.spy());
    app.appRegistry.registerComponent('Indexes.Indexes', sinon.spy());
    app.appRegistry.registerComponent('Explain.ExplainPlan', sinon.spy());
    app.appRegistry.registerComponent('Validation.Validation', sinon.spy());
    app.appRegistry.registerComponent('Chart.ChartBuilder', sinon.spy());

    // Fixes Warning: React.createElement:
    // type should not be null, undefined, boolean, or number.
    // It should be a string (for DOM elements)
    // or a ReactClass (for composite components).
    app.appRegistry.registerComponent('CollectionStats.CollectionStats', sinon.spy());

    app.isFeatureEnabled = function() { return true; };
  });
  afterEach(function() {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.instance = appInstance;
  });

  it('does not have validation tab with server version 3.0.6', function() {
    app.instance = {build: {version: '3.0.6'}};
    const component = shallow(<Collection namespace={'foo.bar'} />);
    const tabs = component.find(TabNavBar).dive().find('.tab-nav-bar-tab');
    expect(tabs.find('#VALIDATION')).to.not.exist;
  });
  it('has validation tab when serverVersion >= 3.2.0', function() {
    app.instance = {build: {version: '3.2.0'}};
    const component = shallow(<Collection namespace={'foo.bar'} />);
    const tabs = component.find(TabNavBar).dive().find('.tab-nav-bar-tab');
    expect(tabs.find('#VALIDATION')).to.exist;
  });
});
