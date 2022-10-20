import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { StageOperatorSelect } from './stage-operator-select';
import styles from './stage-operator-select.module.less';

describe('StageOperatorSelect [Component]', function() {
  let component;
  const spy = sinon.spy();

  beforeEach(function() {
    component = mount(
      <StageOperatorSelect
        index={0}
        onChange={spy} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['stage-operator-select']}`)).to.be.present();
  });
});
