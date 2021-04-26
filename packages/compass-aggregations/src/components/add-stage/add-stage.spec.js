import React from 'react';
import { mount } from 'enzyme';

import AddStage from 'components/add-stage';
import styles from './add-stage.less';

describe('AddStage [Component]', () => {
  let component;
  const spy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <AddStage stageAdded={spy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['add-stage']}`)).to.be.present();
  });

  it('renders the add stage button', () => {
    expect(component.find('button')).to.have.text('Add Stage');
  });

  context('when clicking on the button', () => {
    it('calls the action', () => {
      component.find('button').simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});
