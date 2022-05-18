import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import CollationToolbar from './collation-toolbar';
import styles from './collation-toolbar.module.less';

describe('CollationToolbar [Component]', function() {
  let component;
  let collationChangedSpy;
  let collationStringChangedSpy;
  let openLinkSpy;

  beforeEach(function() {
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

  afterEach(function() {
    component = null;
    collationChangedSpy = null;
    collationStringChangedSpy = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['collation-toolbar']}`)).to.be.present();
  });

  it('renders the collation label', function() {
    expect(
      component.find('[data-testid="collation-toolbar-input-label"]')
    ).to.be.present();
  });

  it('renders the collation tooltip', function() {
    expect(component.find('.info-sprinkle')).to.be.present();
  });

  it('renders the collation input', function() {
    expect(
      component.find('[data-testid="collation-string"]')
    ).to.be.present();
  });

  describe('CollationToolbar [Component] with maxTimeMS', function() {
    let component;
    beforeEach(function() {
      component = mount(
        <CollationToolbar
          maxTimeMS={1000}
          maxTimeMSChanged={() => {}}
          collation={{ locale: 'simple' }}
          collationChanged={() => {}}
          collationString="{locale: 'simple' }"
          collationStringChanged={() => {}}
          openLink={() => {}} />
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the maxTimeMS label', function() {
      expect(
        component.find('[data-testid="maxtimems-toolbar-input-label"]')
      ).to.be.present();
    });
  
    it('renders the maxTimeMS input', function() {
      expect(
        component.find('[data-testid="max-time-ms"]')
      ).to.be.present();
    });
  });
});
