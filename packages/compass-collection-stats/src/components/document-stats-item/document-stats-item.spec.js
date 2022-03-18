import React from 'react';
import { expect } from 'chai';
import { mount } from 'enzyme';

import DocumentStatsItem from '../document-stats-item';
import styles from './document-stats-item.module.less';
import statsStyles from '../collection-stats-item/collection-stats-item.module.less';

describe.skip('DocumentStatsItem [Component]', () => {
  describe('when rendered', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <DocumentStatsItem
          documentCount="10"
          storageSize="5kb"
          avgDocumentSize="1k"
          isTimeSeries={false}
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['document-stats-item']}`)).
        to.be.present();
    });

    it('renders the count as primary', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-primary-label']}`)).
        to.have.text('Documents');
    });

    it('renders the count as primary value', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-primary-value']}`)).
        to.have.text('10');
    });

    it('renders storage size as non primary label', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-label']}`).at(0)).
        to.have.text('storage size');
    });

    it('renders avg document size as a non primary value', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-value']}`).at(0)).
        to.have.text('5kb');
    });

    it('renders avg document size as non primary label', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-label']}`).at(1)).
        to.have.text('avg. size');
    });

    it('renders avg document size as a non primary value', () => {
      expect(component.find(`.${statsStyles['collection-stats-item-value']}`).at(1)).
        to.have.text('1k');
    });
  });

  describe('when time-series is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <DocumentStatsItem
          documentCount="10"
          storageSize="5kb"
          avgDocumentSize="1k"
          isTimeSeries
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the count', () => {
      expect(
        component.find(`.${statsStyles['collection-stats-item-primary-value']}`)
      ).to.not.be.present();
    });

    it('renders total document size', () => {
      expect(
        component.find(`.${statsStyles['collection-stats-item-label']}`).at(0)
      ).to.be.present();
    });

    it('renders avg document size', () => {
      expect(
        component.find(`.${statsStyles['collection-stats-item-value']}`).length
      ).to.equal(1);
    });
  });
});
