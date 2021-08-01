import React from 'react';
// import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';

type Props = {
  isDataLake: boolean
}

function Tab(
  props: Props
  // props: React.ComponentProps<typeof LeafyGreenConfirmationModal>
): React.ReactElement {
  console.log('render Tab, props', props);

  return (
    <div
      // {...props}
    >
      Compass Tab
    </div>
  );
}

export default Tab;
