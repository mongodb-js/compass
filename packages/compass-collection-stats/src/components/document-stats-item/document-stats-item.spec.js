import React from 'react';
import { mount } from 'enzyme';

import DocumentStatsItem from 'components/document-stats-item';
import styles from './document-stats-item.less';
import statsStyles from '../collection-stats-item/collection-stats-item.less';

describe('DocumentStatsItem [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <DocumentStatsItem documentCount="10" totalDocumentSize="5kb" avgDocumentSize="1k" />
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

  it('renders total document size as non primary label', () => {
    expect(component.find(`.${statsStyles['collection-stats-item-label']}`).at(0)).
      to.have.text('total size');
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
