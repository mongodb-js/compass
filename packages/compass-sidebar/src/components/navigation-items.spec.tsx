import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules';

import { NavigationItems } from './navigation-items';

function renderNavigationItems(
  props?: Partial<React.ComponentProps<typeof NavigationItems>>
) {
  const store = createStore(reducer, applyMiddleware(thunk));
  return render(
    <Provider store={store}>
      <NavigationItems
        isExpanded
        onAction={() => {
          /* noop */
        }}
        showPerformanceItem={false}
        showCreateDatabaseAction={true}
        onFilterChange={() => {
          /* noop */
        }}
        currentLocation={null}
        currentNamespace={null}
        {...props}
      />
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
});
