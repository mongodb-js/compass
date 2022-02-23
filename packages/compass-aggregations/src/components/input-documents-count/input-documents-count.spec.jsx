import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';

import InputDocumentsCount from '../input-documents-count';
import styles from './input-documents-count.module.less';

describe('InputDocumentsCount [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(
      <InputDocumentsCount count={20} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-documents-count']}`)).to.be.present();
  });

  it('renders the count', function() {
    expect(component.find(`.${styles['input-documents-count-label']}`)).to.have.text(
      '20 Documents in the Collection'
    );
  });
});
