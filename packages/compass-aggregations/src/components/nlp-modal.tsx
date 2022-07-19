import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Modal, ModalTitle } from '@mongodb-js/compass-components';
// TODO: Add to imports.
import { NLPQueryPlugin } from '@mongodb-js/compass-nlp-query';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';

import type { RootState } from '../modules';

type NLPModalProps = {
  appRegistry: {
    appRegistry: AppRegistry;
    localAppRegistry: AppRegistry;
  };
  namespace: string;
  dataService: DataService;
};

export const NLPModal: React.FunctionComponent<NLPModalProps> = ({
  appRegistry,
  dataService,
  namespace
}) => {
  const [ isOpen, setOpen ] = useState(false);

  useEffect(() => {
    function onOpenNLPModal() {
      setOpen(true);
    }

    function onShowAggregationInEditor() {
      setOpen(false);
    }

    appRegistry.localAppRegistry.on('show-nlp-modal', onOpenNLPModal);
    appRegistry.localAppRegistry.on(
      'open-aggregation-in-editor',
      onShowAggregationInEditor
    );

    return () => {
      appRegistry.localAppRegistry.removeListener(
        'show-nlp-modal',
        onOpenNLPModal
      );
      appRegistry.localAppRegistry.removeListener(
        'open-aggregation-in-editor',
        onShowAggregationInEditor
      );
    };
  }, [ appRegistry ]);

  return (
    <>
      <Modal
        open={isOpen}
        setOpen={setOpen}
      >
        <ModalTitle>Create Pipeline</ModalTitle>
        <NLPQueryPlugin
          dataService={dataService}
          noPadding
          namespace={namespace}
          localAppRegistry={appRegistry.localAppRegistry}
        />
        <div style={{padding: '16px', margin: '16px'}}></div>
      </Modal>
    </>
  );
};

const mapState = ({ appRegistry, dataService, namespace }: RootState) => ({
  appRegistry,
  dataService: dataService.dataService,
  namespace
});

export default connect(mapState)(NLPModal);
