import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import sinon from 'sinon';

import SidebarStore from '../../../src/stores';
import Sidebar, { Sidebar as UnconnectedSidebar } from '../../../src/components/sidebar';
import SidebarInstance from '../../../src/components/sidebar-instance';
import styles from '../../../src/components/sidebar/sidebar.module.less';

describe('Sidebar [Component]', () => {
  const connectionInfo = {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27020?readPreference=primaryPreferred'
    },
    id: '123',
    favorite: {
      name: 'my favorite'
    }
  };

  describe('when rendered with the store', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar
            onCollapse={()=>{}}
          />
        </Provider>
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['compass-sidebar']}`)).to.exist;
    });
  });

  describe('when it is open (not collapsed)', () => {
    let component;
    let emitSpy;
    let saveFavoriteSpy;

    beforeEach(() => {
      emitSpy = sinon.spy();
      saveFavoriteSpy = sinon.spy();
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar
            store={SidebarStore}
            connectionInfo={connectionInfo}
            description="Topology type not yet discovered."
            databases={{
              databases: []
            }}
            instance={{
              databases: null,
              collections: null
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
            toggleIsGenuineMongoDBVisible={()=>{}}
            openLink={() => {}}
            isDetailsExpanded={false}
            toggleIsDetailsExpanded={() => {}}
            detailsPlugins={[]}
            filterDatabases={() => {}}
            changeDatabases={() => {}}
            changeFilterRegex={() => {}}
            updateAndSaveConnectionInfo={()=>{}}
            setConnectionIsCSFLEEnabled={() =>{}}
            saveFavorite={saveFavoriteSpy}
          />
        </Provider>
      );
    });

    afterEach(() => {
      component = null;
      emitSpy = null;
      saveFavoriteSpy = null;
    });

    it('renders a sidebar size toggle', () => {
      const buttonComponent = component.find('[data-test-id="toggle-sidebar"]');
      expect(buttonComponent).to.be.present();
      expect(buttonComponent.find('.fa-caret-left')).to.be.present;
    });

    it('renders the SidebarInstance component', () => {
      expect(component.find(SidebarInstance)).to.be.present();
    });

    it('renders the sidebar content', () => {
      expect(component.find(
        `.${styles['compass-sidebar-content']}`
      )).to.be.present();
    });
  });

  describe('when it is collapsed', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    afterEach(() => {
      component = null;
    });

    it('renders a sidebar size toggle', () => {
      const buttonComponent = component.find('[data-test-id="toggle-sidebar"]');
      expect(buttonComponent).to.be.present();
      expect(buttonComponent.find('.fa-caret-right')).to.be.present;
    });

    it('does not render the sidebar content', () => {
      expect(component.find(
        `.${styles['compass-sidebar-content']}`
      )).to.not.be.present();
    });
  });

  context('when it is clicked to collapse', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    it('sets the collapsed width to 36', () => {
      expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(36);
    });

    context('when it is expanded again', () => {
      beforeEach(() => {
        component.find('[data-test-id="toggle-sidebar"]').simulate('click');
        component.update();
      });

      it('resumes its previous width', () => {
        it('sets the collapsed width to 36', () => {
          expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(199);
        });
      });
    });
  });

  describe('resize actions', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <Provider store={SidebarStore}>
          <Sidebar
            updateAndSaveConnectionInfo={()=>{}}
            setConnectionIsCSFLEEnabled={() => {}}
            connectionInfo={connectionInfo}
          />
        </Provider>
      );
      component.find('[data-test-id="toggle-sidebar"]').simulate('click');
      component.update();
    });

    context('when expanded', () => {
      describe('when resize is called', () => {
        beforeEach(() => {
          const sidebarComponent = component.find(UnconnectedSidebar);
          sidebarComponent.instance().updateWidth(189);
          component.update();
        });

        it('updates the width', () => {
          expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(189);
        });

        context('when it hits the lower bound', () => {
          beforeEach(() => {
            const sidebarComponent = component.find(UnconnectedSidebar);
            sidebarComponent.instance().updateWidth(1);
            component.update();
          });

          it('collapses the sidebar', () => {
            expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(36);
          });
        });
      });
    });

    context('when collapsed', () => {
      beforeEach(() => {
        component.find('[data-test-id="toggle-sidebar"]').simulate('click');
        component.update();
      });

      describe('when resize is called', () => {
        beforeEach(() => {
          const sidebarComponent = component.find(UnconnectedSidebar);
          sidebarComponent.instance().updateWidth(55);
          component.update();
        });

        it('updates the width', () => {
          expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(36);
          expect(component.find('[type="range"]').at(0).prop('value')).to.equal(55);
        });

        context('when it hits the expand threshold bound', () => {
          beforeEach(() => {
            const sidebarComponent = component.find(UnconnectedSidebar);
            sidebarComponent.instance().updateWidth(171);
            component.update();
          });

          it('expands the sidebar', () => {
            expect(component.find('[data-test-id="compass-sidebar-panel"]').prop('style').width).to.equal(171);
          });
        });
      });
    });
  });
});
