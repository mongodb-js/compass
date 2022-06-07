import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import StageOperatorSelect from './stage-operator-select';
import styles from './stage-operator-select.module.less';

describe('StageOperatorSelect [Component]', function() {
  let component;
  const spy = sinon.spy();
  const setIsModifiedSpy = sinon.spy();

  beforeEach(function() {
    component = mount(
      <StageOperatorSelect
        env="on-prem"
        isTimeSeries={false}
        isReadonly={false}
        index={0}
        isEnabled
        isCommenting
        serverVersion="3.4.0"
        setIsModified={setIsModifiedSpy}
        stageOperatorSelected={spy} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['stage-operator-select']}`)).to.be.present();
  });
});
