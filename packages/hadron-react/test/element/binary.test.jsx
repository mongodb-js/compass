const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Binary } = require('bson');
const { ElementBinaryValue } = require('../../');

describe('<ElementBinaryValue />', () => {
  context('when the type is an old uuid', () => {
    const binary = new Binary('testing', 3);
    const component = shallow(<ElementBinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('Binary(\'testing\')');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('Binary(\'testing\')');
    });
  });

  context('when the type is a new uuid', () => {
    const binary = new Binary('testing', 4);
    const component = shallow(<ElementBinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('Binary(\'testing\')');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('Binary(\'testing\')');
    });
  });

  context('when the type is not a uuid', () => {
    const binary = new Binary('testing', 2);
    const component = shallow(<ElementBinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('Binary(\'dGVzdGluZw==\')');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('Binary(\'dGVzdGluZw==\')');
    });
  });
});
