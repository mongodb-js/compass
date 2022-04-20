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

  it('does not render the maxTimeMS label by default', function() {
    expect(
      component.find('[data-testid="maxtimems-toolbar-input-label"]')
    ).not.be.present();
  });

  it('does not render the maxTimeMS input by default', function() {
    expect(
      component.find('[data-testid="max-time-ms"]')
    ).not.be.present();
  });

  describe('CollationToolbar [Component] with maxTimeMS', function() {
    const showNewAggregationInitialValue = process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR;
    let component;
    beforeEach(function() {
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = 'true';
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
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = showNewAggregationInitialValue;
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
