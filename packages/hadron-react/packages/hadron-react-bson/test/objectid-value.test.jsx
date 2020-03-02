import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { ObjectId } from 'bson';
import { Value } from '../';

describe('<Value /> (rendering ObjectId)', () => {
  const value = ObjectId.createFromHexString('583711146b59b28fcfa66587');
  const component = shallow(<Value type="ObjectId" value={value} />);

  it('sets the base class', () => {
    expect(component.hasClass('element-value')).to.equal(true);
  });

  it('sets the type class', () => {
    expect(component.hasClass('element-value-is-objectid')).to.equal(true);
  });

  it('sets the title', () => {
    expect(component.props().title).to.equal('583711146b59b28fcfa66587');
  });

  it('sets the value', () => {
    expect(component.text()).to.equal('583711146b59b28fcfa66587');
  });
});
