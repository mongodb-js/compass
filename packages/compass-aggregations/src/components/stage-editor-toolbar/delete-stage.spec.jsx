import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { DeleteStage } from './delete-stage';
import styles from './delete-stage.module.less';

describe('DeleteStage [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <DeleteStage
          index={1}
          onStageDeleteClick={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the correct root classname', function() {
      expect(component.find(`.${styles['delete-stage']}`)).to.be.present();
    });

    it('renders the collapse text', function() {
      expect(component.find('button')).to.have.prop('title', 'Delete Stage');
    });

    it('renders the delete button', function() {
      expect(component.find('.fa-trash-o')).to.be.present();
    });
  });

  context('when clicking on the button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <DeleteStage
          index={1}
          onStageDeleteClick={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('calls delete handler when clicked', function() {
      expect(spy.calledOnce).to.equal(false);
      component.find('button').simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});
