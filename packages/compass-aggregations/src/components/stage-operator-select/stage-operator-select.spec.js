import React from 'react';
import { mount } from 'enzyme';

import StageOperatorSelect from 'components/stage-operator-select';
import styles from './stage-operator-select.less';

describe('StageOperatorSelect [Component]', () => {
  let component;
  const spy = sinon.spy();
  const setIsModifiedSpy = sinon.spy();
  const stage = {
    stage: '{ name: "testing" }',
    stageOperator: '$match',
    isValid: true,
    isEnabled: true,
    isExpanded: true,
    id: 1
  };

  beforeEach(() => {
    component = mount(
      <StageOperatorSelect
        stage={stage}
        index={0}
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
