import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

import SidebarStore from '../../../src/stores';
import Sidebar, { Sidebar as UnconnectedSidebar } from '../../../src/components/sidebar';
import SidebarInstance from '../../../src/components/sidebar-instance';
import styles from '../../../src/components/sidebar/sidebar.module.less';

describe('Sidebar [Component]', () => {
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
    const connectionModel = {
      connection: {
        authStrategy: 'MONGODB',
        isSrvRecord: false,
        readPreference: 'primaryPreferred',
        attributes: { hostanme: 'localhost' },
        isFavorite: true
      }
    };

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

            isCollapsed={false}

            connectionModel={connectionModel}
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
            onCollapse={() => {}}
            isDataLake={false}
            globalAppRegistryEmit={emitSpy}
            isGenuineMongoDB
            isGenuineMongoDBVisible={false}
            toggleIsGenuineMongoDBVisible={()=>{}}
            isModalVisible={false}
            openLink={() => {}}
            toggleIsCollapsed={() => {}}
            isDetailsExpanded={false}
            toggleIsDetailsExpanded={() => {}}
            detailsPlugins={[]}
            filterDatabases={() => {}}
            changeDatabases={() => {}}
            changeFilterRegex={() => {}}
            toggleIsModalVisible={()=>{}}
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
          <Sidebar
            store={SidebarStore}

            onCollapse={() => {}}
            isCollapsed
          />
        </Provider>
      );
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
      )).to.be.present();
    });
  });

  context('when it is clicked to collapse', () => {
    let sidebarComponent;
    let sizeSetTo;

    beforeEach(() => {
      sidebarComponent = new UnconnectedSidebar({
        isCollapsed: false,
        onCollapse: () => {},
        toggleIsCollapsed: () => {},
        globalAppRegistryEmit: () => {}
      });

      sidebarComponent.setState = (newState) => {
        sizeSetTo = newState.width;
      };
      sidebarComponent.toggleCollapsed(true);
    });

    afterEach(() => {
      sizeSetTo = null;
    });

    it('sets the collapsed width to 36', () => {
      expect(sizeSetTo).to.equal(36);
    });

    context('when it is expanded again', () => {
      beforeEach(() => {
        sidebarComponent.props.isCollapsed = true;
        sidebarComponent.toggleCollapsed();
      });

      it('resumes its previous width', () => {
        it('sets the collapsed width to 36', () => {
          expect(sizeSetTo).to.equal(199);
        });
      });
    });
  });

  describe('resize actions', () => {
    let sidebarComponent;
    let sizeSetTo;
    let toggleIsCollapsed;

    beforeEach(() => {
      toggleIsCollapsed = sinon.spy();
    });

    afterEach(() => {
      sizeSetTo = null;
      toggleIsCollapsed = null;
    });

    context('when expanded', () => {
      beforeEach(() => {
        sidebarComponent = new UnconnectedSidebar({
          isCollapsed: false,
          onCollapse: () => {},
          toggleIsCollapsed,
          globalAppRegistryEmit: () => {}
        });
        sidebarComponent.setState = (newState) => {
          sizeSetTo = newState.width;
        };
      });

      describe('when resize is called', () => {
        beforeEach(() => {
          sidebarComponent.handleResize(189);
        });

        it('updates the width', () => {
          expect(sizeSetTo).to.equal(189);
        });

        it('does not collapse the component', () => {
          expect(toggleIsCollapsed.called).to.equal(false);
        });

        context('when it hits the lower bound', () => {
          beforeEach(() => {
            sidebarComponent.handleResize(1);
          });

          it('collapses the sidebar', () => {
            expect(sizeSetTo).to.equal(1);
            expect(toggleIsCollapsed.called).to.equal(true);
          });
        });
      });
    });

    context('when collapsed', () => {
      beforeEach(() => {
        sidebarComponent = new UnconnectedSidebar({
          isCollapsed: true,
          onCollapse: () => {},
          toggleIsCollapsed,
          globalAppRegistryEmit: () => {}
        });
        sidebarComponent.setState = (newState) => {
          sizeSetTo = newState.width;
        };
      });

      describe('when resize is called', () => {
        beforeEach(() => {
          sidebarComponent.handleResize(55);
        });

        it('updates the width', () => {
          expect(sizeSetTo).to.equal(55);
        });

        it('does not expand the component', () => {
          expect(toggleIsCollapsed.called).to.equal(false);
        });

        context('when it hits the expand threshold bound', () => {
          beforeEach(() => {
            sidebarComponent.handleResize(171);
          });

          it('expands the sidebar', () => {
            expect(sizeSetTo).to.equal(171);
            expect(toggleIsCollapsed.called).to.equal(true);
          });
        });
      });
    });
  });
});
