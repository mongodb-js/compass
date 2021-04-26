import React from 'react';
import { mount } from 'enzyme';

import CollationToolbar from './collation-toolbar';
import styles from './collation-toolbar.less';

describe('CollationToolbar [Component]', () => {
  let component;
  let collationChangedSpy;
  let collationStringChangedSpy;
  let openLinkSpy;

  beforeEach(() => {
    collationChangedSpy = sinon.spy();
    collationStringChangedSpy = sinon.spy();
    openLinkSpy = sinon.spy();

    component = mount(
      <CollationToolbar
        collation={{ locale: 'simple' }}
        collationChanged={collationChangedSpy}
        collationString="{locale: 'simple' }"
        collationStringChanged={collationStringChangedSpy}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
    collationChangedSpy = null;
    collationStringChangedSpy = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['collation-toolbar']}`)).to.be.present();
  });

  it('renders the collation lable', () => {
    expect(component.find(`.${styles['collation-toolbar-input-label']}`)).
      to.be.present();
  });

  it('renders the collation tooltip', () => {
    expect(component.find('.info-sprinkle')).to.be.present();
  });
});
