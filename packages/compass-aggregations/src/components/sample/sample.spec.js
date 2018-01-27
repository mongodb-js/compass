import React from 'react';
import { mount } from 'enzyme';

import Sample from 'components/sample';
import styles from './sample.less';

describe('Sample [Component]', () => {
  let component;
  const changedSpy = sinon.spy();
  const toggledSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <Sample
        isEnabled={false}
        value={500}
        sampleChanged={changedSpy}
        sampleToggled={toggledSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles.sample}`)).to.be.present();
  });

  it('renders the label', () => {
    expect(component.find(`.${styles['sample-label']}`)).to.have.text('Sample');
  });

  it('renders the switch', () => {
    expect(component.find(`.${styles['sample-toggle']} input`)).to.be.present();
  });

  it('renders the input', () => {
    expect(component.find(`.${styles['sample-value']}`)).to.have.value('500');
  });

  context('when toggling the switch', () => {
    it('toggles the switch', () => {
      component.find(`.${styles['sample-toggle']}`).simulate('click');
      expect(toggledSpy.callCount).to.equal(1);
    });
  });

  context('when changing the input value', () => {
    context('when the input is a number', () => {
      it('calls the action with the value cast to an integer', () => {
        component.find(`.${styles['sample-value']}`).
          simulate('change', { target: { value: '1500' }});
        expect(changedSpy.calledWith(1500)).to.equal(true);
      });
    });

    context('when the input is empty', () => {
      it('calls the action with the value cast to null', () => {
        component.find(`.${styles['sample-value']}`).
          simulate('change', { target: { value: '' }});
        expect(changedSpy.calledWith('')).to.equal(true);
      });
    });
  });
});
