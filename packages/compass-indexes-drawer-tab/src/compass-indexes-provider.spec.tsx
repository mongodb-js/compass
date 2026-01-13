import React from 'react';
import {
  render,
  renderHook,
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import {
  CompassIndexesDrawerProvider,
  IndexesDrawerProvider,
  useIndexesDrawerActions,
  useIndexesDrawerContext,
  INDEXES_DRAWER_ID,
  type IndexesDrawerContextType,
} from './compass-indexes-provider';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';
import { CompassIndexesDrawer } from './compass-indexes-drawer';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { WorkspaceTab } from '@mongodb-js/workspace-info';
import type { CollectionMetadata } from 'mongodb-collection-model';

function createMockProvider() {
  return CompassIndexesDrawerProvider.withMockServices({
    logger: createNoopLogger(),
  });
}

// Mock workspace for Collection type
const mockCollectionWorkspace: WorkspaceTab = {
  type: 'Collection',
  namespace: 'test.collection',
  connectionId: 'test-connection',
  id: 'test-workspace-id',
} as WorkspaceTab;

const GlobalStateSetup: React.FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => {
  const {
    useSyncIndexesDrawerGlobalState,
  } = require('./indexes-drawer-global-state');
  useSyncIndexesDrawerGlobalState('activeWorkspace', mockCollectionWorkspace);
  return <>{children}</>;
};

// Test component that renders CompassIndexesDrawerProvider with children
const TestComponent: React.FunctionComponent<{
  autoOpen?: boolean;
  initialState?: Partial<IndexesDrawerContextType>;
}> = ({ autoOpen, initialState }) => {
  const MockedProvider = createMockProvider();

  return (
    <DrawerContentProvider>
      {/* Breaking this rule is fine while none of the tests try to re-render the content */}
      {/* eslint-disable-next-line react-hooks/static-components */}
      <MockedProvider>
        <IndexesDrawerProvider initialState={initialState}>
          <GlobalStateSetup>
            <DrawerAnchor>
              <div data-testid="provider-children">Provider children</div>
              <CompassIndexesDrawer autoOpen={autoOpen} />
            </DrawerAnchor>
          </GlobalStateSetup>
        </IndexesDrawerProvider>
      </MockedProvider>
    </DrawerContentProvider>
  );
};

describe('useIndexesDrawerActions', function () {
  const createWrapper = () => {
    function TestWrapper({ children }: { children: React.ReactNode }) {
      const MockedProvider = createMockProvider();

      return (
        <DrawerContentProvider>
          {/* Breaking this rule is fine while none of the tests try to re-render the content */}
          {/* eslint-disable-next-line react-hooks/static-components */}
          <MockedProvider>
            <IndexesDrawerProvider>{children}</IndexesDrawerProvider>
          </MockedProvider>
        </DrawerContentProvider>
      );
    }
    return TestWrapper;
  };

  it('returns mostly empty object when feature flag is disabled', function () {
    const { result } = renderHook(() => useIndexesDrawerActions(), {
      wrapper: createWrapper(),
      preferences: {
        enableSearchActivationProgramP1: false,
      },
    });

    expect(result.current).to.have.keys(['getIsIndexesDrawerEnabled']);
    expect(result.current.getIsIndexesDrawerEnabled()).to.be.false;
  });

  it('returns actions when feature flag is enabled', function () {
    const { result } = renderHook(() => useIndexesDrawerActions(), {
      wrapper: createWrapper(),
      preferences: {
        enableSearchActivationProgramP1: true,
      },
    });

    expect(Object.keys(result.current)).to.have.length.greaterThan(1);
    expect(result.current.openIndexesListPage).to.be.a('function');
    expect(result.current.openCreateSearchIndexPage).to.be.a('function');
    expect(result.current.openEditSearchIndexPage).to.be.a('function');
    expect(result.current.getIsIndexesDrawerEnabled()).to.be.true;
  });
});

describe('useIndexesDrawerContext', function () {
  it('returns null when used outside of provider', function () {
    const { result } = renderHook(() => useIndexesDrawerContext());
    expect(result.current).to.be.null;
  });

  it('returns drawer state when used inside provider', function () {
    const { result } = renderHook(() => useIndexesDrawerContext(), {
      wrapper: ({ children }) => (
        <IndexesDrawerProvider
          initialState={{
            currentPage: 'indexes-list',
          }}
        >
          {children}
        </IndexesDrawerProvider>
      ),
    });

    expect(result.current).to.include({
      currentPage: 'indexes-list',
      currentIndexName: null,
    });
  });
});

describe('CompassIndexesDrawerProvider', function () {
  it('always renders children', function () {
    render(<TestComponent />, {
      preferences: {
        enableSearchActivationProgramP1: true,
      },
    });

    expect(screen.getByTestId('provider-children')).to.exist;
  });

  describe('disabling the Indexes Drawer', function () {
    it('does not render indexes drawer when feature flag is disabled', function () {
      render(<TestComponent />, {
        preferences: {
          enableSearchActivationProgramP1: false,
        },
      });

      expect(screen.getByTestId('provider-children')).to.exist;
      expect(screen.queryByLabelText('Indexes')).to.not.exist;
    });
  });

  describe('drawer state management', function () {
    it('initializes with default state when no initial state provided', function () {
      const { result } = renderHook(() => useIndexesDrawerContext(), {
        wrapper: ({ children }) => (
          <IndexesDrawerProvider>{children}</IndexesDrawerProvider>
        ),
      });

      expect(result.current).to.deep.equal({
        currentPage: 'indexes-list',
        currentIndexName: null,
      });
    });

    it('initializes with provided initial state', function () {
      const { result } = renderHook(() => useIndexesDrawerContext(), {
        wrapper: ({ children }) => (
          <IndexesDrawerProvider
            initialState={{
              currentPage: 'create-search-index',
            }}
          >
            {children}
          </IndexesDrawerProvider>
        ),
      });

      expect(result.current).to.include({
        currentPage: 'create-search-index',
      });
    });
  });

  describe('drawer actions', function () {
    it('openIndexesListPage updates state and opens drawer', async function () {
      const MockedProvider = createMockProvider();

      const TestActionComponent = () => {
        const { openIndexesListPage } = useIndexesDrawerActions();
        const state = useIndexesDrawerContext();

        return (
          <div>
            <button
              onClick={() => openIndexesListPage?.()}
              data-testid="open-list-button"
            >
              Open List
            </button>
            <div data-testid="page">{state?.currentPage}</div>
          </div>
        );
      };

      render(
        <DrawerContentProvider>
          <MockedProvider>
            <IndexesDrawerProvider>
              <TestActionComponent />
            </IndexesDrawerProvider>
          </MockedProvider>
        </DrawerContentProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      const button = screen.getByTestId('open-list-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('page')).to.have.text('indexes-list');
      });
    });

    it('openCreateSearchIndexPage updates state and opens drawer', async function () {
      const MockedProvider = createMockProvider();

      const TestActionComponent = () => {
        const { openCreateSearchIndexPage } = useIndexesDrawerActions();
        const state = useIndexesDrawerContext();

        return (
          <div>
            <button
              onClick={() => openCreateSearchIndexPage?.()}
              data-testid="open-create-button"
            >
              Open Create
            </button>
            <div data-testid="page">{state?.currentPage}</div>
          </div>
        );
      };

      render(
        <DrawerContentProvider>
          <MockedProvider>
            <IndexesDrawerProvider>
              <TestActionComponent />
            </IndexesDrawerProvider>
          </MockedProvider>
        </DrawerContentProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      const button = screen.getByTestId('open-create-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('page')).to.have.text('create-search-index');
      });
    });

    it('openEditSearchIndexPage updates state with index name and opens drawer', async function () {
      const MockedProvider = createMockProvider();

      const TestActionComponent = () => {
        const { openEditSearchIndexPage } = useIndexesDrawerActions();
        const state = useIndexesDrawerContext();

        return (
          <div>
            <button
              onClick={() => openEditSearchIndexPage?.('my-search-index')}
              data-testid="open-edit-button"
            >
              Open Edit
            </button>
            <div data-testid="page">{state?.currentPage}</div>
            <div data-testid="index-name">
              {state?.currentIndexName || 'none'}
            </div>
          </div>
        );
      };

      render(
        <DrawerContentProvider>
          <MockedProvider>
            <IndexesDrawerProvider>
              <TestActionComponent />
            </IndexesDrawerProvider>
          </MockedProvider>
        </DrawerContentProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      const button = screen.getByTestId('open-edit-button');
      userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('page')).to.have.text('edit-search-index');
        expect(screen.getByTestId('index-name')).to.have.text(
          'my-search-index'
        );
      });
    });
  });
});

describe('CompassIndexesDrawer', function () {
  before(function () {
    // TODO(COMPASS-9618): skip in electron runtime for now, drawer has issues rendering
    if ((process as any).type === 'renderer') {
      this.skip();
    }
  });

  describe('rendering behavior', function () {
    it('displays the drawer content when opened', async function () {
      render(
        <TestComponent
          autoOpen={true}
          initialState={{
            currentPage: 'indexes-list',
          }}
        />,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });
    });

    it('displays indexes-list page by default', async function () {
      render(
        <TestComponent
          autoOpen={true}
          initialState={{
            currentPage: 'indexes-list',
          }}
        />,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      await waitFor(() => {
        expect(screen.getByText('Indexes')).to.exist;
      });
    });

    it('does not render when feature flag is disabled', function () {
      render(<TestComponent autoOpen={true} />, {
        preferences: {
          enableSearchActivationProgramP1: false,
        },
      });

      expect(screen.queryByText('Indexes')).to.not.exist;
    });
  });
});
