const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const QueryComponent = require('../../src/components/query-component');

chai.use(chaiEnzyme());

describe('<QueryComponent />', () => {
  describe('#render', () => {
    const title = 'Testing';
    const attributes = { filter: { name: 'test' }};
    const component = shallow(<QueryComponent title={title} attributes={attributes} />);

    it('renders the wrapper div', () => {
      const node = component.find('.query-history-card');
      expect(node).to.have.length(1);
    });

    it('renders the title', () => {
      const node = component.find('.query-history-card-title');
      expect(node).to.have.text(title);
    });

    it('renders the attribute label', () => {
      const node = component.find('.query-history-card-label');
      expect(node).to.have.text('filter');
    });

    it('renders the attribute value as a js string', () => {
      const node = component.find('.query-history-card p');
      expect(node).to.have.text('{ name: \'test\'\n}');
    });
  });
});
