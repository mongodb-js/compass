import React from 'react';
import chaiEnzyme from 'chai-enzyme';
import chai, { expect } from 'chai';
import { shallow } from 'enzyme';
import { Tooltip } from '../';

chai.use(chaiEnzyme());

describe('<Tooltip />', () => {
  const component = shallow(<Tooltip id="test" />);

  it('passes the id prop through to the react tooltip', () => {
    expect(component.getElement().props.id).to.equal('test');
  });

  it('passes the place prop through to the react tooltip', () => {
    expect(component.getElement().props.place).to.equal('right');
  });

  it('passes the effect prop through to the react tooltip', () => {
    expect(component.getElement().props.effect).to.equal('solid');
  });

  it('passes the className prop through to the react tooltip', () => {
    expect(component.getElement().props.className).to.equal('hadron-tooltip');
  });

  it('passes the delayShow prop through to the react tooltip', () => {
    expect(component.getElement().props.delayShow).to.equal(200);
  });
});
