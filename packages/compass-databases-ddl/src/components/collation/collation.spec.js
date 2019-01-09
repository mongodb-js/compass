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
});
