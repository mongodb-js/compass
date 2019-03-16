import React from 'react';
import { mount } from 'enzyme';

import Workspace from 'components/workspace';
import styles from './workspace.less';

describe('Workspace [Component]', () => {
  let component;
  let prevTabSpy;
  let nextTabSpy;
  const tabs = [{ namespace: 'db.coll', isActive: true }];

  beforeEach(() => {
    prevTabSpy = sinon.spy();
    nextTabSpy = sinon.spy();

    component = mount(
      <Workspace.DecoratedComponent
        tabs={tabs}
        closeTab={() => {}}
        moveTab={() => {}}
        selectTab={() => {}}
        prevTab={prevTabSpy}
        nextTab={nextTabSpy}
        createTab={() => {}} />
    );
  });

  afterEach(() => {
    prevTabSpy = null;
    nextTabSpy = null;
    component = null;
  });

  it('renders the tab div', () => {
    expect(component.find(`.${styles['workspace-tabs']}`)).to.be.present();
  });

  it('renders the individual tabs', () => {
    expect(component.find(`.${styles['workspace-tabs-container']}`)).to.be.present();
  });

  context('when clicking the prev button', () => {
    it('calls the action', () => {
      component.find(`.${styles['workspace-tabs-prev']}`).simulate('click');
      expect(prevTabSpy.calledOnce).to.equal(true);
    });
  });

  context('when clicking the next button', () => {
    it('calls the action', () => {
      component.find(`.${styles['workspace-tabs-next']}`).simulate('click');
      expect(nextTabSpy.calledOnce).to.equal(true);
    });
  });
});
