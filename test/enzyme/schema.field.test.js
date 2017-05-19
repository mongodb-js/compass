/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const AppRegistry = require('hadron-app-registry');
const Field = require('../../src/internal-packages/schema/lib/component/field');
const Type = require('../../src/internal-packages/schema/lib/component/type');

const mount = require('enzyme').mount;

chai.use(chaiEnzyme());

describe('<Schema />', () => {
  let component;

  const fieldProp = {
    count: 2,
    has_duplicates: true,
    name: 'foo',
    path: 'foo',
    probability: 0.4
  };

  const typesWithUndefined = [
    {
      count: 2,
      has_duplicates: true,
      name: 'String',
      path: 'foo',
      probability: 0.4,
      total_count: 0,
      unique: 1,
      values: ['bar', 'bar']
    },
    {
      count: 3,
      has_duplicates: true,
      name: 'Undefined',
      path: 'foo',
      probability: 0.6,
      total_count: 0,
      type: 'Undefined'
    }
  ];

  const typesWithMultiple = [
    {
      count: 2,
      has_duplicates: true,
      name: 'Long',
      path: 'foo',
      probability: 0.2,
      total_count: 0,
      unique: 1,
      values: [4, 2]
    },
    {
      count: 3,
      has_duplicates: true,
      name: 'String',
      path: 'foo',
      probability: 0.3,
      total_count: 0,
      unique: 1,
      values: ['bar', 'bar', 'foo']
    },
    {
      count: 5,
      has_duplicates: true,
      name: 'Undefined',
      path: 'foo',
      probability: 0.5,
      total_count: 0,
      type: 'Undefined'
    }
  ];

  let appRegistry = app.appRegistry;
  before(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    // register QueryStore
    require('../../src/internal-packages/query').activate(app.appRegistry);
  });
  after(function() {
    // unregister QueryStore
    require('../../src/internal-packages/query').deactivate();
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
  });

  context('when adding fields to the schema view', () => {
    it('renders field types', () => {
      fieldProp.types = typesWithUndefined;
      component = mount(<Field {...fieldProp} />);
      expect(component.find(Type)).to.have.length(2);
    });

    it('renders the first type as string', () => {
      fieldProp.types = typesWithUndefined;
      component = mount(<Field {...fieldProp} />);
      expect(component.find(Type).at(0)).to.have.data('tip', 'String (40%)');
      expect(component.find('.schema-field-type-string')).to.have.className('active');
    });

    it('renders the second type as undefined', () => {
      fieldProp.types = typesWithUndefined;
      component = mount(<Field {...fieldProp} />);
      expect(component.find(Type).at(1)).to.have.data('tip', 'Undefined (60%)');
      expect(component.find('.schema-field-type-undefined')).to.not.have.className('active');
    });

    context('when rendering multiple fields', () => {
      it('renders type with highest probability first', () => {
        fieldProp.types = typesWithMultiple;
        component = mount(<Field {...fieldProp} />);
        expect(component.find(Type).at(0)).to.have.data('tip', 'String (30%)');
        expect(component.find('.schema-field-type-string')).to.have.className('active');
        expect(component.find(Type).at(1)).to.have.data('tip', 'Long (20%)');
        expect(component.find('.schema-field-type-long')).to.not.have.className('active');
        expect(component.find(Type).at(2)).to.have.data('tip', 'Undefined (50%)');
        expect(component.find('.schema-field-type-undefined')).to.not.have.className('active');
      });
    });
  });
});
