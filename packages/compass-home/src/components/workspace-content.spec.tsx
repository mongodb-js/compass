import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import AppRegistryContext from '../contexts/app-registry-context';
import WorkspaceContent from './workspace-content';

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

describe('WorkspaceContent [Component]', function () {
  let testAppRegistry: AppRegistry;
  beforeEach(function () {
    testAppRegistry = new AppRegistry();

    ['Collection.Workspace', 'Database.Workspace', 'Instance.Workspace'].map(
      (name) => testAppRegistry.registerComponent(name, getComponent(name))
    );
    testAppRegistry.onActivated();
  });

  afterEach(function () {
    testAppRegistry = null;
    cleanup();
  });

  describe('namespace is unset', function () {
    beforeEach(function () {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <WorkspaceContent namespace={{ database: '', collection: '' }} />
        </AppRegistryContext.Provider>
      );
    });

    it('renders content correctly', function () {
      expect(screen.getByTestId('test-Instance.Workspace')).to.be.visible;
      expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
      expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
    });
  });

  describe('namespace has a db', function () {
    beforeEach(function () {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <WorkspaceContent namespace={{ database: 'db', collection: '' }} />
        </AppRegistryContext.Provider>
      );
    });

    it('renders content correctly', function () {
      expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
      expect(screen.getByTestId('test-Database.Workspace')).to.be.visible;
      expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
    });
  });

  describe('namespace has db and collection', function () {
    beforeEach(function () {
      render(
        <AppRegistryContext.Provider value={testAppRegistry}>
          <WorkspaceContent namespace={{ database: 'db', collection: 'col' }} />
        </AppRegistryContext.Provider>
      );
    });

    it('renders content correctly', function () {
      expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
      expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
      expect(screen.getByTestId('test-Collection.Workspace')).to.be.visible;
    });
  });
});
