import React from 'react';
import { mount } from 'enzyme';
import { Icon } from '@mongodb-js/compass-components';

import CollectionTypeIcon from '../collection-type-icon';

describe('CollectionTypeIcon [Component]', () => {
  let component;

  describe('default collection type', () => {
    beforeEach(() => {
      component = mount(<CollectionTypeIcon
        collectionType="collection"
      />);
    });

    it('has a collection type icon folder', () => {
      expect(component.find(Icon).props().glyph).to.equal('Folder');
    });
  });

  describe('time-series collection type', () => {
    beforeEach(() => {
      component = mount(<CollectionTypeIcon
        collectionType="timeseries"
      />);
    });

    it('has a time series icon', () => {
      expect(component.find(Icon).props().glyph).to.equal('TimeSeries');
    });
  });

  describe('view collection type', () => {
    beforeEach(() => {
      component = mount(<CollectionTypeIcon
        collectionType="view"
      />);
    });

    it('has a view icon', () => {
      expect(component.find(Icon).props().glyph).to.equal('Visibility');
    });
  });
});
