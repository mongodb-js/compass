import React from 'react';
import { Decimal128 } from 'bson';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Value } from '../';

describe('<Value /> (rendering Decimal128)', () => {
  context('when the decimal is a number', () => {
    const value = Decimal128.fromString('19992.12321');
    const component = shallow(<Value type="Decimal128" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-decimal128')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('19992.12321');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('19992.12321');
    });
  });

  context('when the decimal is a valid string', () => {
    const value = Decimal128.fromString('Infinity');
    const component = shallow(<Value type="Decimal128" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-decimal128')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('Infinity');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('Infinity');
    });
  });
});
