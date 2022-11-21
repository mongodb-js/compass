import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import IndexDefinitionType from '../index-definition-type';

describe('IndexDefinitionType [Component]', function () {
  let component;
  const index = { fields: { serialize: () => {} } };

  beforeEach(function () {
    component = mount(<IndexDefinitionType index={index} />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find('IndexDefinitionType')).to.be.present();
  });
});
