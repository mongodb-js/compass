import React from 'react';
import { mount } from 'enzyme';

import { Workspace, getTabType } from '../workspace';
import styles from './workspace.module.less';

describe.skip('Workspace [Component]', () => {
  let component;
  let prevTabSpy;
  let nextTabSpy;
  const tabs = [
    { isActive: true },
    { isActive: false },
  ];

  beforeEach(() => {
    prevTabSpy = sinon.spy();
    nextTabSpy = sinon.spy();

    component = mount(
      <Workspace
        tabs={tabs}
        closeTab={() => {}}
        moveTab={() => {}}
        selectTab={() => {}}
        appRegistry={{}}
        prevTab={prevTabSpy}
        nextTab={nextTabSpy}
        createNewTab={() => {}} />
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

  it('renders one tab hidden, one not', () => {
    expect(component.find(`.${styles['workspace-view-tab']}:not(.hidden)`)).to.be.present();
    expect(component.find(`.${styles['workspace-view-tab']}.hidden`)).to.be.present();
  });

  describe('#getTabType', () => {
    it('should return "timeseries" for a timeseries collection', () => {
      expect(getTabType(true, false)).to.equal('timeseries');
    });

    it('should return "view" for a view', () => {
      expect(getTabType(false, true)).to.equal('view');
    });

    it('should return "collection" when its not time series or readonly', () => {
      expect(getTabType(false, false)).to.equal('collection');
    });
  });
});
