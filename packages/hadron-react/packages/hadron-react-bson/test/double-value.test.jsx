import React from 'react';
import { Double } from 'bson';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { DoubleValue } from '../';

describe('<DoubleValue />', () => {
  describe('with a driver value', function() {
    const value = new Double(123.45);
    const component = shallow(<DoubleValue type="Double" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-double')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('123.45');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('123.45');
    });
  });

  describe('with a primative value', function() {
    const value = 123.45;
    const component = shallow(<DoubleValue type="Double" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-double')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('123.45');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('123.45');
    });
  });
});
