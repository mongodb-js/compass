import React from 'react';
import {
  render,
  renderHook,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import {
  IndexesDrawerProvider,
  useIndexesDrawerActions,
  useIndexesDrawerContext,
  type IndexesDrawerContextType,
} from './compass-indexes-drawer-provider';
import { CompassIndexesDrawerPlugin } from './compass-indexes-drawer';
import { expect } from 'chai';
import {
  DrawerAnchor,
  DrawerContentProvider,
} from '@mongodb-js/compass-components';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { WorkspacesServiceProvider } from '@mongodb-js/compass-workspaces/provider';
import type { WorkspaceTab } from '@mongodb-js/workspace-info';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';

function createMockProvider(preferences?: Record<string, any>) {
  const mockDataService = {
    indexes: () => Promise.resolve([]),
    isConnected: () => true,
    updateCollection: () => Promise.resolve({}),
    createIndex: () => Promise.resolve('ok'),
    dropIndex: () => Promise.resolve({}),
    getSearchIndexes: () => Promise.resolve([]),
    createSearchIndex: () => Promise.resolve('new-id'),
    updateSearchIndex: () => Promise.resolve(),
    dropSearchIndex: () => Promise.resolve(),
    collectionInfo: () => Promise.resolve(null),
    collectionStats: () =>
      Promise.resolve({
        avg_document_size: 0,
        count: 0,
        database: 'test',
        document_count: 0,
        free_storage_size: 0,
        index_count: 0,
        index_size: 0,
        name: 'collection',
        ns: 'test.collection',
        storage_size: 0,
      }),
    listCollections: () => Promise.resolve([]),
    sample: () => Promise.resolve([]),
    isListSearchIndexesSupported: () => Promise.resolve(true),
  };

  const mockInstance = {
    isWritable: true,
    description: 'test instance',
    on: () => {},
    off: () => {},
    removeListener: () => {},
  };

  const mockCollection = {
    status: 'ready',
    on: () => {},
    off: () => {},
    removeListener: () => {},
    toJSON: () => ({
      _id: 'test.collection',
      type: 'collection',
      readonly: false,
    }),
  };

  const mockConnectionInfoRef = {
    current: {
      id: 'test-connection-id',
    },
  };

  const mockAtlasService = {};

  const mockPreferences = {
    getPreferences: () => ({
      enableRollingIndexes: false,
      enableSearchActivationProgramP1: false,
      ...preferences,
    }),
  };

  return CompassIndexesDrawerPlugin.withMockServices({
    dataService: mockDataService as any,
    connectionInfoRef: mockConnectionInfoRef as any,
    instance: mockInstance as any,
    logger: createNoopLogger(),
    track: createNoopTrack(),
    collection: mockCollection as any,
    atlasService: mockAtlasService as any,
    preferences: mockPreferences as any,
  });
}

function createMockWorkspaceService(activeWorkspace?: WorkspaceTab | null) {
  return {
    getActiveWorkspace: () => activeWorkspace ?? null,
  } as any;
}

function createWrapper(preferences?: Record<string, any>) {
  function TestWrapper({ children }: { children: React.ReactNode }) {
    return <IndexesDrawerProvider>{children}</IndexesDrawerProvider>;
  }
  return TestWrapper;
}

describe('useIndexesDrawerActions', function () {
  it('provides getIsIndexesDrawerEnabled action', function () {
    const { result } = renderHook(() => useIndexesDrawerActions(), {
      wrapper: createWrapper({
        enableSearchActivationProgramP1: true,
      }),
    });

    expect(result.current).to.not.be.null;
    expect(result.current).to.have.property('getIsIndexesDrawerEnabled');
    expect(result.current.getIsIndexesDrawerEnabled).to.be.a('function');
  });
});

describe('useIndexesDrawerContext', function () {
  it('returns the drawer context', function () {
    const { result } = renderHook(() => useIndexesDrawerContext(), {
      wrapper: ({ children }) => (
        <IndexesDrawerProvider>{children}</IndexesDrawerProvider>
      ),
    });

    expect(result.current).to.include({
      currentPage: 'indexes-list',
      currentIndexName: null,
    });
  });
});

describe('CompassIndexesDrawerPlugin', function () {
  it('always renders children', function () {
    render(
      <IndexesDrawerProvider>
        <div data-testid="provider-children">Provider children</div>
      </IndexesDrawerProvider>,
      {
        preferences: {
          enableSearchActivationProgramP1: true,
        },
      }
    );

    expect(screen.getByTestId('provider-children')).to.exist;
  });

  describe('disabling the Indexes Drawer', function () {
    it('does not render indexes drawer when feature flag is disabled', function () {
      render(
        <IndexesDrawerProvider>
          <div data-testid="provider-children">Provider children</div>
        </IndexesDrawerProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: false,
          },
        }
      );

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
      const initialState = {
        currentPage: 'indexes-list' as const,
        currentIndexName: 'test-index',
      };

      const { result } = renderHook(() => useIndexesDrawerContext(), {
        wrapper: ({ children }) => (
          <IndexesDrawerProvider initialState={initialState}>
            {children}
          </IndexesDrawerProvider>
        ),
      });

      expect(result.current).to.deep.equal(initialState);
    });
  });

  describe('drawer actions', function () {
    it('getIsIndexesDrawerEnabled returns feature flag state', function () {
      const { result } = renderHook(() => useIndexesDrawerActions(), {
        wrapper: createWrapper(),
      });

      const isEnabled = result.current.getIsIndexesDrawerEnabled();
      expect(isEnabled).to.be.a('boolean');
    });
  });

  describe('rendering behavior', function () {
    before(function () {
      // TODO(COMPASS-9618): skip in electron runtime for now, drawer has issues rendering
      if ((process as any).type === 'renderer') {
        this.skip();
      }
    });

    it('displays the drawer content when opened in a collection context', async function () {
      const MockedProvider = createMockProvider({
        enableSearchActivationProgramP1: true,
      });
      const mockWorkspace = createMockWorkspaceService({
        type: 'Collection',
        namespace: 'test.collection',
      } as WorkspaceTab);

      const mockPluginProps = {
        namespace: 'test.collection',
        serverVersion: '6.0.0',
        isReadonly: false,
        isSearchIndexesSupported: true,
      };

      render(
        <WorkspacesServiceProvider value={mockWorkspace}>
          <DrawerAnchor />
          <MockedProvider {...mockPluginProps}>
            <CompassIndexesDrawerPlugin {...mockPluginProps} />
          </MockedProvider>
        </WorkspacesServiceProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      // Click the Indexes button to open the drawer
      const indexesButton = screen.getByLabelText('Indexes');
      userEvent.click(indexesButton);

      await waitFor(() => {
        expect(screen.getByText(/Indexes list for/)).to.exist;
      });
    });

    it('does not render when feature flag is disabled', function () {
      const MockedProvider = createMockProvider({
        enableSearchActivationProgramP1: false,
      });
      const mockWorkspace = createMockWorkspaceService({
        type: 'Collection',
        namespace: 'test.collection',
      } as WorkspaceTab);

      const mockPluginProps = {
        namespace: 'test.collection',
        serverVersion: '6.0.0',
        isReadonly: false,
        isSearchIndexesSupported: true,
      };

      render(
        <WorkspacesServiceProvider value={mockWorkspace}>
          <MockedProvider {...mockPluginProps}>
            <DrawerAnchor>
              <CompassIndexesDrawerPlugin {...mockPluginProps} />
            </DrawerAnchor>
          </MockedProvider>
        </WorkspacesServiceProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: false,
          },
        }
      );

      expect(screen.queryByText('Indexes')).to.not.exist;
    });

    it('does not render when not in a collection context', function () {
      const MockedProvider = createMockProvider({
        enableSearchActivationProgramP1: true,
      });
      const mockPluginProps = {
        namespace: 'test.collection',
        serverVersion: '6.0.0',
        isReadonly: false,
        isSearchIndexesSupported: true,
      };
      const mockWorkspace = createMockWorkspaceService(null);

      render(
        <WorkspacesServiceProvider value={mockWorkspace}>
          <MockedProvider {...mockPluginProps}>
            <DrawerAnchor>
              <CompassIndexesDrawerPlugin {...mockPluginProps} />
            </DrawerAnchor>
          </MockedProvider>
        </WorkspacesServiceProvider>,
        {
          preferences: {
            enableSearchActivationProgramP1: true,
          },
        }
      );

      expect(screen.queryByText('Indexes')).to.not.exist;
    });
  });
});
