const React = require('react');
const chai = require('chai');
const expect = chai.expect;
const chaiEnzyme = require('chai-enzyme');
const { shallow } = require('enzyme');
const CodeComponent = require('../../src/components/code-component');

chai.use(chaiEnzyme());

describe('<CodeComponent />', () => {
  describe('#render', () => {
    const code = '{ name: \'test\'\n}';
    const component = shallow(<CodeComponent language="js" code={code} />);

    it('renders the attribute value as a js string', () => {
      const node = component.find('.js');
      expect(node).to.have.text(code);
    });
  });
});
