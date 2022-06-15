import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import DocumentPreview from '../document-preview';
import styles from './document-preview.module.less';

describe('DocumentPreview [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(<DocumentPreview document={{}} />);
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['document-preview']}`)).to.be.present();
  });
});
