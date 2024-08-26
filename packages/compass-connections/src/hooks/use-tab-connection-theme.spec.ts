import { expect } from 'chai';
import { useTabConnectionTheme } from '../provider';
import { renderHookWithConnections } from '../test';

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

const CONNECTION_INFO_INVALID_COLOR = {
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
  describe('when a connection does not exist', function () {
    it('should not return a theme', function () {
      const { result } = renderHookWithConnections(useTabConnectionTheme, {
        preferences: { enableNewMultipleConnectionSystem: true },
      });

      expect(result.current.getThemeOf('NON_EXISTING')).to.be.undefined;
    });
  });

  describe('when a connection exists', function () {
    it('should return the theme with the connection colors', function () {
      const { result } = renderHookWithConnections(useTabConnectionTheme, {
        preferences: { enableNewMultipleConnectionSystem: true },
        connections: [CONNECTION_INFO],
      });

      expect(result.current.getThemeOf(CONNECTION_INFO.id)).to.deep.equal({
        '&:focus-visible': {
          '--workspace-tab-border-color': '#016BF8',
          '--workspace-tab-selected-color': '#016BF8',
        },
        '--workspace-tab-background-color': '#D5EFFF',
        '--workspace-tab-border-color': '#E8EDEB',
        '--workspace-tab-color': '#5C6C75',
        '--workspace-tab-selected-background-color': '#FFFFFF',
        '--workspace-tab-selected-color': '#1C2D38',
        '--workspace-tab-selected-top-border-color': '#C2E5FF',
        '--workspace-tab-top-border-color': '#D5EFFF',
      });
    });

    it('should not return a theme when there is no color', function () {
      const { result } = renderHookWithConnections(useTabConnectionTheme, {
        preferences: { enableNewMultipleConnectionSystem: true },
        connections: [CONNECTION_INFO_NO_COLOR],
      });

      expect(result.current.getThemeOf(CONNECTION_INFO_NO_COLOR.id)).to.equal(
        undefined
      );
    });

    it('should not return a theme when the color is invalid', function () {
      const { result } = renderHookWithConnections(useTabConnectionTheme, {
        preferences: { enableNewMultipleConnectionSystem: true },
        connections: [CONNECTION_INFO_INVALID_COLOR],
      });

      expect(
        result.current.getThemeOf(CONNECTION_INFO_INVALID_COLOR.id)
      ).to.equal(undefined);
    });
  });
});
