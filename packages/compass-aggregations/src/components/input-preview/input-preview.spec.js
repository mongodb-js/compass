import React from 'react';
import { shallow } from 'enzyme';

import InputPreview from '../input-preview';
import styles from './input-preview.module.less';

describe('InputPreview [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<InputPreview documents={[]} isLoading={false} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-preview']}`)).to.be.present();
  });
});
