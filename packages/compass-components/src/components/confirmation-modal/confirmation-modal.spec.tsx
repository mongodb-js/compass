import React from 'react';
import { shallow } from 'enzyme';
import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';
import assert from 'assert';

import ConfirmationModal from './';

describe('App', () => {
  it('should show a leafygreen-ui confirmation modal', () => {
    const wrapper = shallow(
      <ConfirmationModal
        title="modal"
        buttonText="ok"
      ><div /></ConfirmationModal>
    );

    assert(wrapper.find(LeafyGreenConfirmationModal).exists());
  });
});
