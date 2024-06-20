import { expect } from 'chai';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useTabConnectionTheme } from '../provider';
import {
  type ConnectionStorage,
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

const CONNECTION_INFO: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    color: 'color3',
    name: 'my kingdom for a hook',
  },
};

const CONNECTION_INFO_NO_COLOR: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'look what is done cannot be now amended',
  },
};

const CONNECTION_INFO_INVALID_COLOR: ConnectionInfo = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    color: 'notacolorlol',
    name: 'what do I fear? myself?',
  },
};

describe('useTabConnectionTheme', function () {
  let renderHookWithContext: typeof renderHook;
  let mockStorage: ConnectionStorage;
  let preferencesAccess: PreferencesAccess;

  beforeEach(async function () {
    preferencesAccess = await createSandboxFromDefaultPreferences();
    await preferencesAccess.savePreferences({
      enableNewMultipleConnectionSystem: true,
    });

    mockStorage = new InMemoryConnectionStorage([CONNECTION_INFO]);
    renderHookWithContext = (callback, options) => {
      const wrapper: React.FC = ({ children }) =>
        createElement(PreferencesProvider, {
          value: preferencesAccess,
          children: createElement(ConnectionStorageProvider, {
            value: mockStorage,
            children,
          }),
        });
      return renderHook(callback, { wrapper, ...options });
    };
  });

  describe('when a connection does not exist', function () {
    it('should not return a theme', function () {
      const { result } = renderHookWithContext(() => {
        const { getThemeOf } = useTabConnectionTheme();
        return getThemeOf('NON_EXISTING');
      });

      expect(result.current).to.be.undefined;
    });
  });

  describe('when a connection exists', function () {
    it('should return the theme with the connection colors', async function () {
      const { result } = renderHookWithContext(() => {
        const { getThemeOf } = useTabConnectionTheme();
        return getThemeOf(CONNECTION_INFO.id);
      });

      await waitFor(() => {
        expect(result.current).to.deep.equal({
          '&:focus-visible': {
            '--workspace-tab-border-color': '#016BF8',
            '--workspace-tab-selected-color': '#016BF8',
          },
          '--workspace-tab-background-color': '#FFDFB5',
          '--workspace-tab-border-color': '#E8EDEB',
          '--workspace-tab-color': '#5C6C75',
          '--workspace-tab-selected-background-color': '#FFFFFF',
          '--workspace-tab-selected-border-color': '#FFD19A',
          '--workspace-tab-selected-color': '#1C2D38',
        });
      });
    });

    it('should not return a theme when there is no color', async function () {
      const { result } = renderHookWithContext(() => {
        const { getThemeOf } = useTabConnectionTheme();
        return getThemeOf(CONNECTION_INFO_NO_COLOR.id);
      });

      await waitFor(() => {
        expect(result.current).to.equal(undefined);
      });
    });

    it('should not return a theme when the color is invalid', async function () {
      const { result } = renderHookWithContext(() => {
        const { getThemeOf } = useTabConnectionTheme();
        return getThemeOf(CONNECTION_INFO_INVALID_COLOR.id);
      });

      await waitFor(() => {
        expect(result.current).to.equal(undefined);
      });
    });
  });
});
