import React from 'react';
import { mount } from 'enzyme';

import StageCollapser from 'components/stage-collapser';
import styles from './stage-collapser.less';

describe('StageCollaper [Component]', () => {
  context('when the stage is expanded', () => {
    let component;
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <StageCollapser
          isExpanded
          index={1}
          setIsModified={setIsModifiedSpy}
          stageCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['stage-collapser']}`)).to.be.present();
    });

    it('renders the collapse text', () => {
      expect(component.find('button')).to.have.prop('title', 'Collapse');
    });

    it('renders the collapse button', () => {
      expect(component.find('.fa-angle-down')).to.be.present();
    });
  });

  context('when the stage is collapsed', () => {
    let component;
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <StageCollapser
          isExpanded={false}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the expand text', () => {
      expect(component.find('button')).to.have.prop('title', 'Expand');
    });

    it('renders the expand button', () => {
      expect(component.find('.fa-angle-right')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const spy = sinon.spy();
    const setIsModifiedSpy = sinon.spy();

    beforeEach(() => {
      component = mount(
        <StageCollapser
          isExpanded={false}
          index={1}
          setIsModified={setIsModifiedSpy}
          stageCollapseToggled={spy} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion and sets as modified', () => {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(true);
      expect(setIsModifiedSpy.calledOnce).to.equal(true);
    });
  });
});
