import React from 'react';
import { expect } from 'chai';
import { spy, type SinonSpy } from 'sinon';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultipleConnectionSidebar } from './sidebar';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  ConnectionRepositoryContextProvider,
  ConnectionStorageContext,
  type ConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionRepository } from '@mongodb-js/connection-storage/main';

describe('Multiple Connections Sidebar Component', function () {
  const connectionStorage: Pick<
    typeof ConnectionStorage,
    'loadAll' | 'load' | 'save' | 'delete'
  > = {
    loadAll: spy(),
    load: spy(),
    save: spy(),
    delete: spy(),
  };

  function doRender() {
    return render(
      <ConnectionStorageContext.Provider
        value={connectionStorage as ConnectionStorage}
      >
        <ConnectionRepositoryContextProvider>
          <MultipleConnectionSidebar />
        </ConnectionRepositoryContextProvider>
      </ConnectionStorageContext.Provider>
    );
  }

  beforeEach(() => {
    connectionStorage.loadAll.reset();
    connectionStorage.load.reset();
    connectionStorage.save.reset();
    connectionStorage.delete.reset();
  });

  describe('', function () {});
});
