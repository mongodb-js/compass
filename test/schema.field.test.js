/* eslint no-unused-expressions: 0 */
/* eslint no-unused-vars: 0 */
const app = require('ampersand-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const AppRegistry = require('hadron-app-registry');

const shallow = require('enzyme').shallow;
const mount = require('enzyme').mount;

chai.use(chaiEnzyme());

describe('<Schema />', () => {
  let component;

  const fieldProp = {
    count: 2,
    has_duplicates: true,
    name: 'foo',
    path: 'foo',
    probability: 0.4,
    type: ['Undefined', 'String'],
    types: [
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
    ]
  };

  let appRegistry = app.appRegistry;
  before(function() {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    // register QueryStore
    require('../src/internal-packages/query').activate();
  });
  after(function() {
    // unregister QueryStore
    require('../src/internal-packages/query').deactivate();
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
  });

  context('when adding fields to the schema view', () => {
    it('renders type on the left', () => {
      const Type = require('../src/internal-packages/schema/lib/component/type');

      component = shallow(<Type {...fieldProp.types[0]} />);
      expect(component.find('.schema-field-type-string')).to.have.data('tip', 'String (40%)');
    });

    it('renders fields on the left', () => {
      const Field = require('../src/internal-packages/schema/lib/component/field');
      const Type = require('../src/internal-packages/schema/lib/component/type');

      const type = shallow(<Type {...fieldProp.types[0]} />);
      component = mount(<Field {...fieldProp} />);
      expect(component.find(Type)).to.have.length(2);
    });
  });
});
