import React from 'react';
import { mount } from 'enzyme';
import ExplainStates from 'components/explain-states';
import styles from './explain-states.less';

describe('ExplainStates [Component]', () => {
  let component;
  const changeZeroStateSpy = sinon.spy();
  const setZeroStateChangedSpy = sinon.spy();
  const openLinkSpy = sinon.spy();
  const isZeroState = true;
  const isEditable = false;

  beforeEach(() => {
    component = mount(
      <ExplainStates
        changeZeroState={changeZeroStateSpy}
        zeroStateChanged={setZeroStateChangedSpy}
        isZeroState={isZeroState}
        isEditable={isEditable}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['explain-states']}`)).to.be.present();
  });

  it('renders the read only banner', () => {
    expect(component.find('StatusRow')).to.be.present();
  });
});
