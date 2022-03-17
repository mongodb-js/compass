import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

import CollectionStats from '../collection-stats';
import DocumentStatsItem from '../document-stats-item';
import IndexStatsItem from '../index-stats-item';
import styles from './collection-stats.module.less';

describe('CollectionStats [Component]', () => {
  describe('when rendered', () => {
    let component;

    beforeEach(() => {
      global.hadronApp = {
        appRegistry: new AppRegistry()
      };
      component = mount(<CollectionStats
        isReadonly={false}
        isTimeSeries={false}
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collection-stats']}`)).to.be.present();
    });

    it('renders the document and index stats', () => {
      expect(component.find(DocumentStatsItem)).to.be.present();
      expect(component.find(IndexStatsItem)).to.be.present();
    });
  });

  describe('When the collection is a view', () => {
    let component;
    before(() => {
      component = mount(<CollectionStats
        isReadonly
        isTimeSeries={false}
      />);
    });

    it('renders an empty state', () => {
      expect(
        component.find(`.${styles['collection-stats-empty']}`)
      ).to.be.present();
    });

    it('does not render the document and index stats', () => {
      expect(component.find(DocumentStatsItem)).to.not.be.present();
      expect(component.find(IndexStatsItem)).to.not.be.present();
    });

    after(() => {
      component = null;
    });
  });

  describe('when the collection is a time-series collection', () => {
    let component;

    beforeEach(() => {
      global.hadronApp = {
        appRegistry: new AppRegistry()
      };
      component = mount(<CollectionStats
        isReadonly={false}
        isTimeSeries
      />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the document stats', () => {
      expect(component.find(DocumentStatsItem)).to.be.present();
    });

    it('does not render the index stats', () => {
      expect(component.find(IndexStatsItem)).to.not.be.present();
    });
  });
});
