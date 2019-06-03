const React = require('react');
const { expect } = require('chai');
const { shallow } = require('enzyme');
const { Binary } = require('bson');
const { BinaryValue } = require('../');

const TESTING_BASE64 = Buffer.from('testing').toString('base64');

describe('<BinaryValue />', () => {
  context('when the type is an old uuid', () => {
    const binary = new Binary('testing', 3);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal(`Binary('${TESTING_BASE64}')`);
    });

    it('sets the value', () => {
      expect(component.text()).to.equal(`Binary('${TESTING_BASE64}')`);
    });
  });

  context('when the type is a new uuid', () => {
    const binary = new Binary('testing', 4);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal(`Binary('${TESTING_BASE64}')`);
    });

    it('sets the value', () => {
      expect(component.text()).to.equal(`Binary('${TESTING_BASE64}')`);
    });
  });

  context('when the type is a GUID', () => {
    const buffer = Buffer.from('WBAc3FDBDU+Zh/cBQFPc3Q==', 'base64');
    const binary = new Binary(buffer, 4);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('title is base64 encoded', () => {
      expect(component.props().title).to.equal('Binary(\'WBAc3FDBDU+Zh/cBQFPc3Q==\')');
    });

    it('value is base64 encoded', () => {
      expect(component.text()).to.equal('Binary(\'WBAc3FDBDU+Zh/cBQFPc3Q==\')');
    });
  });

  context('when the type is not a uuid', () => {
    const binary = new Binary('testing', 2);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

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

  context('when the type is FLE', () => {
    const binary = new Binary('testing', 6);
    const component = shallow(<BinaryValue type="Binary" value={binary} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-binary')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('This field is encrypted');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('*********');
    });
  });
});
