const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const FavoriteComponent = require('../../src/components/favorite-component');

chai.use(chaiEnzyme());

describe('<FavoriteComponent />', () => {
  describe('#render', () => {
    const date = new Date();
    const favorite = {
      serialize: () => {
        return {
          _name: 'testing',
          _dateSaved: date,
          filter: { name: 'test' }
        };
      }
    };
    const component = shallow(<FavoriteComponent model={favorite} />);

    it('renders the wrapper div', () => {
      const node = component.find('.query-history-favorite-query');
      expect(node).to.have.length(1);
    });

    it('filters out _ prefixed attributes from the query component', () => {
      const node = component.find('.query-history-favorite-query');
      const queryAttributes = node.children().nodes[1];
      expect(queryAttributes.hasOwnProperty('_name')).to.equal(false);
      expect(queryAttributes.hasOwnProperty('_dateSaved')).to.equal(false);
    });
  });
});
