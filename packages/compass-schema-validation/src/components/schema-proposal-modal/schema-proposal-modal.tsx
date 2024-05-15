import React, { useCallback } from 'react';
// import { connect } from 'react-redux';
import { Body, FormModal } from '@mongodb-js/compass-components';

export function SchemaProposalModal({
  generateValidator,
  isVisible,
  close,
}: {
  generateValidator: () => void;
  isVisible: boolean;
  close: () => void;
}) {
  const handleSubmit = useCallback(() => {
    generateValidator();
    close();
  }, [generateValidator, close]);

  return (
    <FormModal
      title="Connection info"
      open={isVisible}
      onCancel={close}
      onSubmit={handleSubmit}
      size="small"
      data-testid="connection-info-modal"
      submitButtonText="Draft validation"
    >
      <Body>
        We will analyze a sample of the collection data, and propose validation
        rules based on that sample.
        <br />
        <br />
        We suggest to review the rules before you save them, and consider if
        they make sense for your dataset.
      </Body>
    </FormModal>
  );
}

export default SchemaProposalModal;

// const mapStateToProps = (
//   state: RootState,
// ) => {
// };

// const MappedSchemaProposalModal = connect(
//   mapStateToProps,
//   {}
// )(SchemaProposalModal);

// export default MappedSchemaProposalModal;
