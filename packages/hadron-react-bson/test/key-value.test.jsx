import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { MaxKey, MinKey } from 'bson';
import { KeyValue } from '../';

describe('<KeyValue />', () => {
  context('when the value is a MaxKey', () => {
    const value = new MaxKey();
    const component = shallow(<KeyValue type="MaxKey" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-maxkey')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('MaxKey()');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('MaxKey()');
    });
  });

  context('when the value is a MinKey', () => {
    const value = new MinKey();
    const component = shallow(<KeyValue type="MinKey" value={value} />);

    it('sets the base class', () => {
      expect(component.hasClass('element-value')).to.equal(true);
    });

    it('sets the type class', () => {
      expect(component.hasClass('element-value-is-minkey')).to.equal(true);
    });

    it('sets the title', () => {
      expect(component.props().title).to.equal('MinKey()');
    });

    it('sets the value', () => {
      expect(component.text()).to.equal('MinKey()');
    });
  });
});
