import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import InstanceLoadedStatus from '../constants/instance-loaded-status';

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
      (name) =>
        testAppRegistry.registerRole(name, {
          component: getComponent(name),
        })
    );
    testAppRegistry.onActivated();
  });

  afterEach(function () {
    testAppRegistry = null;
  });

  describe('instanceLoadingStatus is loading', function () {
    beforeEach(function () {
      render(
        <WorkspaceContent
          appRegistry={testAppRegistry}
          instanceLoadingStatus={InstanceLoadedStatus.LOADING}
          errorLoadingInstanceMessage={null}
          isDataLake={false}
          namespace={{ database: '', collection: '' }}
        />
      );
    });
    describe('instance status is loading', function () {
      it('renders none of the items', function () {
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
      });
    });
  });

  describe('instance status is error', function () {
    beforeEach(function () {
      render(
        <WorkspaceContent
          appRegistry={testAppRegistry}
          instanceLoadingStatus={InstanceLoadedStatus.ERROR}
          errorLoadingInstanceMessage="testing the error"
          isDataLake={false}
          namespace={{ database: '', collection: '' }}
        />
      );
    });

    it('renders content correctly', function () {
      expect(screen.getByRole('alert')).to.be.visible;
      expect(screen.getByRole('alert').textContent).to.be.equal(
        'An error occurred while loading navigation: testing the error'
      );
      expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
      expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
      expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
    });
  });
  describe('instance status is loaded', function () {
    describe('namespace is unset', function () {
      beforeEach(function () {
        render(
          <WorkspaceContent
            appRegistry={testAppRegistry}
            instanceLoadingStatus={InstanceLoadedStatus.LOADED}
            errorLoadingInstanceMessage={null}
            isDataLake={false}
            namespace={{ database: '', collection: '' }}
          />
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
          <WorkspaceContent
            appRegistry={testAppRegistry}
            instanceLoadingStatus={InstanceLoadedStatus.LOADED}
            errorLoadingInstanceMessage={null}
            isDataLake={false}
            namespace={{ database: 'db', collection: '' }}
          />
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
          <WorkspaceContent
            appRegistry={testAppRegistry}
            instanceLoadingStatus={InstanceLoadedStatus.LOADED}
            errorLoadingInstanceMessage={null}
            isDataLake={false}
            namespace={{ database: 'db', collection: 'col' }}
          />
        );
      });

      it('renders content correctly', function () {
        expect(screen.queryByTestId('test-Instance.Workspace')).to.not.exist;
        expect(screen.queryByTestId('test-Database.Workspace')).to.not.exist;
        expect(screen.getByTestId('test-Collection.Workspace')).to.be.visible;
      });
    });
  });
});
