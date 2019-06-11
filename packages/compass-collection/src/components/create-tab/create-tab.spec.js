import React from 'react';
import { mount } from 'enzyme';

import CreateTab from 'components/create-tab';
import styles from './create-tab.less';

describe('CreateTab [Component]', () => {
  let component;
  let createNewTabSpy;

  beforeEach(() => {
    createNewTabSpy = sinon.spy();

    component = mount(
      <CreateTab
        activeNamespace="db.coll"
        activeIsReadonly={false}
        activeSourceName=""
        createNewTab={createNewTabSpy} />
    );
  });

  afterEach(() => {
    createNewTabSpy = null;
    component = null;
  });

  it('renders the tab div', () => {
    expect(component.find(`.${styles['create-tab']}`)).to.be.present();
  });

  context('when clicking the create button', () => {
    it('calls the action', () => {
      component.find(`.${styles['create-tab']}`).simulate('click');
      expect(createNewTabSpy.calledWith('db.coll')).to.equal(true);
    });
  });
});
