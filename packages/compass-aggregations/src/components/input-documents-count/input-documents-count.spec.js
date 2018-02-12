import React from 'react';
import { shallow } from 'enzyme';

import InputDocumentsCount from 'components/input-documents-count';
import styles from './input-documents-count.less';

describe('InputDocumentsCount [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <InputDocumentsCount count={20} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-documents-count']}`)).to.be.present();
  });

  it('renders the count', () => {
    expect(component.find(`.${styles['input-documents-count-label']}`)).to.have.text(
      '20 Input Documents'
    );
  });
});
