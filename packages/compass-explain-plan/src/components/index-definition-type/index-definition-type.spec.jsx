import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import IndexDefinitionType from '../index-definition-type';
import styles from './index-definition-type.module.less';

describe('IndexDefinitionType [Component]', function() {
  let component;
  const index = { fields: { serialize: () => {} } };

  beforeEach(function() {
    component = mount(<IndexDefinitionType index={index} />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the correct root classname', function() {
    expect(
      component.find(`.${styles['index-definition-type']}`)
    ).to.be.present();
  });
});
