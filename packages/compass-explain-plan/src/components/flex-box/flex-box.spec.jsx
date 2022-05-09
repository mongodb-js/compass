import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import FlexBox from '../flex-box';

describe('FlexBox [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(<FlexBox />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find({ style: { display: 'flex' } })).to.be.present();
  });
});
