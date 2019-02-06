import React from 'react';
import { mount } from 'enzyme';

import DeleteStage from './delete-stage';
import styles from './delete-stage.less';

describe('DeleteStage [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const stage = {};
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <DeleteStage
          stage={stage}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageDeleted={spy}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['delete-stage']}`)).to.be.present();
    });

    it('renders the collapse text', () => {
      expect(component.find('button')).to.have.prop('title', 'Delete Stage');
    });

    it('renders the delete button', () => {
      expect(component.find('.fa-trash-o')).to.be.present();
    });

    it('renders the tooltip', () => {
      expect(component.find('.hadron-tooltip')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const stage = {};
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <DeleteStage
          stage={stage}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageDeleted={spy}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion and flags as modified', () => {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(true);
      expect(setIsModifiedSpy.calledOnce).to.equal(true);
    });
  });
});
