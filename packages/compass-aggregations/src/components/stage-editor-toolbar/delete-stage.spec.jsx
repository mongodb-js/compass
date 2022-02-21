import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import DeleteStage from './delete-stage';
import styles from './delete-stage.module.less';

describe('DeleteStage [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    const stage = {};
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();
    const runStageSpy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <DeleteStage
          stage={stage}
          runStage={runStageSpy}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageDeleted={spy}
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
    const stage = {};
    const spy = sinon.spy();
    const runStageSpy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(function() {
      component = mount(
        <DeleteStage
          stage={stage}
          runStage={runStageSpy}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageDeleted={spy}
        />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('toggles the expansion and flags as modified', function() {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(true);
      expect(setIsModifiedSpy.calledOnce).to.equal(true);
    });
  });
});
