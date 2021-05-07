import React from 'react';
import { mount } from 'enzyme';

import Collation from 'components/collation';
import styles from './collation.less';

describe('Collation [Component]', () => {
  let component;
  let changeCollationOptionSpy;

  beforeEach(() => {
    changeCollationOptionSpy = sinon.spy();
    component = mount(
      <Collation collation={{}} changeCollationOption={changeCollationOptionSpy} />
    );
  });

  afterEach(() => {
    changeCollationOptionSpy = null;
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.collation}`)).to.be.present();
  });

  it('renders the field wrappers', () => {
    expect(component.find(`.${styles['collation-field']}`)).to.have.length(9);
  });

  it('renders the labels', () => {
    expect(component.find(`.${styles['collation-label']}`)).to.have.length(9);
  });
});
