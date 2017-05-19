/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const AppRegistry = require('hadron-app-registry');
const bson = require('bson');

const shallow = require('enzyme').shallow;
const mount = require('enzyme').mount;

// const debug = require('debug')('mongodb-compass:test:minicharts');

chai.use(chaiEnzyme());

describe('<Minichart />', () => {
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
  context('when using non-unique data of type `Long`', () => {
    const schemaType = {
      count: 3,
      has_duplicates: true,
      name: 'Long',
      path: 'test_duplicate_longs',
      probability: 1,
      unique: 2,
      values: [
        bson.Long.fromString('1'),
        bson.Long.fromString('2'),
        bson.Long.fromString('1')
      ]
    };

    it('renders a D3Component minichart', () => {
      const Minichart = require('../../src/internal-packages/schema/lib/component/minichart');
      const D3Component = require('../../src/internal-packages/schema/lib/component/d3component');

      const wrapper = shallow(
        <Minichart
          fieldName="test_duplicate_longs"
          type={schemaType}
        />).setState({containerWidth: 600});
      expect(wrapper.find(D3Component)).to.have.length(1);
    });
  });
  context('when using unique data of type `Long`', () => {
    const schemaType = {
      count: 3,
      has_duplicates: false,
      name: 'Long',
      path: 'test_unique_longs',
      probability: 1,
      unique: 3,
      values: [
        bson.Long.fromString('1'),
        bson.Long.fromString('2'),
        bson.Long.fromString('3')
      ]
    };

    it('renders a unique minichart', () => {
      const Minichart = require('../../src/internal-packages/schema/lib/component/minichart');
      const UniqueMinichart = require('../../src/internal-packages/schema/lib/component/unique');

      const wrapper = shallow(
        <Minichart
          fieldName="test_unique_longs"
          type={schemaType}
        />).setState({containerWidth: 600});
      expect(wrapper.find(UniqueMinichart)).to.have.length(1);
    });

    it('has a unique bubble for each datum', () => {
      const Minichart = require('../../src/internal-packages/schema/lib/component/minichart');
      const wrapper = mount(
        <Minichart
          fieldName="test_unique_longs"
          type={schemaType}
        />).setState({containerWidth: 600});

      expect(wrapper).to.have.descendants('.minichart.unique');
      expect(wrapper).to.have.exactly(3).descendants('li.bubble');
    });
  });
});
