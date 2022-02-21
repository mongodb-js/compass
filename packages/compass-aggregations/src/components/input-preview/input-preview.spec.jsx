import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import InputPreview from '../input-preview';
import styles from './input-preview.module.less';

describe('InputPreview [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(<InputPreview documents={[]} isLoading={false} />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-preview']}`)).to.be.present();
  });
});
