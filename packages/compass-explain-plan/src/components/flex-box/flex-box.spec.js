import React from 'react';
import { mount } from 'enzyme';
import FlexBox from 'components/flex-box';

describe('FlexBox [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<FlexBox />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find({ style: { display: 'flex' } })).to.be.present();
  });
});
