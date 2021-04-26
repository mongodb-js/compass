import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { Value } from '../';

describe('<Value /> (rendering Boolean)', () => {
  context('when the value is true', () => {
    const component = shallow(<Value type="Boolean" value={true} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-boolean')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('true');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('true');
    });
  });

  context('when the value is false', () => {
    const component = shallow(<Value type="Boolean" value={false} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-boolean')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('false');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('false');
    });
  });
});
