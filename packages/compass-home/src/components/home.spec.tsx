import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import Home from '.';

const getComponent = (name: string) => {
  class TestComponent extends React.Component {
    render() {
      return React.createElement(
        'div',
        {
          'data-testid': `test-${name}`,
        },
        name
      );
    }
  }
  return TestComponent;
};

describe('Home [Component]', function () {
  let testAppRegistry: AppRegistry;
  beforeEach(function () {
    testAppRegistry = new AppRegistry();
    ['Sidebar.Component', 'Global.Shell'].map((name) =>
      testAppRegistry.registerComponent(name, getComponent(name))
    );

    [
      'Collection.Workspace',
      'Database.Workspace',
      'Instance.Workspace',
      'Find',
      'Global.Modal',
      'Global.Warning',
      'Application.Connect',
    ].map((name) =>
      testAppRegistry.registerRole(name, {
        component: getComponent(name),
      })
    );
    testAppRegistry.onActivated();
  });

  // afterEach(function () {
  //   testAppRegistry = null;
  // });

  describe('is not connected', function () {
    beforeEach(function () {
      render(<Home appRegistry={testAppRegistry} />);
    });

    it('renders the connect screen', function () {
      expect(screen.getByTestId('test-Application.Connect')).to.be.visible;
    });

    it('does not render the sidebar', function () {
      expect(screen.queryByTestId('test-Sidebar.Component')).to.not.exist;
    });
  });

  describe('is connected', function () {
    beforeEach(function () {
      render(<Home appRegistry={testAppRegistry} />);
      testAppRegistry.emit('data-service-connected', null, 'not real ds');
    });
    describe('UI status is loading', function () {
      it('renders content correctly', function () {
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
      });
      it('renders the sidebar', function () {
        expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
      });
      it('renders the find', function () {
        expect(screen.getByTestId('test-Find')).to.be.visible;
      });
      it('renders the shell plugin', function () {
        expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
      });
      it('renders the global modal role', function () {
        expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
      });
    });

    describe('UI status is error', function () {
      beforeEach(function () {
        testAppRegistry.emit('instance-refreshed', {
          errorMessage: 'Test error message',
        });
      });

      it('renders content correctly', function () {
        expect(screen.getByRole('alert')).to.be.visible;
        expect(screen.getByRole('alert').textContent).to.be.equal(
          'An error occurred while loading navigation: Test error message'
        );
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
      });
      it('renders the sidebar', function () {
        expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
      });
      it('renders the find', function () {
        expect(screen.getByTestId('test-Find')).to.be.visible;
      });
      it('renders the global modal role', function () {
        expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
      });
      it('renders the shell plugin', function () {
        expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
      });
    });
    describe('UI status is complete', function () {
      beforeEach(function () {
        testAppRegistry.emit('instance-refreshed', {});
      });

      describe('namespace is unset', function () {
        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Instance.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
      });

      describe('on `select-namespace` only DB', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-namespace', { namespace: 'db' });
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Database.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
      });

      describe('on `select-database`', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-database', 'db');
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Database.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
      });

      describe('on `select-namespace` with db and coll', function () {
        beforeEach(function () {
          testAppRegistry.emit('select-namespace', { namespace: 'db.col' });
        });

        it('renders content correctly', function () {
          expect(screen.getByTestId('test-Collection.Workspace')).to.be.visible;
        });
        it('renders the sidebar', function () {
          expect(screen.getByTestId('test-Sidebar.Component')).to.be.visible;
        });
        it('renders the find', function () {
          expect(screen.getByTestId('test-Find')).to.be.visible;
        });
        it('renders the global modal role', function () {
          expect(screen.getByTestId('test-Global.Modal')).to.be.visible;
        });
        it('renders the shell plugin', function () {
          expect(screen.getByTestId('test-Global.Shell')).to.be.visible;
        });
      });

      describe('on `data-service-disconnected`', function () {
        beforeEach(function () {
          testAppRegistry.emit('data-service-disconnected');
        });

        it('renders the connect screen', function () {
          expect(screen.getByTestId('test-Application.Connect')).to.be.visible;
        });

        it('does not render the sidebar', function () {
          expect(screen.queryByTestId('test-Sidebar.Component')).to.not.exist;
        });
      });
    });
  });

  describe('when rendered', function () {
    beforeEach(function () {
      render(<Home appRegistry={testAppRegistry} />);
    });

    it('adds all the listeners', function () {
      expect(testAppRegistry.listeners('instance-refreshed')).to.not.deep.equal(
        []
      );
      expect(
        testAppRegistry.listeners('data-service-connected')
      ).to.not.deep.equal([]);
      expect(
        testAppRegistry.listeners('data-service-disconnected')
      ).to.not.deep.equal([]);
      expect(testAppRegistry.listeners('select-database')).to.not.deep.equal(
        []
      );
      expect(testAppRegistry.listeners('select-namespace')).to.not.deep.equal(
        []
      );
      expect(testAppRegistry.listeners('select-instance')).to.not.deep.equal(
        []
      );
      expect(
        testAppRegistry.listeners('open-namespace-in-new-tab')
      ).to.not.deep.equal([]);
      expect(
        testAppRegistry.listeners('all-collection-tabs-closed')
      ).to.not.deep.equal([]);
    });
  });

  describe('on dismount', function () {
    beforeEach(function () {
      const { unmount } = render(<Home appRegistry={testAppRegistry} />);
      unmount();
    });

    it('clears up all the listeners', function () {
      expect(testAppRegistry.listeners('instance-refreshed')).to.deep.equal([]);
      expect(testAppRegistry.listeners('data-service-connected')).to.deep.equal(
        []
      );
      expect(
        testAppRegistry.listeners('data-service-disconnected')
      ).to.deep.equal([]);
      expect(testAppRegistry.listeners('select-database')).to.deep.equal([]);
      expect(testAppRegistry.listeners('select-namespace')).to.deep.equal([]);
      expect(testAppRegistry.listeners('select-instance')).to.deep.equal([]);
      expect(
        testAppRegistry.listeners('open-namespace-in-new-tab')
      ).to.deep.equal([]);
      expect(
        testAppRegistry.listeners('all-collection-tabs-closed')
      ).to.deep.equal([]);
    });
  });
});
