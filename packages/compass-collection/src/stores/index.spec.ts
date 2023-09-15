import { expect } from 'chai';
import store from './index';

describe('Collection Store', function () {
  // TODO: all old tests here were not relevant anymore, replace them with new
  // ones

  it('should have onActivated method', function () {
    expect(store).to.have.property('onActivated');
  });
});
