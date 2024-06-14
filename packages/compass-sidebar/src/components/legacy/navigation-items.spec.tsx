import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../../modules';

import { NavigationItems } from './navigation-items';
import { WorkspacesProvider } from '@mongodb-js/compass-workspaces';

const CONNECTION_ID = 'webscale';

function renderNavigationItems(
  props?: Partial<React.ComponentProps<typeof NavigationItems>>
) {
  const store = createStore(reducer, applyMiddleware(thunk));
  return render(
    <Provider store={store}>
      <WorkspacesProvider
        value={[
          { name: 'My Queries', component: () => null },
          { name: 'Performance', component: () => null },
        ]}
      >
        <NavigationItems
          isReady
          connectionInfo={{ id: CONNECTION_ID } as any}
          onAction={() => {
            /* noop */
          }}
          showCreateDatabaseAction={true}
          isPerformanceTabSupported={true}
          activeWorkspace={null}
          {...props}
        />
      </WorkspacesProvider>
    </Provider>
  );
}

const createDatabaseText = 'Create database';
const refreshCTAText = 'Refresh databases';

describe('NavigationItems [Component]', function () {
  afterEach(cleanup);

  describe('when rendered', function () {
    it('renders the create database button', function () {
      renderNavigationItems();
      expect(screen.getByLabelText(createDatabaseText)).to.be.visible;
    });

    it('renders the refresh databases button', function () {
      renderNavigationItems();
      expect(screen.getByLabelText(refreshCTAText)).to.be.visible;
    });
  });

  describe('when rendered read only', function () {
    it('does not render the create database button', function () {
      renderNavigationItems({
        showCreateDatabaseAction: false,
      });
      expect(screen.queryByLabelText(createDatabaseText)).to.not.exist;
    });
  });

  describe('when performance tab is not supported', function () {
    it('renders disabled "Performance" navigation item', function () {
      renderNavigationItems({
        isPerformanceTabSupported: false,
      });

      expect(screen.getByRole('button', { name: 'Performance' })).to.exist;
      expect(
        screen.getByRole('button', { name: 'Performance' })
      ).to.have.attribute('aria-disabled', 'true');
    });
  });
});
