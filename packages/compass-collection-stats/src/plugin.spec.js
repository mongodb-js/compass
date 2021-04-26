import React from 'react';
import { mount } from 'enzyme';
import { StoreConnector } from 'hadron-react-components';
import configureStore from 'stores';
import CollectionStatsPlugin from './plugin';

describe('CollectionStats [Plugin]', () => {
  let component;

  beforeEach((done) => {
    component = mount(<CollectionStatsPlugin store={configureStore()} />);
    done();
  });

  afterEach((done) => {
    component = null;
    done();
  });

  it('should contain a <StoreConnector /> with a store prop', () => {
    expect(component.find(StoreConnector).first().props('store')).to.be.an('object');
  });
});
