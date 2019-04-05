import React from 'react';
import { mount } from 'enzyme';
import ExplainPlan from 'components/explain-plan';
import store from 'stores';
import styles from './explain-plan.less';
import AppRegistry from 'hadron-app-registry';
import hadronApp from 'hadron-app';

describe('ExplainPlan [Component]', () => {
  let component;
  const appRegistry = new AppRegistry();

  class QueryBar extends React.Component {
    render() {
      return (<div id="queryBar">Query Bar</div>);
    }
  }

  beforeEach(() => {
    component = mount(<ExplainPlan store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  before(function() {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerComponent('Query.QueryBar', QueryBar);
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});
