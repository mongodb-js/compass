import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';

// import classnames from 'classnames';
// import styles from './home.less';

import { Home } from 'components/home';

const getComponent = (name) => {
  class TestComponent extends React.Component {
    render() {
      return React.createElement('div', {className: name}, name);
    }
  }
  return TestComponent;
};

describe('Home [Component]', () => {
  let component;
  let collapsedSpy;
  let hold;
  let schemaActionSpy;
  beforeEach(() => {
    schemaActionSpy = sinon.spy();
    collapsedSpy = sinon.spy();
    hold = global.hadronApp.appRegistry;
    global.hadronApp.appRegistry = new AppRegistry();


    global.hadronApp.appRegistry.registerComponent('Sidebar.Component', getComponent('Sidebar.Component'));
    global.hadronApp.appRegistry.registerComponent('InstanceHeader.Component', getComponent('InstanceHeader.Component'));
    global.hadronApp.appRegistry.registerAction('Schema.Actions', {resizeMiniCharts: schemaActionSpy});
    [
      'Collection.Workspace', 'Database.Workspace', 'Instance.Workspace', 'Find',
      'Global.Modal', 'Import.Modal', 'Export.Modal', 'ExportToLanguage.Modal',
      'Application.Connect', 'QueryHistory.Component'
    ].map((name) => (
      global.hadronApp.appRegistry.registerRole(name, {component: getComponent(name)})
    ));

    global.hadronApp.appRegistry.onActivated();
    component = mount(<Home
      errorMessage=""
      namespace=""
      uiStatus="COMPLETE"
      isConnected={false}
      isCollapsed={false}
      toggleIsCollapsed={collapsedSpy}
    />);
  });

  afterEach(() => {
    component = null;
    collapsedSpy = null;
    global.hadronApp.appRegistry = hold;
  });

  it('renders the correct root classname', () => {
    console.log(component.debug());
    expect(component.find(Home)).to.be.present();
  });
});
