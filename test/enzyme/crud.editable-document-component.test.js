/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const { mount } = require('enzyme');
const AppRegistry = require('hadron-app-registry');

const EditableDocument = require('../../src/internal-packages/crud/lib/component/editable-document');
const EditableElement = require('../../src/internal-packages/crud/lib/component/editable-element');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<EditableDocument />', function() {
  let appRegistry = app.appRegistry;
  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
  });
  afterEach(() => {
    // Restore properties on the global app, so they don't affect other tests
    app.appRegistry = appRegistry;
  });

  const doc = {a: {b: {c: {d: 1}}}};
  it('if expandAll is true, renders children', () => {
    const component = mount(<EditableDocument doc={doc} expandAll={true} />);
    const children = component.find(EditableElement);
    expect(children).to.be.of.length(4);
  });
  it('COMPASS-1306, if expandAll is false, does not render children', () => {
    const component = mount(<EditableDocument doc={doc} expandAll={false} />);
    const children = component.find(EditableElement);
    expect(children).to.be.of.length(1);
  });
});
