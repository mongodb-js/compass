import React from 'react';
import { mount } from 'enzyme';

import IndexStatsItem from 'components/index-stats-item';
import styles from './index-stats-item.less';
import statsStyles from '../collection-stats-item/collection-stats-item.less';

describe('IndexStatsItem [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <IndexStatsItem indexCount="10" totalIndexSize="5kb" avgIndexSize="1k" />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['index-stats-item']}`)).
      to.be.present();
  });

  it('renders the count as primary', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-primary-label']}`)).
      to.have.text('Indexes');
  });

  it('renders the count as primary value', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-primary-value']}`)).
      to.have.text('10');
  });

  it('renders total index size as non primary label', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-label']}`).at(0)).
      to.have.text('total size');
  });

  it('renders avg index size as a non primary value', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-value']}`).at(0)).
      to.have.text('5kb');
  });

  it('renders avg index size as non primary label', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-label']}`).at(1)).
      to.have.text('avg. size');
  });

  it('renders avg index size as a non primary value', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-value']}`).at(1)).
      to.have.text('1k');
  });
});
