import React from 'react';
import { shallow } from 'enzyme';

import DocumentPreview from 'components/document-preview';
import styles from './document-preview.less';

describe('DocumentPreview [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<DocumentPreview document={{}} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['document-preview']}`)).to.be.present();
  });
});
