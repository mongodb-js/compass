import React from 'react';
import { mount } from 'enzyme';
import AppRegistry from 'hadron-app-registry';
import SidebarPlugin from '@mongodb-js/compass-sidebar';
import ShellPlugin from '@mongodb-js/compass-shell';

import classnames from 'classnames';
import styles from './home.less';

import { Home } from 'components/home';
import UI_STATES from 'constants/ui-states';

const getComponent = (name) => {
  class TestComponent extends React.Component {
    render() {
      return React.createElement('div', {
        className: name.indexOf('.') === -1 ? name : name.substr(0, name.indexOf('.'))
      }, name);
    }
  }
  return TestComponent;
};

describe('Home [Component]', () => {
  let component;
  let collapsedSpy;
  let hold;
  beforeEach(() => {
    collapsedSpy = sinon.spy();
    hold = global.hadronApp.appRegistry;
    global.hadronApp.appRegistry = new AppRegistry();


    global.hadronApp.appRegistry.registerComponent('Sidebar.Component', SidebarPlugin);
    global.hadronApp.appRegistry.registerComponent('Global.Shell', ShellPlugin);
    [
      'Collection.Workspace', 'Database.Workspace', 'Instance.Workspace', 'Find',
      'Global.Modal', 'Application.Connect'
    ].map((name) => (
      global.hadronApp.appRegistry.registerRole(name, {component: getComponent(name)})
    ));
    global.hadronApp.appRegistry.onActivated();
  });

  afterEach(() => {
    component = null;
    collapsedSpy = null;
    global.hadronApp.appRegistry = hold;
  });

  describe('is not connected', () => {
    beforeEach(() => {
      component = mount(<Home
        errorMessage=""
        namespace=""
        uiStatus={UI_STATES.COMPLETE}
        isConnected={false}
        isCollapsed={false}
        toggleIsCollapsed={collapsedSpy}
      />);
    });

    it('renders the correct classnames', () => {
      expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
      expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
    });
    it('renders the connect screen', () => {
      expect(component.find('.Application')).to.be.present();
    });
  });

  describe('is connected', () => {
    describe('UI status is loading', () => {
      beforeEach(() => {
        component = mount(<Home
          errorMessage=""
          namespace=""
          uiStatus={UI_STATES.LOADING}
          isConnected
          isCollapsed={false}
          toggleIsCollapsed={collapsedSpy}
        />);
      });

      it('renders the correct classnames', () => {
        expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
        expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
        expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
      });
      it('renders the content as not collapsed', () => {
        expect(component.find('.content-sidebar-expanded')).to.be.present();
      });
      it('renders content correctly', () => {
        expect(component.find('.Instance')).to.not.be.present();
        expect(component.find('.Database')).to.not.be.present();
        expect(component.find('.Collection')).to.not.be.present();
      });
      it('renders the sidebar', () => {
        expect(component.find(SidebarPlugin)).to.be.present();
      });
      it('renders the find', () => {
        expect(component.find('.Find')).to.be.present();
      });
      it('renders the shell plugin', () => {
        expect(component.find(ShellPlugin)).to.be.present();
      });
      it('renders the global', () => {
        expect(component.find('.Global')).to.be.present();
      });
    });
    describe('UI status is error', () => {
      beforeEach(() => {
        component = mount(<Home
          errorMessage="Test error message"
          namespace=""
          uiStatus={UI_STATES.ERROR}
          isConnected
          isCollapsed={false}
          toggleIsCollapsed={collapsedSpy}
        />);
      });

      it('renders the correct classnames', () => {
        expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
        expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
        expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
      });
      it('renders the content as not collapsed', () => {
        expect(component.find('.content-sidebar-expanded')).to.be.present();
      });
      it('renders content correctly', () => {
        expect(component.find('.status-row-has-error')).to.be.present();
        expect(component.find('.status-row-has-error').text()).to.be.equal(
          'An error occurred while loading navigation: Test error message'
        );
        expect(component.find('.Instance')).to.not.be.present();
        expect(component.find('.Database')).to.not.be.present();
        expect(component.find('.Collection')).to.not.be.present();
      });
      it('renders the sidebar', () => {
        expect(component.find(SidebarPlugin)).to.be.present();
      });
      it('renders the find', () => {
        expect(component.find('.Find')).to.be.present();
      });
      it('renders the global', () => {
        expect(component.find('.Global')).to.be.present();
      });
      it('renders the shell plugin', () => {
        expect(component.find(ShellPlugin)).to.be.present();
      });
    });
    describe('UI status is complete', () => {
      describe('namespace is unset', () => {
        beforeEach(() => {
          component = mount(<Home
            errorMessage=""
            namespace=""
            uiStatus={UI_STATES.COMPLETE}
            isConnected
            isCollapsed={false}
            toggleIsCollapsed={collapsedSpy}
          />);
        });

        it('renders the correct classnames', () => {
          expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
        });
        it('renders the content as not collapsed', () => {
          expect(component.find('.content-sidebar-expanded')).to.be.present();
        });
        it('renders content correctly', () => {
          expect(component.find('.Instance')).to.be.present();
        });
        it('renders the sidebar', () => {
          expect(component.find(SidebarPlugin)).to.be.present();
        });
        it('renders the find', () => {
          expect(component.find('.Find')).to.be.present();
        });
        it('renders the shell plugin', () => {
          expect(component.find(ShellPlugin)).to.be.present();
        });
        it('renders the global', () => {
          expect(component.find('.Global')).to.be.present();
        });
      });
      describe('namespace is only DB', () => {
        beforeEach(() => {
          component = mount(<Home
            errorMessage=""
            namespace="db"
            uiStatus={UI_STATES.COMPLETE}
            isConnected
            isCollapsed={false}
            toggleIsCollapsed={collapsedSpy}
          />);
        });

        it('renders the correct classnames', () => {
          expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
        });
        it('renders the content as not collapsed', () => {
          expect(component.find('.content-sidebar-expanded')).to.be.present();
        });
        it('renders content correctly', () => {
          expect(component.find('.Database')).to.be.present();
        });
        it('renders the sidebar', () => {
          expect(component.find(SidebarPlugin)).to.be.present();
        });
        it('renders the find', () => {
          expect(component.find('.Find')).to.be.present();
        });
        it('renders the shell plugin', () => {
          expect(component.find(ShellPlugin)).to.be.present();
        });
        it('renders the global', () => {
          expect(component.find('.Global')).to.be.present();
        });
      });
      describe('namespace is db and coll', () => {
        beforeEach(() => {
          component = mount(<Home
            errorMessage=""
            namespace="db.coll"
            uiStatus={UI_STATES.COMPLETE}
            isConnected
            isCollapsed={false}
            toggleIsCollapsed={collapsedSpy}
          />);
        });

        it('renders the correct classnames', () => {
          expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
        });
        it('renders the content as not collapsed', () => {
          expect(component.find('.content-sidebar-expanded')).to.be.present();
        });
        it('renders content correctly', () => {
          expect(component.find('.Collection')).to.be.present();
        });
        it('renders the sidebar', () => {
          expect(component.find(SidebarPlugin)).to.be.present();
        });
        it('renders the find', () => {
          expect(component.find('.Find')).to.be.present();
        });
        it('renders the global', () => {
          expect(component.find('.Global')).to.be.present();
        });
        it('renders the shell plugin', () => {
          expect(component.find(ShellPlugin)).to.be.present();
        });
      });
      describe('isCollapsed is true', () => {
        beforeEach(() => {
          component = mount(<Home
            errorMessage=""
            namespace=""
            uiStatus={UI_STATES.COMPLETE}
            isConnected
            isCollapsed
            toggleIsCollapsed={collapsedSpy}
          />);
        });

        it('renders the correct classnames', () => {
          expect(component.find(`.${classnames(styles['home-view'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page'])}`)).to.be.present();
          expect(component.find(`.${classnames(styles['home-view-page-content'])}`)).to.be.present();
        });
        it('renders the content as collapsed', () => {
          expect(component.find('.content-sidebar-collapsed')).to.be.present();
        });
        it('renders content correctly', () => {
          expect(component.find('.Instance')).to.be.present();
        });
        it('renders the sidebar', () => {
          expect(component.find(SidebarPlugin)).to.be.present();
        });
        it('renders the find', () => {
          expect(component.find('.Find')).to.be.present();
        });
        it('renders the shell plugin', () => {
          expect(component.find(ShellPlugin)).to.be.present();
        });
        it('renders the global', () => {
          expect(component.find('.Global')).to.be.present();
        });
      });
      describe('toggleIsCollapsed', () => {
        beforeEach(() => {
          component = mount(<Home
            errorMessage=""
            namespace=""
            uiStatus={UI_STATES.COMPLETE}
            isConnected
            isCollapsed
            toggleIsCollapsed={collapsedSpy}
          />);
          component.find('[data-test-id="toggle-sidebar"]').simulate('click');
        });
        it('calls onCollapsed', () => {
          expect(collapsedSpy.calledOnce).to.equal(true);
        });
      });
    });
  });
});
