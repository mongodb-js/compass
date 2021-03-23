import React from 'react';
import { mount } from 'enzyme';

import StageOperatorSelect from './stage-operator-select';
import styles from './stage-operator-select.less';

describe('StageOperatorSelect [Component]', () => {
  let component;
  const spy = sinon.spy();
  const setIsModifiedSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <StageOperatorSelect
        index={0}
        isEnabled
        allowWrites
        isCommenting
        serverVersion="3.4.0"
        setIsModified={setIsModifiedSpy}
        stageOperatorSelected={spy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-operator-select']}`)).to.be.present();
  });
});
