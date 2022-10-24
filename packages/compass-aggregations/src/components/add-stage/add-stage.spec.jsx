import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { AddStage } from './add-stage';
import styles from './add-stage.module.less';

describe('AddStage [Component]', function() {
  let component;
  const spy = sinon.spy();

  beforeEach(function() {
    component = mount(
      <AddStage onAddStageClick={spy} />
    );
  });

  afterEach(function() {
    
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['add-stage']}`)).to.be.present();
  });

  it('renders the add stage button', function() {
    expect(component.find('button')).to.have.text('Add Stage');
  });

  context('when clicking on the button', function() {
    it('calls the action', function() {
      component.find('button').simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});
