const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const RecentComponent = require('../../src/components/recent-component');

chai.use(chaiEnzyme());

describe('<RecentComponent />', () => {
  describe('#render', () => {
    const date = new Date();
    const recent = {
      _lastExecuted: date,
      serialize: () => {
        return {
          _lastExecuted: date,
          filter: { name: 'test' }
        };
      }
    };
    const component = shallow(<RecentComponent model={recent} />);

    it('renders the wrapper div', () => {
      const node = component.find('.query-history-recent-query');
      expect(node).to.have.length(1);
    });

    it('filters out _ prefixed attributes from the query component', () => {
      const node = component.find('.query-history-recent-query');
      const queryAttributes = node.children().nodes[1];
      expect(queryAttributes.hasOwnProperty('_lastExecuted')).to.equal(false);
    });
  });
});
