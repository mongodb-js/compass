import React from 'react';
import { mount } from 'enzyme';
import IndexDefinitionType from 'components/index-definition-type';

import styles from './index-definition-type.less';

describe('IndexDefinitionType [Component]', () => {
  let component;
  const index = { fields: { serialize: () => {} } };

  beforeEach(() => {
    component = mount(<IndexDefinitionType index={index} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(
      component.find(`.${styles['index-definition-type']}`)
    ).to.be.present();
  });
});
