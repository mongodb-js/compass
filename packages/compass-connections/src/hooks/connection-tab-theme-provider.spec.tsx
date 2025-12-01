import React from 'react';
import { expect } from 'chai';
import { useTabTheme } from '@mongodb-js/compass-components/src/components/workspace-tabs/use-tab-theme';
import { render } from '@mongodb-js/testing-library-compass';
import { ConnectionThemeProvider } from './connection-tab-theme-provider';

const CONNECTION_INFO = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    color: 'color3',
    name: 'my kingdom for a hook',
  },
};

const CONNECTION_INFO_NO_COLOR = {
  id: '1234',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27017',
  },
  favorite: {
    name: 'look what is done cannot be now amended',
  },
};

describe('ConnectionThemeProvider', function () {
  describe('when a connection does not exist', function () {
    it('should not provide a theme to useTabTheme', function () {
      let capturedTheme: ReturnType<typeof useTabTheme> = undefined;

      const TestComponent = () => {
        // Doing this to test the value
        // eslint-disable-next-line react-hooks/globals
        capturedTheme = useTabTheme();
        return null;
      };

      render(
        <ConnectionThemeProvider connectionId="nonexistent-connection">
          <TestComponent />
        </ConnectionThemeProvider>,
        {
          connections: [CONNECTION_INFO],
        }
      );

      expect(capturedTheme).to.equal(undefined);
    });
  });

  describe('when a connection exists with a valid color', function () {
    it('should provide the correct theme to useTabTheme', function () {
      let capturedTheme: ReturnType<typeof useTabTheme> = undefined;

      const TestComponent = () => {
        // Doing this to test the value
        // eslint-disable-next-line react-hooks/globals
        capturedTheme = useTabTheme();
        return null;
      };

      render(
        <ConnectionThemeProvider connectionId={CONNECTION_INFO.id}>
          <TestComponent />
        </ConnectionThemeProvider>,
        {
          connections: [CONNECTION_INFO],
        }
      );

      expect(capturedTheme).to.have.property(
        '--workspace-tab-background-color',
        '#D5EFFF'
      );
      expect(capturedTheme).to.have.property(
        '--workspace-tab-top-border-color',
        '#D5EFFF'
      );
      expect(capturedTheme).to.have.property(
        '--workspace-tab-selected-top-border-color',
        '#C2E5FF'
      );
      expect(capturedTheme).to.have.deep.property('&:focus-visible');
    });
  });

  describe('when a connection exists without a color', function () {
    it('should not provide a theme to useTabTheme', function () {
      let capturedTheme: ReturnType<typeof useTabTheme> = undefined;

      const TestComponent = () => {
        // Doing this to test the value
        // eslint-disable-next-line react-hooks/globals
        capturedTheme = useTabTheme();
        return null;
      };

      render(
        <ConnectionThemeProvider connectionId={CONNECTION_INFO_NO_COLOR.id}>
          <TestComponent />
        </ConnectionThemeProvider>,
        {
          connections: [CONNECTION_INFO_NO_COLOR],
        }
      );

      expect(capturedTheme).to.equal(undefined);
    });
  });

  describe('when a connection exists with an invalid color', function () {
    it('should not provide a theme to useTabTheme', function () {
      let capturedTheme: ReturnType<typeof useTabTheme> = undefined;
      const INVALID_COLOR_CONNECTION = {
        id: '5678',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        favorite: {
          color: 'notavalidcolor',
          name: 'invalid color connection',
        },
      };

      const TestComponent = () => {
        // Doing this to test the value
        // eslint-disable-next-line react-hooks/globals
        capturedTheme = useTabTheme();
        return null;
      };

      render(
        <ConnectionThemeProvider connectionId={INVALID_COLOR_CONNECTION.id}>
          <TestComponent />
        </ConnectionThemeProvider>,
        {
          connections: [INVALID_COLOR_CONNECTION],
        }
      );

      expect(capturedTheme).to.equal(undefined);
    });
  });

  describe('when a connection color is updated', function () {
    it('should update the theme provided to useTabTheme', async function () {
      let capturedTheme: ReturnType<typeof useTabTheme> = undefined;
      const connection = {
        id: 'changeable-color',
        connectionOptions: {
          connectionString: 'mongodb://localhost:27017',
        },
        favorite: {
          color: 'color3', // Initial color
          name: 'changing colors',
        },
      };

      const TestComponent = () => {
        // Doing this to test the value
        // eslint-disable-next-line react-hooks/globals
        capturedTheme = useTabTheme();
        return <div>Theme consumer</div>;
      };

      const { rerender, connectionsStore } = render(
        <ConnectionThemeProvider connectionId={connection.id}>
          <TestComponent />
        </ConnectionThemeProvider>,
        {
          connections: [connection],
        }
      );

      // Initial theme should have color3 values
      expect(capturedTheme).to.not.equal(null);
      expect(capturedTheme).to.have.property(
        '--workspace-tab-background-color',
        '#D5EFFF'
      );

      // Update the connection color
      await connectionsStore.actions.saveEditedConnection({
        ...connection,
        favorite: {
          ...connection.favorite,
          color: 'color1', // Change to color1
        },
      });

      // Re-render to pick up the new color
      rerender(
        <ConnectionThemeProvider connectionId={connection.id}>
          <TestComponent />
        </ConnectionThemeProvider>
      );

      // Theme should have been updated with color1 values
      expect(capturedTheme).to.not.equal(null);
      // color1 should have a different background color than color3
      expect(capturedTheme)
        .to.have.property('--workspace-tab-background-color')
        .that.does.not.equal('#D5EFFF');
    });
  });
});
