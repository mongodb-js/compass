import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { globalAppRegistry, AppRegistryProvider } from 'hadron-app-registry';
import { MongoDBInstanceProvider } from '@mongodb-js/compass-app-stores/provider';
import { DataServiceProvider } from 'mongodb-data-service/provider';
import WorkspaceContent from './workspace-content';

function renderWorkspaceContent(
  props: React.ComponentProps<typeof WorkspaceContent>
) {
  return render(
    <DataServiceProvider value={{} as any}>
      <MongoDBInstanceProvider
        value={{ dataLake: {}, on() {}, removeListener() {} } as any}
      >
        <AppRegistryProvider>
          <WorkspaceContent {...props} />
        </AppRegistryProvider>
      </MongoDBInstanceProvider>
    </DataServiceProvider>
  );
}

describe('WorkspaceContent [Component]', function () {
  before(function () {
    globalAppRegistry.onActivated();
  });

  afterEach(cleanup);

  describe('namespace is unset', function () {
    beforeEach(function () {
      renderWorkspaceContent({ namespace: { database: '', collection: '' } });
    });

    it('renders content correctly', function () {
      expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
    });
  });

  describe('namespace has a db', function () {
    beforeEach(function () {
      renderWorkspaceContent({ namespace: { database: 'db', collection: '' } });
    });

    it('renders content correctly', function () {
      expect(screen.queryByTestId('test-Collection.Workspace')).to.not.exist;
    });
  });
});
