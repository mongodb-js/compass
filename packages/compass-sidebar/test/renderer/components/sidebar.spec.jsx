import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import sinon from 'sinon';

import AppRegistry from 'hadron-app-registry';
import { MongoDBInstance, TopologyDescription } from 'mongodb-instance-model';

import SidebarStore from '../../../src/stores';
import Sidebar, {
  Sidebar as UnconnectedSidebar,
} from '../../../src/components-legacy/sidebar';
import SidebarInstance from '../../../src/components-legacy/sidebar-instance';
import DeploymentAwareness from '../../../src/components-legacy/deployment-awareness';
import ServerVersion from '../../../src/components-legacy/server-version';
import SshTunnelStatus from '../../../src/components-legacy/ssh-tunnel-status';
import styles from '../../../src/components-legacy/sidebar/sidebar.module.less';

describe('Sidebar [Component]', function () {
  let appRegistry;

  const connectionInfo = {
    connectionOptions: {
      connectionString:
        'mongodb://localhost:27020?readPreference=primaryPreferred',
    },
    id: '123',
    favorite: {
      name: 'my favorite',
    },
  };

  const topologyDescription = new TopologyDescription({
    type: 'Unknown',
    servers: [{ type: 'Unknown' }],
  });

  const fakeInstance = new MongoDBInstance({
    _id: '123',
    topologyDescription,
    /*
    dataLake: {
      isDataLake: false,
      version: '1.2.3'
    },
    build: {
      isEnterprise: false,
      version: '6.0.0',
    },
    databases: null,
    collections: null
    */
  });

  before(function () {
    appRegistry = new AppRegistry();
    SidebarStore.onActivated(appRegistry);
  });

  describe('when rendered with the store', function () {
    let component;

    beforeEach(function () {
      // NOTE: no instance-created yet, so no instance in this case
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar onCollapse={() => {}} />
        </Provider>
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the correct root classname', function () {
      expect(component.find(`.${styles['compass-sidebar']}`)).to.exist;
    });
  });

  describe('when the instance details are loaded', function () {
    let component;

    beforeEach(function () {
      appRegistry.emit('instance-created', { instance: fakeInstance });

      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar />
        </Provider>
      );

      fakeInstance.set({
        status: 'ready',
        statusError: null,
        build: {
          isEnterprise: true,
          version: '2.3.4',
        },
        dataLake: {
          isDataLake: true,
          version: '3.4.5',
        },
        genuineMongoDB: {
          isGenuineMongoDB: true,
        },
      });

      component.update();
    });

    afterEach(function () {
      appRegistry.emit('instance-destroyed');
    });

    it('renders instance details', function () {
      expect(component.find(DeploymentAwareness)).to.be.present();
      expect(component.find(ServerVersion)).to.be.present();
      expect(component.find(SshTunnelStatus)).to.be.present();
    });
  });

  describe('when it is open (not collapsed)', function () {
    let component;
    let emitSpy;
    let saveFavoriteSpy;

    beforeEach(function () {
      emitSpy = sinon.spy();
      saveFavoriteSpy = sinon.spy();

      // the provider's state will override the props and most of the sidebar
      // expects the instance to be there
      appRegistry.emit('instance-created', { instance: fakeInstance });

      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar
            store={SidebarStore}
            connectionInfo={connectionInfo}
            description="Topology type not yet discovered."
            databases={{
              databases: [],
            }}
            filterRegex={/(?:)/}
            power_of_two={false}
            collections={[]}
            readonly={false}
            isWritable
            isDataLake={false}
            globalAppRegistryEmit={emitSpy}
            isGenuineMongoDB
            isGenuineMongoDBVisible={false}
            toggleIsGenuineMongoDBVisible={() => {}}
            openLink={function () {}}
            isDetailsExpanded={false}
            toggleIsDetailsExpanded={function () {}}
            detailsPlugins={[]}
            filterDatabases={function () {}}
            changeDatabases={function () {}}
            changeFilterRegex={function () {}}
            updateAndSaveConnectionInfo={() => {}}
            setConnectionIsCSFLEEnabled={function () {}}
            saveFavorite={saveFavoriteSpy}
          />
        </Provider>
      );
    });

    afterEach(function () {
      appRegistry.emit('instance-destroyed');

      component = null;
      emitSpy = null;
      saveFavoriteSpy = null;
    });

    it('renders a sidebar size toggle', function () {
      const buttonComponent = component.find('[data-test-id="toggle-sidebar"]');
      expect(buttonComponent).to.be.present();
      expect(buttonComponent.find('.fa-caret-left')).to.be.present;
    });

    it('renders the SidebarInstance component', function () {
      expect(component.find(SidebarInstance)).to.be.present();
    });

    it('renders the sidebar content', function () {
      expect(
        component.find(`.${styles['compass-sidebar-content']}`)
      ).to.be.present();
    });
  });

  describe('when it is collapsed', function () {
    let component;

    beforeEach(function () {
      appRegistry.emit('instance-created', { instance: fakeInstance });

      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    afterEach(function () {
      appRegistry.emit('instance-destroyed');
      component = null;
    });

    it('renders a sidebar size toggle', function () {
      const buttonComponent = component.find('[data-test-id="toggle-sidebar"]');
      expect(buttonComponent).to.be.present();
      expect(buttonComponent.find('.fa-caret-right')).to.be.present;
    });

    it.skip('does not render the sidebar content', function () {
      expect(
        component.find(`.${styles['compass-sidebar-content']}`)
      ).to.not.be.present();
    });
  });

  context('when it is clicked to collapse', function () {
    let component;

    beforeEach(function () {
      appRegistry.emit('instance-created', { instance: fakeInstance });

      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    afterEach(function () {
      appRegistry.emit('instance-destroyed');
    });

    it('sets the collapsed width to 36', function () {
      expect(
        component.find('[data-test-id="compass-sidebar-panel"]').prop('style')
          .width
      ).to.equal(36);
    });

    context('when it is expanded again', function () {
      beforeEach(function () {
        component.find('[data-test-id="toggle-sidebar"]').simulate('click');
        component.update();
      });

      it('sets the collapsed width to 250', function () {
        expect(
          component.find('[data-test-id="compass-sidebar-panel"]').prop('style')
            .width
        ).to.equal(250);
      });
    });
  });

  describe('resize actions', function () {
    let component;

    beforeEach(function () {
      appRegistry.emit('instance-created', { instance: fakeInstance });

      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar
            updateAndSaveConnectionInfo={() => {}}
            setConnectionIsCSFLEEnabled={function () {}}
            connectionInfo={connectionInfo}
          />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    afterEach(function () {
      appRegistry.emit('instance-destroyed');
    });

    context('when expanded', function () {
      describe('when resize is called', function () {
        beforeEach(function () {
          const sidebarComponent = component.find(UnconnectedSidebar);
          sidebarComponent.instance().updateWidth(189);
          component.update();
        });

        it('updates the width', function () {
          expect(
            component
              .find('[data-test-id="compass-sidebar-panel"]')
              .prop('style').width
          ).to.equal(189);
        });

        context('when it hits the lower bound', function () {
          beforeEach(function () {
            const sidebarComponent = component.find(UnconnectedSidebar);
            sidebarComponent.instance().updateWidth(1);
            component.update();
          });

          it('collapses the sidebar', function () {
            expect(
              component
                .find('[data-test-id="compass-sidebar-panel"]')
                .prop('style').width
            ).to.equal(36);
          });
        });
      });
    });

    context('when collapsed', function () {
      beforeEach(function () {
        component.find('[data-test-id="toggle-sidebar"]').simulate('click');
        component.update();
      });

      describe('when resize is called', function () {
        beforeEach(function () {
          const sidebarComponent = component.find(UnconnectedSidebar);
          sidebarComponent.instance().updateWidth(55);
          component.update();
        });

        it('updates the width', function () {
          expect(
            component
              .find('[data-test-id="compass-sidebar-panel"]')
              .prop('style').width
          ).to.equal(36);
          expect(component.find('[type="range"]').at(0).prop('value')).to.equal(
            55
          );
        });

        context('when it hits the expand threshold bound', function () {
          beforeEach(function () {
            const sidebarComponent = component.find(UnconnectedSidebar);
            sidebarComponent.instance().updateWidth(171);
            component.update();
          });

          it('expands the sidebar', function () {
            expect(
              component
                .find('[data-test-id="compass-sidebar-panel"]')
                .prop('style').width
            ).to.equal(171);
          });
        });
      });
    });
  });
});
