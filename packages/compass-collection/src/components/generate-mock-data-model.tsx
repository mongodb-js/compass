import React, { useEffect, useState } from 'react';

import { Chip, Variant } from '@leafygreen-ui/chip';
import {
  Body,
  css,
  Combobox,
  ComboboxOption,
} from '@mongodb-js/compass-components';

import { Size } from '@leafygreen-ui/select';
import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ButtonVariant,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { CollectionState } from '../../modules/collection-tab';

const columnStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const rowStyles = css`
  display: flex;
  gap: 4px;
  flex-direction: column;
  width: 256px;
`;

const NavigationButtonsContainerStyle = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 20px;
`;

const footerStyles = css({
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const rightButtonsStyles = css`
  display: flex;
  gap: 8px;
  flex-direction: row;
`;

const RightButtonsContainerStyle = css``;

type MockDataGeneratorModalState = {
  collections: Array<string>;
};

const MockDataGeneratorModal: React.FunctionComponent<
  MockDataGeneratorModalState & {
    modalOpen: boolean;
    onModalClose: () => void;
    dbName: string;
    collName: string;
    collections: Array<string>;
  }
> = ({ modalOpen, onModalClose, dbName, collName, collections }) => {
  const [selectedRelatedCollections, setSelectedRelatedCollections] = useState<
    Array<string>
  >([]);

  if (!modalOpen) {
    return null;
  }

  const onCollectionSelect = (selectedCollection: Array<string>) => {
    setSelectedRelatedCollections(selectedCollection);
  };

  return (
    <Modal
      open={modalOpen}
      setOpen={onModalClose}
      data-testid="generate-mock-data-modal"
    >
      <ModalHeader title="Generate Mock Data" />
      <ModalBody>
        <div className={columnStyles}>
          <div className={rowStyles}>
            <Body weight="medium">Database</Body>
            <Chip variant={Variant.Gray} label={dbName}>
              {dbName}
            </Chip>
          </div>

          <div className={rowStyles}>
            <Body weight="medium">Collection</Body>
            <Chip variant={Variant.Gray} label={collName}>
              {collName}
            </Chip>
          </div>
        </div>
      </ModalBody>

      <Combobox
        data-testid="generate-mock-data-combobox"
        clearable={true}
        multiselect={true}
        label="Related Collections (Optional)"
        searchEmptyMessage="No collection found"
        onChange={onCollectionSelect}
        value={selectedRelatedCollections}
        size={Size.Small}
      >
        {collections.map((collection) => {
          return (
            <ComboboxOption key={collection} value={collection}>
              {collection}
            </ComboboxOption>
          );
        })}
      </Combobox>

      <ModalFooter className={footerStyles}>
        <Button>Back</Button>
        <div className={rightButtonsStyles}>
          <Button>Cancel</Button>
          <Button variant={ButtonVariant.Primary}>Next</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

const mapStateToProps = (state: CollectionState) => ({
  collections: state.collections,
});

const MappedExportToLanguageModal = connect(
  mapStateToProps,
  {}
)(MockDataGeneratorModal);

export default MockDataGeneratorModal;
