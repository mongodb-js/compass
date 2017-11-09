import React from 'react';
import { shallow } from 'enzyme';

import CollectionStatsItem from 'components/collection-stats-item';
import styles from './collection-stats-item.less';

describe('CollectionStatsItem [Component]', () => {
  context('when the component is not primary', () => {
    let component;

    beforeEach(() => {
      component = shallow(<CollectionStatsItem label="label" value="10kb" />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collection-stats-item']}`)).
        to.be.present();
    });

    it('renders the label', () => {
      expect(component.find(`.${styles['collection-stats-item-label']}`)).
        to.have.text('label');
    });

    it('renders the value', () => {
      expect(component.find(`.${styles['collection-stats-item-value']}`)).
        to.have.text('10kb');
    });
  });

  context('when the component is primary', () => {
    let component;

    beforeEach(() => {
      component = shallow(<CollectionStatsItem label="label" value="10kb" primary />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['collection-stats-item']}`)).to.be.present();
    });

    it('renders the label', () => {
      expect(component.find(`.${styles['collection-stats-item-primary-label']}`)).
        to.have.text('label');
    });

    it('renders the value', () => {
      expect(component.find(`.${styles['collection-stats-item-primary-value']}`)).
        to.have.text('10kb');
    });
  });
});
