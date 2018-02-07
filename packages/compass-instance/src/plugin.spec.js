import React from 'react';
import { shallow } from 'enzyme';
import AppRegistry from 'hadron-app-registry'
import InstancePlugin from './plugin';

describe('Instance [Plugin]', () => {
  let component;

  const noop = () => {};
  const databaseRole = {
    component: noop,
    name: 'database',
    order: 1
  };

  const performanceRole = {
    component: noop,
    name: 'performance',
    order: 2
  };

  const appRegistry = new AppRegistry();

  beforeEach((done) => {
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerRole('Instance.Tab', databaseRole);
    global.hadronApp.appRegistry.registerRole('Instance.Tab', performanceRole);
    component = shallow(<InstancePlugin />);
    done();
  });

  afterEach((done) => {
    component = null;
    done();
  });

  it('component should be isntanceOf InstancePlugin', () => {
    expect(component.instance()).to.be.instanceOf(InstancePlugin);
  });

  it('should return an array of views', () => {
    var instance = component.instance();
    expect(instance.views).to.be.an('array');
  });

  it('a view should have a component props', () => {
    var instance = component.instance();
    expect(instance.views[0].props.component).to.be.equal(databaseRole.component);
  });

  it('a view should have a displayName of UnsafeComponent', () => {
    var instance = component.instance();
    expect(instance.views[0].type.displayName).to.be.equal('UnsafeComponent');
  });

  it('should return database and perfromance tabs', () => {
    var instance = component.instance();
    expect(instance.tabs).to.deep.equal(['database', 'performance'])
  });
});
