import React, { useCallback, useContext, useRef, useState } from 'react';
import { ImportConnectionsModal } from './components/import-modal';
import { ExportConnectionsModal } from './components/export-modal';

type ConnectionImportExportService = {
  getHandlers(): {
    openConnectionImportModal(trackingProps?: Record<string, unknown>): void;
    openConnectionExportModal(trackingProps?: Record<string, unknown>): void;
  };
};

const ConnectionImportExportServiceContext =
  React.createContext<ConnectionImportExportService | null>(null);

export const ConnectionImportExportProvider: React.FC = ({ children }) => {
  const [importModalState, setImportModalState] = useState<{
    opened: boolean;
    // trackingProps are passed to deserializeConnections implementation in
    // compass-main-storage. Known props passed are:
    // { context: 'CLI' | 'connectionsList' | 'menuBar' }
    trackingProps?: Record<string, unknown>;
  }>({
    opened: false,
  });
  const [exportModalState, setExportModalState] = useState<{
    opened: boolean;
    // trackingProps are passed to serializeConnections implementation in
    // compass-main-storage. Known props passed are:
    // { context: 'CLI' | 'connectionsList' | 'menuBar' }
    trackingProps?: Record<string, unknown>;
  }>({
    opened: false,
  });

  const setImportModalOpen = useCallback(
    (isOpened: boolean, trackingProps?: Record<string, unknown>) => {
      setImportModalState({
        opened: isOpened,
        trackingProps,
      });
    },
    []
  );

  const openConnectionImportModal = useCallback(
    (trackingProps?: Record<string, unknown>) => {
      setImportModalState({
        opened: true,
        trackingProps,
      });
    },
    []
  );

  const setExportModalOpen = useCallback(
    (isOpened: boolean, trackingProps?: Record<string, unknown>) => {
      setExportModalState({
        opened: isOpened,
        trackingProps,
      });
    },
    []
  );

  const openConnectionExportModal = useCallback(
    (trackingProps?: Record<string, unknown>) => {
      setExportModalState({
        opened: true,
        trackingProps,
      });
    },
    []
  );

  const connectionImportExportServiceRef =
    useRef<ConnectionImportExportService>({
      getHandlers() {
        return {
          openConnectionImportModal,
          openConnectionExportModal,
        };
      },
    });

  return (
    <ConnectionImportExportServiceContext.Provider
      value={connectionImportExportServiceRef.current}
    >
      {children}
      <ImportConnectionsModal
        open={importModalState.opened}
        setOpen={setImportModalOpen}
        trackingProps={importModalState.trackingProps}
      />
      <ExportConnectionsModal
        open={exportModalState.opened}
        setOpen={setExportModalOpen}
        trackingProps={exportModalState.trackingProps}
      />
    </ConnectionImportExportServiceContext.Provider>
  );
};

export type ConnectionImportExportAction =
  | 'import-saved-connections'
  | 'export-saved-connections';

export const useOpenConnectionImportExportModal = (
  trackingProps?: Record<string, unknown>
): {
  supportsConnectionImportExport: boolean;
  openConnectionImportExportModal: (
    action: ConnectionImportExportAction
  ) => void;
} => {
  const service = useContext(ConnectionImportExportServiceContext);
  if (!service) {
    return {
      supportsConnectionImportExport: false,
      openConnectionImportExportModal() {
        // noop
      },
    };
  }

  return {
    supportsConnectionImportExport: true,
    openConnectionImportExportModal(action: ConnectionImportExportAction) {
      if (action === 'import-saved-connections') {
        service.getHandlers().openConnectionImportModal(trackingProps);
      } else if (action === 'export-saved-connections') {
        service.getHandlers().openConnectionExportModal(trackingProps);
      } else {
        throw new Error(`Unidentified action ${action} passed to handler`);
      }
    },
  };
};
